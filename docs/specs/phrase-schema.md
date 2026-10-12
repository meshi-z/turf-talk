# フレーズデータ仕様書 (Phrase Data Schema)

本ドキュメントは、「TurfTalk」におけるクイズ出題用フレーズマスターデータの構造および定義ルールを定めます。

---

## 1. データモデル設計 (TypeScript Definition)

```typescript
export type PhraseCategory = 'feel' | 'tactics' | 'reaction' | 'comment';
export type PhraseLevel = 'beginner' | 'intermediate';

export interface QuizOption {
  id: string;          // 選択肢識別子 (例: "opt-1")
  text: string;        // 日本語の選択肢テキスト
  isCorrect: boolean;  // 正解フラグ (4つのうち1つが true)
}

export interface PhraseItem {
  id: string;                  // 一意のID (例: "phrase-001" 〜 "phrase-030")
  situation: string;           // レース前後の文脈 (例: "G1勝利騎手インタビュー（道中の手応え）")
  phrase: string;              // 実際の競馬英語フレーズ
  literalTranslation?: string; // 直訳・字義通りの意味（補足用）
  options: QuizOption[];       // 4択の選択肢リスト（必ず4肢、正解1つ）
  explanation: string;         // 競馬ファン向けワンポイント解説（1〜2行）
  category: PhraseCategory;    // カテゴリ
  level: PhraseLevel;          // 難易度（beginner: 初級, intermediate: 中級）
}
```

---

## 2. カテゴリ定義 & 収録数（Phase 1: 全30問）

| カテゴリ | キー | 収録数 | 概要・主な収録フレーズ例 |
| :--- | :--- | :---: | :--- |
| **手応え・感触** | `feel` | 8問 | `plenty in the tank`（手応え抜群・余力十分）、`on the bridle`（ハミ受け良好）、`travelling sweetly`（リズム抜群）、`full of running`（余力満点）、`off the bridle`（手が動く）、`cruising`（持ったまま）、`empty`（ガス欠）、`keen / pulling hard`（折り合い欠く） |
| **仕掛け・展開** | `tactics` | 8問 | `pushed the button`（ゴーサインを出す）、`set the pace`（ペースを作る・逃げる）、`kicked on`（再加速・突き放す）、`boxed in`（前が壁）、`in a handy position`（好位）、`made all`（逃げ切り勝ち）、`sat chilly`（じっくり我慢）、`committed too early`（早仕掛け） |
| **勝負根性・反応** | `reaction` | 7問 | `dug deep`（勝負根性を発揮）、`found more`（もうひと伸び）、`put the race to bed`（一瞬で勝負を決める）、`responded generously`（素直に応える）、`hung left`（モタれる・ササる）、`hit the front too soon`（ソラを使う）、`found nothing`（反応なし） |
| **コメント・総括** | `comment` | 7問 | `didn’t handle the ground`（馬場が合わなかった）、`special horse / freak`（桁違いの怪物）、`blown away`（完敗）、`needed the run`（叩きが必要）、`stayed every yard`（距離克服）、`unlucky in running`（不利で不完全燃焼）、`bounced back`（巻き返し） |

---

## 3. データ作成規約（Single Source of Truth 原則）

1. **実在する競馬表現の厳守**:
   - 海外競馬公式中継、主要G1勝利騎手・調教師インタビュー、大手競馬メディア（Racing Post, Sporting Life等）の実用例に準拠する。
2. **直感的な解説文**:
   - 英文法の詳細説明は避け、「日本の競馬ファンがパドックやレース映像を見て腑に落ちる比喩・表現」でワンポイント解説を記述する。
3. **ダミー選択肢のリアリティ**:
   - 誤答の3肢も「競馬のレース中やインタビューで実際にありそうなシチュエーション」にすることで、クイズとしての納得感と学習効果を高める。
4. **設問シチュエーション（situation）のネタバレ防止と文脈提示原則**:
   - `situation` は発言場面や話者の状況（例: 「直線入り口での先頭馬の仕掛けについて」「レース後の騎手インタビュー」）の提示に留める。
   - レースの勝敗結果、馬の具体的な成否・挙動（例: 「逃げ切った」「進路を失った」「理想的なリズムで」等）を断定・過剰開示しない。
   - フレーズの意味を読まずに `situation` の文言やポジティブ/ネガティブのニュアンスだけで正答が絞り込めてしまわないよう、中立的かつ自然な文脈提示を徹底する。

---

## 4. 出題制御 & ローテーション仕様 (Rotation & Shuffling Specification)

1. **デイリー出題エンジン (`src/lib/dailyRotation.ts`)**:
   - 日付文字列（`YYYY-MM-DD`）から32bit数値をハッシュ生成し、Mulberry32 PRNGによるシード付き乱数を用いて出題3問を選出。
   - 同一日であれば、画面の再訪やリロードを行っても同一の3問を決定論的に出題。
2. **未履修優先ローテーション**:
   - マスターデータ（全30問）から未履修フレーズを最優先で出題。
   - 残り未履修が1〜2問の場合は既習フレーズから補填して常に1日3問を維持。
   - 全問履修完了後は復習モード（`isReview: true`）として全問から日替わり出題を行い、周回数（`lapCount`）を加算して次周回を再循環。
3. **選択肢シャッフル（動的順序）**:
   - 同一の問題であっても、クイズを開くたびに4つの選択肢（`options`）の並び順をランダムにシャッフルして表示。固定位置での暗記を防止。
4. **学習進捗の永続化 & 習得判定 (`src/hooks/useTrainingProgress.ts`)**:
   - LocalStorage（`turftalk_user_progress_v1`）に `learnedPhraseIds`、`todayPhraseIds`、および `lapCount` を記録・同期。
   - **正答フレーズのみの習得記録**: クイズ完了時、正解（`isCorrect === true`）したフレーズIDのみを `learnedPhraseIds` に追加。誤答したフレーズは未習得のまま維持され、次回以降の出題候補に残る。
   - **本日のフレーズ復習モード**: 当日調教完了後（`completedToday: true`）に「本日のフレーズを復習する」を実行した場合、当日に出題された3問（`todayPhraseIds`）を対象として復習クイズが出題される（選択肢は開くたびに動的シャッフル）。復習時に正解したフレーズも新たに `learnedPhraseIds` に反映される。
5. **午前4時（28時）更新 & 連続学習日数（ストリーク）管理 (`src/lib/logicalDate.ts`)**:
   - **午前4時更新（28時締め）**: 深夜帯（24:00〜翌03:59）のアクセス・学習は前日分の調教として継続できるよう、実日時から4時間減算した論理日付（`getLogicalDate()`）を基準に日付・出題・完了判定を実施。午前4時を跨ぐことで翌日扱いに切り替わる。
   - **連続学習日数（ストリーク）判定**:
     - 前回調教完了日（`lastTrainingDate`）と当日論理日付との差分を比較。
     - 昨日受講済み（差分1日）からの受講: `streakDays + 1`
     - 同日内の復習受講（差分0日）: ストリーク日数は増やさず維持。
     - 1日以上未受講が空いた場合（差分2日以上）: にんじん所持数が不足していればストリークは `0` にリセット。
6. **愛馬の余力温存ボーナス & にんじんストリーク救済システム (`src/lib/carrotBonus.ts`)**:
   - **「愛馬の余力」と温存還元**:
     - 平日調教（好調3日: 1回、絶好調4〜5日: 2回）で得られるレースヒントの呼称を「愛馬の余力（残X回）」と定義。
     - レース中に余力を使わずにゴール（温存）した場合、未使用回数分の「にんじん 🥕」をご褒美として獲得（最大所持上限 3個）。
   - **にんじん自動消費によるストリーク救済**:
     - 未受講日が発生した際、所持にんじんがあれば自動消費して連続日数を維持（1日未受講につき1個消費、最大3日分まで連続補填可能）。
     - 直近で救済が発動した場合、ホーム画面に愛馬のにんじん救済通知バナーを表示。


