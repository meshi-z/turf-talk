# バックエンド・クラウドアーキテクチャ仕様書 (Backend & Cloud Architecture)

本ドキュメントは、「TurfTalk」におけるFirebase / Google Cloudを活用したバックエンド基盤、ユーザー認証、データ同期、コンテンツ配信、およびサービス管理者向け分析・運用機能の仕様を定めます。

---

## 1. 全体アーキテクチャ概要 (System Overview)

TurfTalkは、サーバー常時稼働コストをゼロに抑えつつ、オフライン対応・高速表示・リアルタイムデータ同期・管理者向け高度分析を両立させるため、**Google Cloud / Firebase のマネージドサーバーレスアーキテクチャ** を採用します。

```mermaid
flowchart TD
    subgraph Client [クライアント (Vite + React SPA / PWA)]
        UI[TurfTalk Web App]
        SW[Service Worker / Cache]
        OfflineDB[Firestore Local Cache]
    end

    subgraph FirebaseHosting [配信基盤]
        CDN[Firebase Hosting<br>グローバルCDN / SSL]
    end

    subgraph FirebaseBackend [認証 & データベース]
        Auth[Firebase Authentication<br>匿名認証 / Google SSO / X SSO]
        Firestore[(Cloud Firestore<br>NoSQL Database)]
    end

    subgraph AdminAnalytics [管理者・分析基盤]
        Analytics[Firebase Analytics]
        BigQuery[(Google BigQuery<br>DWH / 生ログ・進捗蓄積)]
        LookerStudio[Looker Studio<br>管理者ダッシュボード]
    end

    CDN --> UI
    UI <--> Auth
    UI <--> Firestore
    UI --> Analytics
    Firestore --> OfflineDB
    Analytics --> BigQuery
    Firestore -.->|Extension自動同期| BigQuery
    BigQuery --> LookerStudio
```

---

## 2. ユーザー認証仕様 (Authentication Specification)

ユーザーの参入障壁を極小化するため、**「初回匿名認証（ゲスト利用） ➡ 任意タイミングでのソーシャル連携（データ保持）」** の2段階認証モデルを採用します。

### 2.1 認証プロバイダ
1. **匿名認証 (Anonymous Auth)**:
   - アプリ初回アクセス時に裏側で自動発行。会員登録画面を出さずに即座に全機能を利用可能。
   - 発行された `uid` をキーとして、学習進捗や愛馬データをFirestoreに保存。
2. **Google アカウント SSO**:
   - `GoogleAuthProvider` を利用した1タップログイン。
3. **X (Twitter) SSO**:
   - `TwitterAuthProvider` によるOAuth連携（競馬ファンのコミュニティ親和性に対応）。

### 2.2 アカウント昇格（Link With Credential）
- 匿名状態で利用していたユーザーが「バックアップ」「機種変更」「他端末同期」を希望した際、`linkWithPopup` を実行。
- **既存の `uid` およびFirestoreに蓄積された調教履歴・愛馬データ・ストリークを100%維持したまま**、GoogleまたはXのアカウントと紐付けを完了する。

---

## 3. データベース設計 (Cloud Firestore Schema)

### 3.1 コレクション構造一覧

```text
firestore
├── users/ (ユーザー進捗 & プロフィール)
│   └── {uid}/
│       └── (ドキュメント: 進捗、愛馬、サマリー値)
├── phrases/ (動的配信フレーズマスター: 任意拡張)
│   └── {phraseId}/
│       └── (ドキュメント: 問題定義、解説、公開フラグ)
└── ghost_races/ (擬似マッチレース用ゴーストデータ: 将来拡張)
    └── {raceId}/
        └── (ドキュメント: クラス、解答秒数配列、愛馬外見)
```

### 3.2 ユーザー進捗ドキュメント (`users/{uid}`)
管理者による一覧検索・集計負荷を軽減するため、**トップレベルに検索用サマリー項目（`summary`）を併せ持つ** 設計とします。

```typescript
export interface UserDocument {
  // ── 基本プロフィール・認証情報 ──
  uid: string;
  isAnonymous: boolean;
  providerId: 'anonymous' | 'google.com' | 'twitter.com';
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  lastActiveAt: FirebaseFirestore.Timestamp; // 最終アクセス日時

  // ── 管理者用・一覧検索用サマリー項目 (集計・ソートの高速化) ──
  learnedCount: number;         // 履修済み問題数 (learnedPhraseIds.length)
  progressPercent: number;      // 消化率 (0.0 〜 100.0)
  streakDays: number;           // 連続学習日数
  carrotCount: number;          // 所持にんじん数
  currentHorseName: string;     // 現在の愛馬名
  currentHorseClass: string;    // 現在の競走馬クラス (例: "Debut", "G1", "Open")
  currentHorseWeek: number;     // キャリア週 (1〜4)
  totalRaceWins: number;        // 通算勝利数
  totalHallOfFameCount: number; // 殿堂入り頭数

  // ── クライアント完全復元用ペイロード (UserProgress互換) ──
  progressData: {
    lastTrainingDate: string | null;
    condition: string;
    horseWeight: number;
    completedToday: boolean;
    learnedPhraseIds: string[];
    lapCount: number;
    todayPhraseIds: string[];
    todayWoodchipPhraseIds: string[];
    completedCoursesToday: string[];
    weekdayTrainingDays: number;
    lastCarrotUsedDate: string | null;
    currentWeekMonday: string | null;
    lastRaceWeekMonday: string | null;
    hasCompletedWeeklyRace: boolean;
    careerHorse: any; // CareerHorse
    hallOfFame: any[]; // HallOfFameHorse[]
    bookmarkedPhraseIds: string[];
    phrasePartners: Record<string, any>;
  };
}
```

### 3.3 セキュリティルール (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザー進捗: 本人のみ読み書き可能。管理者は読み取り可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth.token.admin == true;
    }
    
    // フレーズマスター: 全員読み取り可能。管理者のみ書き込み可能
    match /phrases/{phraseId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

---

## 4. コンテンツ管理・動的配信仕様 (Content Management)

### 4.1 ハイブリッド・マージ方式
通信環境の悪い場所でも即座にクイズを開けるよう、**「ローカル静的マスター + Firestore追加マスター」** のハイブリッド構成を採用します。

1. **初期起動時**:
   - アプリ内に内包された `INITIAL_PHRASES`（全120問）を即座に読み込み、ローディング待ちなしで描画。
2. **バックグラウンド同期**:
   - Firestoreの `phrases` コレクションから新設・更新フレーズを取得し、ローカルマスターとID基準でマージ・キャッシュ（IndexedDB / LocalStorage）。
3. **効果**:
   - アプリの再ビルドやストア申請を行うことなく、管理者がFirestoreへ新フレーズを追加するだけで即時全ユーザーへ新問が配信される。

---

## 5. サービス管理者向け機能 & 分析基盤仕様 (Admin Analytics)

管理者が「問題の消化率」「ユーザーの継続率」「問題追加のタイミング」「競走馬の成績傾向」をリアルタイムに把握するための基盤仕様です。

### 5.1 分析パイプライン (BigQuery & Looker Studio)
1. **Firestore to BigQuery 同期**:
   - Firebase公式拡張機能「Stream Collections to BigQuery」を使用し、`users` コレクションの更新差分を生ログとしてリアルタイムにBigQueryへ転送。
2. **Firebase Analytics イベント送信**:
   - クライアント側から以下のカスタムイベントを送信：
     - `training_completed`: `{ course: 'uphill', score: 3, duration_sec: 25 }`
     - `race_completed`: `{ grade: 'G1', placement: 1, horse_name: '...' }`
     - `horse_retired`: `{ generation: 2, total_wins: 4, hall_of_fame: true }`

### 5.2 管理者ダッシュボード指標 (Looker Studio 表示項目)
Googleの無料BIツール「Looker Studio」を用いて以下のダッシュボードを構築します。

| ダッシュボード画面 | 主要可視化指標 | 運用・意思決定への活用 |
| :--- | :--- | :--- |
| **コンテンツ健全性 ＆ 消化率** | ・全ユーザーの平均消化率分布（ヒストグラム）<br>・未消化問題数が10問以下の「コンテンツ枯渇ユーザー数」推移<br>・全問制覇ユーザー数 | **「いつ新問題を追加すべきか」の判断基準**。<br>枯渇ユーザーが全体の15%を超えたら新問題パックを投入。 |
| **問題クオリティ・難易度分析** | ・フレーズごとの正答率一覧（昇順/降順）<br>・問題ごとの平均解答所要時間<br>・復習ブックマーク追加頻度 | 正答率が20%未満の問題の解説改訂、または選択肢の誤認・タイポ検知。 |
| **ユーザー継続率 (リテンション)** | ・翌日継続率 (Day 1)、週間継続率 (Day 7)、月間継続率 (Day 30)<br>・ストリーク維持ユーザーの割合<br>・にんじん所持・消費ペース | 新規獲得後の離脱ポイント（初週レース前など）の特定とUI改善。 |
| **競走馬成績 ＆ 路線動向** | ・選択路線（クラシック・短距離・ダート等）の人気分布<br>・クラス別勝率、G1制覇率<br>・殿堂入り達成率 | ゲームバランス（難易度・余力ヒント数・各路線のライバル強度）の調整。 |

---

## 6. コスト・スケーラビリティ要件

- **目標コスト**:
  - MAU 5,000人規模まで **月額0円〜数十円（Google Cloud無料枠内）** で運用。
- **読み書き最適化**:
  - クイズ解答1問ごとにFirestoreへ書き込まず、**「1回の調教完了時」「レース完了時」にまとめて1回書き込み** を行うことで、Firestore書き込み無料枠（1日2万回）を消費し尽くさない設計を徹底する。
