# フレーズデータ仕様書 (Phrase Data Schema)

本ドキュメントは、「TurfTalk」におけるクイズ出題用フレーズマスターデータの構造および定義ルールを定めます。

---

## 1. データモデル設計 (TypeScript Definition)

```typescript
export type PhraseCategory = 'feel' | 'tactics' | 'reaction' | 'comment';
export type PhraseLevel = 'beginner' | 'intermediate';
export type PhraseType = 'phrase' | 'vocabulary'; // phrase: 実戦フレーズ（坂路調教）, vocabulary: 基礎単語・競馬用語（ウッドチップ調教）

export interface QuizOption {
  id: string;          // 選択肢識別子 (例: "opt-1")
  text: string;        // 日本語の選択肢テキスト
  isCorrect: boolean;  // 正解フラグ (4つのうち1つが true)
}

export interface PhraseItem {
  id: string;                  // 一意のID (例: "phrase-001" 〜 "phrase-060", "vocab-001" 〜 "vocab-060")
  situation: string;           // レース前後の文脈 (例: "G1勝利騎手インタビュー（道中の手応え）")
  phrase: string;              // 実際の競馬英語フレーズ・用語
  type?: PhraseType;           // フレーズ種別 ('phrase' | 'vocabulary')
  literalTranslation?: string; // 直訳・字義通りの意味（補足用）
  options: QuizOption[];       // 4択の選択肢リスト（必ず4肢、正解1つ）
  explanation: string;         // 競馬ファン向けワンポイント解説（1〜2行）
  category: PhraseCategory;    // カテゴリ
  level: PhraseLevel;          // 難易度（beginner: 初級, intermediate: 中級）
}
```

---

## 2. カテゴリ定義 & 収録数（Phase 2: 全120問規模）

TurfTalkでは、実戦フレーズを学ぶ「🌿 坂路調教（60問）」と、基礎単語・競馬用語を学ぶ「🪵 ウッドチップ調教（60問）」の2コース・合計120問のマスターデータを収録しています。

### A. 坂路調教マスター（実戦フレーズ: 全60問）

| カテゴリ | キー | 収録数 | 概要・主な収録フレーズ例 |
| :--- | :--- | :---: | :--- |
| **手応え・感触** | `feel` | 15問 | `plenty in the tank`（手応え抜群・余力十分）、`on the bridle`（ハミ受け良好）、`travelling sweetly`（リズム抜群）、`full of running`（余力満点）、`off the bridle`（手が動く）、`cruising`（持ったまま）、`empty`（ガス欠）、`keen / pulling hard`（折り合い欠く）、`under pressure`（手元が激しく動く）、`bridle horse`（調教駆けタイプ）、`travel on the rail`（ラチ沿い好追走）、`drop the bridle`（折り合いがつく）、`on the bit`（気合乗り十分）、`run green`（若さを見せる）、`not travelling`（ズブい・進まない） |
| **仕掛け・展開** | `tactics` | 16問 | `pushed the button`（ゴーサインを出す）、`set the pace`（ペースを作る・逃げる）、`kicked on`（再加速・突き放す）、`boxed in`（前が壁）、`in a handy position`（好位）、`made all`（逃げ切り勝ち）、`sat chilly`（じっくり我慢）、`committed too early`（早仕掛け）、`stumble at the break`（出遅れ・躓き）、`steal a march`（出し抜け奇襲）、`track the leaders`（好位マーク）、`brave man’s route`（内ラチ突入）、`switch outside`（外へ切り替え）、`wire-to-wire`（完全逃げ切り）、`sit in slipstream`（風除け追走）、`stalk the pace`（番手マーク） |
| **勝負根性・反応** | `reaction` | 15問 | `dug deep`（勝負根性を発揮）、`found more`（もうひと伸び）、`put the race to bed`（一瞬で勝負を決める）、`responded generously`（素直に応える）、`hung left`（モタれる・ササる）、`hit the front too soon`（ソラを使う）、`found nothing`（反応なし）、`quicken in an instant`（一瞬のギアチェンジ）、`battle back`（差し返す根性）、`headed on the line`（ゴール寸前ハナ差惜敗）、`pin ears back`（耳を絞って全力力走）、`fade away`（直線で脚が上がる）、`find an extra gear`（トップギア突入）、`drift under the whip`（ステッキにヨレる）、`answer every call`（騎手の合図に完ぺきに応答） |
| **コメント・総括** | `comment` | 14問 | `didn’t handle the ground`（馬場が合わなかった）、`special horse / freak`（桁違いの怪物）、`blown away`（完敗）、`needed the run`（叩きが必要）、`stayed every yard`（距離克服）、`unlucky in running`（不利で不完全燃焼）、`bounced back`（巻き返し）、`testing conditions`（過酷なタフ重馬場）、`drop in trip`（距離短縮）、`look a picture`（パドック最高の仕上がり）、`sounder surface`（良馬場・速い馬場）、`caught flat-footed`（瞬発戦で置かれる）、`one for the notebook`（次走特注馬）、`weight told`（斤量差が響いた） |

### B. ウッドチップ調教マスター（基礎単語・競馬用語: 全60問 / JRA海外競馬英和辞典 公式準拠）

| カテゴリ | キー | 収録数 | 概要・主な収録用語例 |
| :--- | :--- | :---: | :--- |
| **馬場状態・コース条件** | `feel` | 15問 | `Going / Ground`（馬場状態）、`Yielding`（稍重）、`Good to Soft`（やや重めの良〜稍重）、`Soft`（重馬場）、`Heavy`（不良馬場）、`Firm`（硬めの良馬場）、`Undulating`（起伏に富んだコース）、`Straight / Home Straight`（直線コース）、`Turf`（芝コース）、`Dirt`（ダートコース）、`Rail`（内ラチ・柵）、`Chute`（引き込み線・ポケット）、`GoingStick`（馬場硬度測定器）、`False Straight`（偽の直線・ダミー直線）、`Tight-turning`（小回りコース） |
| **レース展開・位置取り・馬具** | `tactics` | 15問 | `Pacesetter`（逃げ馬・ペースメーカー）、`Front-runner`（先行馬）、`Closer`（追い込み馬）、`Blinkers`（ブリンカー）、`Tongue-tie`（舌縛り）、`Cheekpieces`（チークピーシーズ）、`Visor`（バイザー）、`Hood`（メンコ）、`Barrier / Starting Gate`（発走ゲート）、`Post Position / Draw`（枠順・馬番）、`Pace`（レースの流れ・ペース）、`Gap`（馬群の隙間・進路）、`Rails run`（最内強襲・イン突き）、`Furlong`（1ハロン / 約201m）、`Break`（スタート・飛び出し） |
| **競走馬の挙動・気性・状態** | `reaction` | 15問 | `Turn of foot`（瞬発力・キレ味）、`Greenness`（若さ・粗削りさ）、`Tenacity`（勝負根性）、`Stamina`（持久力・スタミナ）、`Temperament`（気性・気質）、`Acceleration`（加速力・ギアチェンジ）、`Stride`（走法・フットワーク）、`Lugging`（内や外へササる癖）、`Biting`（噛みつき・威嚇）、`Sweating up`（パドックでの発汗・気負い）、`Refusal`（障害飛越拒否）、`Blow`（息づかい・呼吸）、`Agility`（敏捷性・小回り適性）、`Head carriage`（頭の高さ・首の使い方）、`Response`（騎手の扶助への反応） |
| **着差・裁決・成績・斤量** | `comment` | 15問 | `Nose`（ハナ差）、`Short Head`（短頭差）、`Head`（アタマ差）、`Neck`（クビ差）、`Length`（馬身差）、`Dead-heat`（同着）、`Disqualification`（失格）、`Demotion / Placed behind`（降着）、`Inquiry / Stewards' Inquiry`（審議）、`Objection`（異議申し立て）、`Handicap`（ハンデ戦・斤量）、`Weight-for-Age`（定量戦・馬齢重量）、`Allowance`（見習騎手減量）、`Track record`（コースレコード）、`Unplaced`（着外） |

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
7. **追加トレーニング（未習得フレーズの継続学習）仕様 (`src/lib/dailyRotation.ts`)**:
   - **目的**: 1日の調教（3問）完了後でも、学習意欲の高いユーザーが未習得フレーズを何回でも継続して学べるようにする。
   - **出題配分アルゴリズム (`selectExtraTrainingPhrases`)**:
     - 原則として「未習得プールから2問 ＋ 習得済みプールから1問」（計3問）をランダム選出。
     - 未習得プールが1問のみの場合は未習得1問＋習得済み2問で3問を確保。
     - 全フレーズ習得済みの場合は全問（習得済み）からランダムに3問選出（全問復習モード）。
     - 習得済みが0問の場合は未習得プールから3問選出。
     - 選択肢は動的にシャッフルして出題。
   - **ゲームバランスとデータの保護**:
     - 連続学習日数（ストリーク）および平日調教消化日数（0〜5日）は増加させず、1日1回分のみを維持（にんじん補填システムや週末レースサイクルの価値を保護）。
     - その日の初回の通常調教3問（`todayPhraseIds`）は上書きせず保護し、「本日のフレーズを復習する」ボタンからいつでも再受講可能。
     - セッション完了時に、正解した未習得フレーズは `learnedPhraseIds` に安全に加算・反映。
8. **コース選択型調教システム（坂路調教 & ウッドチップ調教）仕様**:
   - **コース構成**:
     - 🌿 **坂路調教**: 実戦フレーズ（60問マスターから3問選出）
     - 🪵 **ウッドチップ調教**: 基礎単語・競馬用語（60問マスターから3問選出 / JRA公式海外競馬英和辞典準拠）
   - **デイリー達成判定（いずれか一方完了ルール）**:
     - 「坂路調教」または「ウッドチップ調教」のどちらか一方を完了した時点で、当日の調教完了（`completedToday: true`、ストリーク維持、週間調教日数+1、週末レース出走権解放）が達成される。
     - 片方の調教完了後も、もう一方のコースを受講可能。同日に両コースを受講・完了した場合でも、同日ガードによりストリーク日数および週間調教日数は重複加算されず、正解した問題のみが `learnedPhraseIds` に安全に蓄積される。
     - 各コースそれぞれに「今日の3問復習」および「追加トレーニング（新しい3問）」が独立して提供される。
9. **週末レースのハイブリッド出題仕様（第1〜2問: 基礎単語 ➡ 第3〜5問: 実戦フレーズ） (`src/lib/raceMode.ts`)**:
   - **目的**: 単語・用語モード（ウッドチップ調教）の導入に伴い、週末レース（全5問）を「基礎単語」から「実戦フレーズ」へと段階的に発展するハイブリッド出題構成に拡張。
   - **構成比率**:
     - **第1〜2問（基礎単語・競馬用語）**: `type === 'vocabulary'` の母集団から選出。レース序盤（パドック、馬場状態、ゲート発走、位置取りなど）の基礎用語を問う。
     - **第3〜5問（実戦フレーズ）**: `type !== 'vocabulary'`（実戦フレーズ）の母集団から選出。レース終盤（直線の攻防、勝負根性、ゴール前叩き合い、レース後総括など）の実践的表現を問う。
   - **選出アルゴリズム (`selectPoolQuestions`)**:
     - 単語プール（60問）およびフレーズプール（60問）それぞれにおいて、独立して以下の優先順位で選出：
       1. 履修済み問題（`learnedPhraseIds` に含まれる問題）を最優先
       2. 当該週のテーマカテゴリ（`themeCategory`）に合致する問題を優先
       3. 履修済み問題で目標問数に達しない場合は未履修問題から補填
       4. 万が一特定プールが枯渇・不足した場合は全問題プールからフォールバック
   - **愛馬の余力（ヒント機能）との連動**:
     - 第1〜2問の単語クイズ、第3〜5問のフレーズクイズのいずれにおいても、平日調教で獲得した「愛馬の余力（`eliminateOneWrongOption`）」がそのまま完全に機能。
