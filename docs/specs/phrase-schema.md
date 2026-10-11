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
  id: string;                  // 一意のID (例: "phrase-001")
  situation: string;           // レース前後の文脈 (例: "G1勝利騎手インタビュー（道中の手応え）")
  phrase: string;              // 実際の競馬英語フレーズ
  literalTranslation?: string; // 直訳・字義通りの意味（補足用）
  options: QuizOption[];       // 4択の選択肢リスト
  explanation: string;         // 競馬ファン向けワンポイント解説（1〜2行）
  category: PhraseCategory;    // カテゴリ（feel: 手応え, tactics: 仕掛け・展開, reaction: 反応, comment: コメント）
  level: PhraseLevel;          // 難易度（beginner: 初級, intermediate: 中級）
}
```

---

## 2. カテゴリ定義

| カテゴリ | キー | 概要・主な表現例 |
| :--- | :--- | :--- |
| **手応え・感触** | `feel` | 手応え十分（`plenty in the tank`）、ハミ受け良好（`on the bridle`）、行きっぷり |
| **仕掛け・展開** | `tactics` | スパート（`kick on`）、ペース判断（`set the pace`）、位置取り（`handy position`） |
| **馬の反応・勝負根性** | `reaction` | 根性を発揮（`dug deep`）、追って味がある（`found more`）、気合乗り |
| **騎手・陣営コメント** | `comment` | 勝利後の絶賛（`special horse`）、敗因分析（`didn't handle the ground`） |

---

## 3. データ作成規約（Single Source of Truth 原則）

1. **架空・不自然な英語表現の禁止**:
   - 海外競馬公式中継、主要G1勝利騎手・調教師インタビュー、大手競馬メディア（Racing Post等）の実用例に準拠する。
2. **直感的な解説文**:
   - 英文法の詳細説明は避け、「日本の競馬ファンがパドックやレース映像を見て腑に落ちる比喩・表現」でワンポイント解説を記述する。
3. **ダミー選択肢のリアリティ**:
   - 誤答の3肢も「競馬のレース中やインタビューで実際にありそうなシチュエーション」にすることで、クイズとしての納得感と学習効果を高める。
