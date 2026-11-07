# 変更履歴 (Changelog)

すべての重要な変更は本ドキュメントに記録されます。
フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づき、セマンティックバージョニングに準拠します。

---

## [v0.21.0] - 2026-11-07

### Added
- **サービスの使い方・学習サイクルを解説するヘルプガイド（モーダル）の実装 ([#109](https://github.com/meshi-z/turf-talk/issues/109)):**
  - **5ステップ構成のヘルプガイド定義と初回オンボーディング状態管理 (`src/lib/helpGuide.ts`):**
    - ① TurfTalkとは？（概要）、② 平日の調教サイクル（坂路・ウッドチップ・馬体重）、③ 週末レースと余力・にんじん、④ 4週間キャリアと引退式・世代継承、⑤ フレーズ図鑑 & 殿堂入りギャラリーの全5ステップ（`HELP_GUIDE_STEPS`）を定義。
    - LocalStorage（`turf_talk_help_guide_seen_v1`）を用いた初回アクセス判定（`hasSeenHelpGuide`）および既読記録（`markHelpGuideSeen`）を実装。
  - **クラシック競馬デザインのヘルプモーダルコンポーネント (`src/components/HelpGuideModal.tsx`):**
    - ブリティッシュ・レーシンググリーン＆真鍮ゴールドのステッチヘッダー、ゼッケン番号バッジ（1〜5）によるタブ切り替え、前へ／次へ（最終ステップは「はじめる」）のステップ送り、キーボード左右矢印・Escapeキー操作に対応したダイアログを実装。
  - **ヘッダー・フッター導線と初回自動起動の組み込み (`src/components/Header.tsx`, `src/components/Footer.tsx`, `src/App.tsx`):**
    - ヘッダーのサウンド切替ボタン横にヘルプボタン（`HelpCircle` アイコン）、フッターに「使い方ガイド」リンクを設置し、クイズ回答中など任意の画面から中断なく開閉可能に。
  - **単体テストの追加 (`tests/help_guide.test.ts`):**
    - 全5ステップの定義構造検証およびオンボーディング既読ストレージ管理・例外安全性の単体テストを追加。

---

## [v0.20.0] - 2026-11-07

### Added
- **殿堂入りギャラリー専用背景イラスト制作と歴代愛馬イラスト表示の実装 ([#108](https://github.com/meshi-z/turf-talk/issues/108)):**
  - **殿堂入り専用背景イラストアセット（`bg_hall_of_fame.jpg`、1376×768px）の新規制作 (`src/assets/backgrounds/bg_hall_of_fame.jpg`):**
    - アンティーク・マホガニー木枠、ブリティッシュ・レーシンググリーンの別珍（ベルベット）ライナー、クラシック・ブラスゴールドの3重モールディングおよび上部ピクチャーライトを備えた「クラブハウス記念肖像フレーム」背景を制作。
    - フレーム内部の背景は黄金色の夕경（ゴールデンアワー）トーンに設計し、白毛（`#F7F9FC`）から青毛（`#2C2F35`）までJRA全8毛色のシルエットが高いコントラストで美しく際立つよう調整。
  - **背景オーバーライド機構と歴代愛馬カードの記念肖像画表示 (`src/lib/horseAssets.ts`, `src/components/HorseIllustration.tsx`, `src/components/HallOfFameScreen.tsx`):**
    - `HorseBackgroundType` に `'hall_of_fame'`（全8種）を追加し、`HorseIllustration` コンポーネントに任意の背景を指定できる `backgroundOverride?: HorseBackgroundType` プロパティを追加。
    - 殿堂入りギャラリー（`HallOfFameScreen`）の各愛馬カードに `<HorseIllustration color={horse.color} scene="standing_left" backgroundOverride="hall_of_fame" />` を組み込み、引退した歴代パートナー馬の毛色別立ち絵を額装ポートレートとして表示。
  - **単体テスト・仕様書の更新 (`tests/horse_assets.test.ts`, `docs/specs/horse-visual-assets.md`):**
    - 全8種背景アセットの存在確認およびURL解決テストを更新。

### Changed
- **競馬用語フレーズ図鑑・殿堂入りギャラリー・引退式画面の競馬デザイン統一 ([#107](https://github.com/meshi-z/turf-talk/issues/107)):**
  - **競馬用語フレーズ図鑑画面 (`src/components/PhraseBookScreen.tsx`):**
    - 背景・フィルター・フレーズカードをレーシングプログラム・アイボリー（`#FAF8F3` / `#FFFDF9`）およびクラシックゴールド枠（`#D4C9B5` / `#C59B27`）に統一。
    - 見出しと英語フレーズにセリフ体（`.font-racing-serif`）、習得数・達成率・通番に等幅数字（`.font-racing-num`）を適用。
    - コース表示の絵文字（`🌿` / `🪵`）をゼッケン番号バッジ（`.saddle-cloth-badge`：`1` 坂路、`2` ウッドチップ）に刷新し、フィルターやカード内の装飾絵文字を Lucide ベクターアイコン（`CheckCircle2`, `Clock`, `Star`, `Volume2`, `Radio`, `Lightbulb`, `Award`）に置換。
  - **殿堂入りギャラリー画面 (`src/components/HallOfFameScreen.tsx`):**
    - 統計サマリーバナーをブリティッシュ・レーシンググリーン（`#0D3322`）＆馬具ステッチ枠（`.racing-stitch-border`）のクラブハウス顕彰ボード仕様に刷新。
    - 歴代愛馬カードをクラブハウス記念プレート風デザイン（`#FFFDF9` 背景、`.saddle-cloth-badge` 世代バッジ、`.font-racing-serif` 二つ名・馬名、`.font-racing-num` 通算成績）に統一し、空状態や戦績の装飾絵文字を `Crown` / `Trophy` ベクターアイコンに置換。
  - **引退式・次世代継承画面 (`src/components/RetirementScreen.tsx`):**
    - 引退式セレモニーヘッダーの巨大な透かし絵文字（`👑`）を廃止し、サドルレザー＆ブラスゴールド（`#4A2511`〜`#1F0F06`）＋馬具ステッチ枠（`.racing-stitch-border`）の重厚な記念額装デザインに刷新。
    - 4週間戦績ボードをアイボリー調に、次世代愛馬指名カードをブリティッシュ・レーシンググリーン＋ステッチ枠に統一し、ボタンや見出しの絵文字（`🎖️`, `🌱`, `🎲`）をベクターアイコン（`Flag`, `Sparkles`, `Dices`）に置換。
- **愛馬イラストコンポーネント（HorseIllustration）のロケーション名オーバーレイの削除 ([#106](https://github.com/meshi-z/turf-talk/issues/106)):**
  - ホーム画面（牧場パドック）、調教完了画面（トレセン厩舎）、レース結果画面（ウィナーズサークル／クールダウン馬房）の愛馬立ち絵の左上に表示されていたロケーション名バッジ（`SCENE_LOCATION_BADGE_MAP`）を削除。
  - 背景イラストの雰囲気でシチュエーションが十分に伝わるため、文字オーバーレイを排して背景と愛馬立ち絵のみをクリアに表示し、画面の視覚的没入感とデザインの洗練度を向上。

---

## [v0.19.0] - 2026-11-07

### Added
- **競走馬シーン別背景イラスト素材制作と全6シーンへの背景合成組み込み ([#88](https://github.com/meshi-z/turf-talk/issues/88)):**
  - **シーン別背景イラストアセット（全7枚・1376×768px）の新規制作 (`src/assets/backgrounds/`):**
    - 牧場パドック（`bg_pasture.jpg`）、坂路調教コース（`bg_uphill_course.jpg`：左→右への緩やかな登坂サイドビュー）、ウッドチップ調教コース（`bg_woodchip_course.jpg`：左→右への水平サイドビュー）、厩舎・馬房（`bg_stable.jpg`）、芝本馬場（`bg_turf_race.jpg`：左→右への水平サイドビュー直線）、ダート本馬場（`bg_dirt_race.jpg`：左→右への水平サイドビュー直線）、ウィナーズサークル（`bg_winners_circle.jpg`）の7種を制作・配置。
  - **背景アセット解決・静止画立ち絵のCanvas背景透過ユーティリティ実装 (`src/lib/horseAssets.ts`):**
    - `HORSE_BACKGROUND_FILE_MAP`, `getBackgroundImageUrl`, `resolveStaticSceneBackground`, `resolveGallopSceneBackground` によるシーン・コース・馬場別の背景URL解決を実装。
    - 静止画立ち絵（1376×768px）の白背景を、外周4辺からのフラッドフィルおよび手綱・首間のピンポイント閉領域シード（`STATIC_CLOSED_REGION_SEEDS`）によって白毛（`#F7F9FC`）の馬体を保護しつつ綺麗に透過する `applyStaticSceneFloodFillTransparency` を実装。
  - **静止画立ち絵・スプライトアニメーションへの背景イラスト合成 (`src/components/HorseIllustration.tsx`, `src/components/HorseSpriteAnimation.tsx`, `src/components/RaceScreen.tsx`):**
    - 静止画立ち絵（ホーム画面、調教完了画面、レース勝利/惜敗結果画面）の背面にシーン別背景イラストを配置し、オフスクリーンCanvasで背景透過した愛馬立ち絵を重ねて描画。
    - 疾走スプライトアニメーション（平日調教の坂路/ウッドチップ、週末レースの芝/ダート）の背面にコース・馬場別サイドビュー背景イラストを合成し、週末レースでは出走レースの `surface`（`turf` / `dirt`）に応じて芝/ダート本馬場背景を自動切り替え。
  - **単体テスト・仕様書の更新 (`tests/horse_assets.test.ts`, `docs/specs/horse-visual-assets.md`):**
    - 全7種背景アセットの存在確認、シーン・馬場別マッピング、および静止画立ち絵フラッドフィル透過・白毛保護の単体テストを追加。

### Changed
- **UIデザインの「競馬感」向上とAI生成感からの脱却 ([#90](https://github.com/meshi-z/turf-talk/issues/90)):**
  - **カラーパレット・タイポグラフィ・競馬場モチーフ定義の刷新 (`index.html`, `src/index.css`, `src/App.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`):**
    - 背景色を冷たい汎用グレースケール（`zinc-50`/`100`）から温かみのあるレーシングプログラム・アイボリー（`#FAF8F3` / `#ECE6D8`）へ刷新。
    - 重厚なブリティッシュ・レーシンググリーン（`#0D3322`）、クラシック・ブラスゴールド（`#C59B27` / `#E6C762`）、サドルレザー（`#6B3A1E`）を基調としたクラブハウス風のヘッダー・フッター・カードデザインを導入。
    - 欧文フォントを維持しつつ日本語ゴシック体を `Noto Sans JP`、日本語セリフ体を `Noto Serif JP`（`.font-racing-serif`）に統一し、馬体重・距離・着順・スコア用の等幅数字クラス（`.font-racing-num` / `tabular-nums`）、馬具ステッチ枠（`.racing-stitch-border`）、ゼッケン風バッジ（`.saddle-cloth-badge`）を定義。
  - **各画面の脱・絵文字過多と出馬表・ゼッケンモチーフの組み込み (`src/components/HomeScreen.tsx`, `src/components/QuizScreen.tsx`, `src/components/ResultScreen.tsx`, `src/components/RaceScreen.tsx`, `src/components/RaceResultScreen.tsx`):**
    - 愛馬ステータスカードをサドルレザーステッチ＆真鍮トリムのパドック掲示板仕様に刷新し、世代バッジをゼッケン風にデザイン。
    - 平日調教コース選択（第1コース：坂路、第2コース：ウッドチップ）およびクイズ・週末レースの4択選択肢（A/B/C/D）にゼッケン（Saddle Cloth）番号バッジを導入。
    - 見出しやボタンに多用されていた装飾絵文字を Lucide ベクターアイコンおよびゴールド装飾ラインに置き換え、情報階層と視認性を向上。

---

## [v0.18.1] - 2026-11-07

### Fixed
- **スプライトアニメーション透過処理の不具合修正（調教時の鞍周辺の白残り＆レース時の白毛胴体透過） ([#87](https://github.com/meshi-z/turf-talk/issues/87)):**
  - **白ゼッケン保護領域の適正化 (`src/lib/horseAssets.ts`, `src/components/HorseSpriteAnimation.tsx`):**
    - 平日調教アニメにおける白ゼッケン保護判定（`isProtectedWhiteSaddleCloth`）を、背中ライン（`Y=100px`）および黒鞍より下の実際の白ゼッケン内部座標（`X: 228..276, Y: 105..150`）に厳密化。
    - 全毛色の調教アニメで鞍の周囲および背中より上の外側背景（`Y: 80..100`）が完全に透過されるよう修正。
  - **閉領域シードのフレーム別ピンポイント座標化による白毛（`white`）被毛保護 (`src/lib/horseAssets.ts`):**
    - 従来の広範囲グリッドシード走査を廃止し、全6コマの「手綱・首の間の三角形空間（`TRAINING_REINS_SEEDS` / `RACE_REINS_SEEDS`）」および「交差する後肢間の閉空間（`CROSSED_HIND_LEGS_SEEDS`、Frame 2・3のみ）」の中心座標のみを指定する方式に刷新。
    - 白毛（`#F7F9FC` / `#F2F5FA`）の首・胴体・脚の内部に誤って透過シードが打たれる現象を解消し、週末レースおよび平日調教で白毛の馬体が透けずにソリッドに描画されるよう修正。
  - **単体テストの拡充 (`tests/horse_assets.test.ts`):**
    - 白ゼッケン保護境界判定、6フレーム分の閉領域ピンポイントシード定義、および白毛被毛保護・鞍上背景透過・閉領域透過を検証する単体テストを追加（全117テストPASS）。

---

## [v0.18.0] - 2026-11-07

### Added
- **競走馬イラスト・アニメーション素材のWebサービス組み込み（全6シーン × 毛色連動） ([#84](https://github.com/meshi-z/turf-talk/issues/84)):**
  - **毛色マッピング・アセット解決ユーティリティの実装 (`src/lib/horseAssets.ts`):**
    - JRA全8毛色（鹿毛、栗毛、黒鹿毛、芦毛、青鹿毛、青毛、栃栗毛、白毛）と英字キーのマッピングを定義。
    - `import.meta.glob` によるVite静的アセット解決（GitHub Pages相対パス配信完全対応）。
  - **競走馬スプライトアニメーションコンポーネントの実装 (`src/components/HorseSpriteAnimation.tsx`):**
    - 6コマ（500×360px、3列×2行）の滑らかな連続再生（約11.7 FPS）。
    - オフスクリーンCanvasによる事前背景透過処理（外周フラッドフィル＋手綱間・交差脚間の透過、白ゼッケン保護）。
    - コース種別（坂路・ウッドチップ・芝ターフ）に応じた背景演出とスピードライン。
  - **静止画立ち絵コンポーネントの実装 (`src/components/HorseIllustration.tsx`):**
    - アスペクト比 1376:768 に準拠したレイアウトシフト（CLS）防止、角丸・枠線スタイリング共通コンポーネント。
  - **全6シーンのWebサービス各画面組み込み:**
    - **ホーム画面 (`src/components/HomeScreen.tsx`)**: 愛馬ステータスカード内の初期絵文字（🏇）を公式立ち絵（① `{coat}_standing_left.jpg`）へリプレイス。「🎲 命名」時の毛色再抽選にも即時連動。
    - **調教画面 (`src/components/QuizScreen.tsx`)**: 上部プログレスバー直下に平日調教疾走アニメーション（② `{coat}_training_gallop.jpg`）を組み込み、坂路/ウッドチップ背景と調和。
    - **調教結果画面 (`src/components/ResultScreen.tsx`)**: 調教完成立ち絵（③ `{coat}_training_complete.jpg`）を組み込み、「調教済」スタンプ演出と連動。
    - **週末レース画面 (`src/components/RaceScreen.tsx`)**: 実況ステータスカード直下に週末レース全力疾走アニメーション（④ `{coat}_race_gallop.jpg`）を組み込み、首振り（ヘッドボブ）モーションを表示。
    - **レース結果画面 (`src/components/RaceResultScreen.tsx`)**: 勝敗判定に応じ、1着勝利時（⑤-A `{coat}_race_victory.jpg`）と2着以下惜敗時（⑤-B `{coat}_race_cooldown.jpg`）を動的分岐表示。
  - **テスト拡充 (`tests/horse_assets.test.ts`):**
    - 全8毛色キーマッピング、全6シーンURL解決、全48アセットファイルの実在検証テストを追加（全69テストPASS）。

---

## [v0.17.0] - 2026-11-02

### Added
- **フレーズ図鑑との連携（初習得パートナー馬表示）の実装 ([#46](https://github.com/meshi-z/turf-talk/issues/46)):**
  - **初習得パートナー馬データモデルと永続化 (`src/types/index.ts`, `src/lib/phrasePartner.ts`, `src/hooks/useTrainingProgress.ts`):**
    - 初習得時の愛馬情報（世代番号・馬名・毛色）を保持する `PhrasePartnerHorse` 型を定義。
    - 平日調教（坂路・ウッドチップ）や追加トレーニングで新しいフレーズを初正解した際、現在の担当愛馬をパートナーとして自動記録・LocalStorage 永続化。
    - 復習時に別の愛馬で再度解いた場合でも、初習得時の愛馬が上書きされない不変性（イミュータブル保護）を実装。
    - 既存の習得済みフレーズに対しても、安全に現在の愛馬情報を補完する後方互換フォールバックロジックを導入。
  - **フレーズ図鑑画面でのパートナー馬表示 (`src/components/PhraseBookScreen.tsx`):**
    - 習得済みフレーズカード内に「🐴 初習得パートナー: 第N世代 馬名（毛色）」バナーを表示（JRA毛色別カラーバッジ対応）。
    - 未習得カードには「第N世代 馬名と調教で習得しよう！」のガイドを表示し学習モチベーションを向上。
  - **単体テストの実装 (`tests/phrase_partner.test.ts`):**
    - 新規習得時のパートナー記録、復習時のパートナー不変性、未習得時のフォールバック動作を検証。

---

## [v0.16.1] - 2026-11-01

### Fixed
- **殿堂入り画面のX（Twitter）ポスト文面の120文字以内スリム化 ([#96](https://github.com/meshi-z/turf-talk/issues/96)):**
  - **シェア文面フォーマットの最適化 (`src/lib/hallOfFame.ts`):**
    - 殿堂入りカードから生成されるXシェアテキストを必須情報（世代・馬名・二つ名・戦績・習得数・ハッシュタグ・URL）に凝縮し、URLやハッシュタグを含めて120文字以内に確実に収まるようスリム化。
    - 英字長名（最大18文字）や最長二つ名（12文字）の極限ケースでも 120 文字を絶対に超過しない自動調整制御を実装。
  - **テストの追加 (`tests/hall_of_fame.test.ts`):**
    - 最大文字数の日本語馬名（9文字）、最大文字数の英字馬名（18文字）、2桁世代数（第99世代）の組み合わせによる120文字以内制限テストを追加・検証。

---

## [v0.16.0] - 2026-11-01

### Added
- **殿堂入り愛馬アーカイブ（Hall of Fame ギャラリー画面）の実装 ([#45](https://github.com/meshi-z/turf-talk/issues/45)):**
  - **殿堂入りギャラリー画面の実装 (`src/components/HallOfFameScreen.tsx`):**
    - 引退した歴代の愛馬一覧（第N世代バッジ、愛馬名、毛色バッジ、路線名、二つ名・称号、通算戦績、獲得タイトル、マスターした英語フレーズ数）を表示。
    - 4週間の出走軌跡アコーディオン（Week 1〜4 の各レース名、着順、スコア）の開閉表示。
    - 統計サマリーバナー（殿堂入り総頭数、総勝利数、全勝馬頭数、育成を通じてマスターした累計英語フレーズ数）を表示。
    - ソート切り替え（最新世代順／初代から／勝利数順）機能。
    - 0頭時の親切なエンプティステート表示。
  - **シェア機能の実装 (`src/lib/hallOfFame.ts`):**
    - SNS（X / Twitter）Web Intent 連携によるワンタップ投稿機能。
    - クリップボードへのワンタップコピー機能（コピー完了トースト表示）。
    - HTML5 Canvas API による「殿堂入り記念カード画像（PNG）」の自動生成およびダウンロード機能。
  - **ホーム画面への導線およびデバッグ支援 (`src/components/HomeScreen.tsx`):**
    - メインメニュー内に「🏛️ 殿堂入り愛馬ギャラリー」カードを配置（殿堂入り頭数バッジ付き）。
    - デバッグメニュー内に「🏛️ 殿堂入りサンプル愛馬を追加（デバッグ用）」ボタンを設置。
  - **単体テストの実装 (`tests/hall_of_fame.test.ts`):**
    - 累計統計計算、世代・勝利数ソート、シェアテキスト生成、Twitter URL生成、毛色パレット完全性、サンプルデータ生成を検証。

---

## [v0.15.0] - 2026-11-01

### Added
- **フレーズ図鑑機能（一覧・検索・フィルター・要復習マーク）の実装 ([#17](https://github.com/meshi-z/turf-talk/issues/17)):**
  - **フレーズ図鑑画面の実装 (`src/components/PhraseBookScreen.tsx`):**
    - 全120問（坂路実戦フレーズ60問＋ウッドチップ基礎単語60問）のフレーズ図鑑一覧を表示。
    - パートナー愛馬（毛色イラスト・愛馬名・世代・路線）のバナー表示。
    - 全体およびコース別の習得進捗プログレスバー、要復習マーク件数のリアルタイム集計表示。
    - 状態フィルター（すべて／✅ 習得済／⏳ 未習得／⭐ 要復習）による絞り込み。
    - コース種別フィルター（全コース／🌿 坂路／🪵 ウッド）による絞り込み。
    - カテゴリフィルター（手応え／仕掛け／反応／総括）による絞り込み。
    - インクリメンタルキーワード検索（フレーズ・直訳・解説・日本語選択肢）および1タップクリアボタン。
    - 音声読み上げコントロール（`SpeechControls`）および各カード内の個別発音ボタン（`SpeechButton`）。
    - 各フレーズカードでの習得バッジ、⭐ 要復習ブックマークトグル機能。
  - **ホーム画面への導線追加 (`src/components/HomeScreen.tsx`):**
    - ホーム画面のメインメニュー領域に「📖 フレーズ図鑑」カードを配置（習得数／全問数のバッジ表示付き）。
  - **学習進捗フックの拡張 (`src/hooks/useTrainingProgress.ts`, `src/types/index.ts`):**
    - `UserProgress` に `bookmarkedPhraseIds` フィールドを追加し LocalStorage に永続化。
    - ブックマークトグル関数（`toggleBookmarkPhrase`）の追加とデモ用リセットへの反映。
  - **単体テストの実装 (`tests/phrase_book.test.ts`):**
    - 全体・コース別の習得率計算ロジック検証。
    - 状態（習得済・未習得・要復習）、コース種別、カテゴリ別の各フィルター動作検証。
    - 日英インクリメンタル検索の一致検証。
    - ブックマーク追加・削除トグルの重複防止・不変性検証。

---

## [v0.14.0] - 2026-11-01

### Added
- **Web Speech API による英語音声読み上げ（リスニング補助）の実装 ([#16](https://github.com/meshi-z/turf-talk/issues/16)):**
  - **音声合成マネージャーの実装 (`src/lib/speech.ts`):**
    - ブラウザ標準の Web Speech API（`speechSynthesis`）を活用し、完全クライアントサイドでの軽量かつ高速な音声読み上げを実現。
    - 3カ国の競馬主要アクセント（🇬🇧 イギリス英語: `en-GB`, 🇺🇸 アメリカ英語: `en-US`, 🇦🇺 オーストラリア英語: `en-AU`）に対応し、最適なネイティブボイスを自動優先マッチング。
    - 実戦スピード（1.0x 等速）および聞き取りやすい補助スピード（0.8x ゆっくり）の再生速度切り替えに対応。
    - 連打時の重複防止（`cancel` 制御）、および非対応環境での安全なフォールバックガード。
  - **設定ストア & フックの実装 (`src/hooks/useSpeechSettings.ts`):**
    - ユーザーが選択したアクセントおよび再生速度を LocalStorage に保存・同期。
  - **音声再生UIコンポーネントの実装 (`src/components/SpeechButton.tsx`, `src/components/SpeechControls.tsx`):**
    - 再生中アニメーション・視覚フィードバック付きのコンパクトな発音ボタン（`SpeechButton`）。
    - 出題カード上部に設置可能なアクセント・速度切り替えバー（`SpeechControls`）。
  - **各画面への発音・設定UIの設置:**
    - 平日調教画面（`QuizScreen`）: Target Phrase カード内に発音ボタンおよびアクセント・速度コントロールを設置。
    - 平日調教結果画面（`ResultScreen`）: 履修フレーズ振り返り各行にワンタップ発音ボタンを設置。
    - 週末レース画面（`RaceScreen`）: レース出題カード内に発音ボタンおよびアクセント・速度コントロールを設置。
    - 週末レース結果画面（`RaceResultScreen`）: 出走フレーズ振り返り各行に発音ボタンを設置。
    - デバッグ問題一覧画面（`DebugQuestionsScreen`）: 全120問の各設問カード内に発音ボタン、上部フィルターエリアに全体設定バーを設置。

---

---

## [v0.13.1] - 2026-11-01

### Added
- **デバッグメニューのlocalhost限定表示化および曜日切替時の出題・学習進捗連動 ([#34](https://github.com/meshi-z/turf-talk/issues/34)):**
  - **デバッグメニューの環境ガード (`src/lib/environment.ts`, `src/components/HomeScreen.tsx`):**
    - 開発モード（`import.meta.env.DEV`）またはローカルホスト（`localhost`, `127.0.0.1`, `[::1]`, `*.localhost`）でのみデバッグパネル（曜日切替、調教日数切替、キャリア週切替、レース出走切替、にんじん切替、問題一覧ボタン、学習状態リセットボタン）を表示するように制御。
    - 本番環境（GitHub Pages、Vercel等）でのデバッグ機能露出を防止。
  - **曜日切替時の出題・学習進捗連動 (`src/lib/logicalDate.ts`, `src/hooks/useTrainingProgress.ts`):**
    - 曜日指定時に今週の月曜日を起点とする仮想論理日付（`effectiveTodayString`）を算出する `getDateStringForDayOfWeek` を追加。
    - 曜日を切り替えることで、月曜〜日曜の各曜日に対応した決定論的な日替わり問題（坂路・ウッドチップ）が動的に切り替わるように連動。
    - 曜日切替時に調教日数が手動未指定の場合、曜日の進行に連動した調教消化日数（月:0日, 火:1日, 水:2日, 木:3日, 金:4日, 土:5日, 日:5日）およびコンディションを自動シミュレート。
    - デバッグ日付での受講完了記録・復習モードの動作を仮想日付と整合。

---

---

## [v0.13.0] - 2026-11-01

### Added
- **デバッグメニューからの問題・解答一覧参照ページの実装 ([#89](https://github.com/meshi-z/turf-talk/issues/89)):**
  - **デバッグ用問題・解答一覧画面の実装 (`src/components/DebugQuestionsScreen.tsx`):**
    - 登録されている全120問（実戦フレーズ60問＋基礎単語60問）を一覧カード形式で表示。
    - 各設問の表示項目: 設問ID、コース種別（🌿坂路/🪵ウッド）、カテゴリ名、難易度（初級/中級）、シチュエーション、英文/競馬用語、直訳、4択選択肢（正解肢のハイライト &「正解 ✅」明示）、ワンポイント解説。
    - リアルタイム絞り込み・検索機能: コース種別フィルター（すべて/坂路/ウッド）、カテゴリフィルター（手応え/仕掛け/反応/総括）、横断キーワード検索（英語・日本語・解説）、ヒット件数表示。
    - ページ上部固定（sticky）ヘッダーおよび「← ホームへ戻る」ナビゲーション。
  - **画面遷移の追加 (`src/App.tsx`):**
    - `Screen` 型に `'debug-questions'` を追加し、ホーム画面と問題一覧画面のスムーズな往復を実現。
  - **デバッグメニューへの導線追加 (`src/components/HomeScreen.tsx`):**
    - ホーム画面下部のデバッグ操作エリア内に「📖 問題・解答一覧を表示（全120問・校正用）」ボタンを設置。

### Added
- **競走馬ビジュアル・イラスト素材制作（JRA全8毛色 × 全6シーン構成） ([#83](https://github.com/meshi-z/turf-talk/issues/83)):**
  - **制作仕様書の策定 (`docs/specs/horse-visual-assets.md`):**
    - アートスタイル（フラット・2トーン・黒目アーモンドアイ・騎手なし）、解剖学的正確性（マイブリッジ基準の4本脚管理）、全6シーン構成、アニメーション3点座標ロック、週末レース専用の首振り（ヘッドボブ）モーション、全8毛色カラーパレット・領域変換ルールの仕様を制定。
  - **JRA全8毛色 × 全6シーン（計48アセット）の素材整備 (`src/assets/horses/`):**
    - **全6シーン**: ①公式立ち絵（左向き・無装具）、②平日調教（右向き・白ゼッケン・6コマ）、③調教完了（右向き・無装具）、④週末レース（右向き・紺ゼッケン1番・首振り付き6コマ）、⑤-A 1着勝利（右向き・顔上げ）、⑤-B 惜敗労い（右向き・頭下げ）。
    - **全8毛色**: 鹿毛 (`bay`), 栗毛 (`chestnut`), 黒鹿毛 (`dark_bay`), 芦毛 (`grey`), 青鹿毛 (`seal_brown`), 青毛 (`black`), 栃栗毛 (`liver_chestnut`), 白毛 (`white`)。
    - 各毛色の特徴部位（黒ソックスの有無、鼻先・目元のボカシ肌色、飴色白蹄など）を正確に再現。
    - 右向き静止画3種（③、⑤-A、⑤-B）の馬体完全一致（0.0px誤差）およびスプライトシート（②、④）の胴体3点座標ロックを達成。

---

## [v0.12.1] - 2026-10-25

### Fixed
- **GitHub Pages環境でヘッダーアイコン（icon.svg）が404エラーになる不具合の修正 ([#77](https://github.com/meshi-z/turf-talk/issues/77)):**
  - **ベースURL対応のアセットパス指定 (`src/components/Header.tsx`):**
    - ヘッダー内のサービスアイコン参照をルート絶対パス `/icon.svg` から `${import.meta.env.BASE_URL}icon.svg` に修正。
    - `vite.config.ts` の `base: './'`（相対パス配信）設定と整合させ、GitHub Pages 等のサブディレクトリ環境でも 404 Not Found を起こさず正常に画像が表示されるように改善。

---

## [v0.12.0] - 2026-10-25

### Added
- **タイトルヘッダのページ上部固定（sticky化）およびサービスアイコンへの変更 ([#74](https://github.com/meshi-z/turf-talk/issues/74)):**
  - **タイトルヘッダーの上部固定（sticky）化 (`src/components/Header.tsx`):**
    - `<header>` に `sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-emerald-100 shadow-xs h-14` を適用。
    - ホーム画面や各画面の縦スクロール時にもヘッダー（愛馬情報・タイトル、連続日数ストリーク、音声切り替えボタン）が常に画面最上部に追従して表示される操作性を確保。
    - ヘッダー高さを `h-14`（56px）に安定化し、後続のプログレスバー固定領域とのオフセット基準を統一。
  - **公式サービスアイコンへの差し替え (`src/components/Header.tsx`):**
    - プロトタイプ初期の絵文字（`🏇`）から、公式アイコン（`public/icon.svg`）の画像表示（`<img>`）へ差し替え。
    - タイトルテキストや行間とのバランスを最適化（`w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-2xs`）。
- **調教画面・レース画面の上部プログレスバー領域の常時固定（sticky化） ([#75](https://github.com/meshi-z/turf-talk/issues/75)):**
  - **調教画面の上部プログレスバー固定 (`src/components/QuizScreen.tsx`):**
    - 上部ヘッダー（中断ボタン、調教コース名、問題数カウント、プログレスバー）コンテナに `sticky top-14 z-40 bg-zinc-50/95 backdrop-blur-xs -mt-4 pt-3 pb-2.5 -mx-4 px-4 border-b border-zinc-200/60 shadow-2xs mb-3` を適用。
    - タイトルヘッダー直下に自然に密着追従し、解説や選択肢の縦スクロール時にも全体の進行状況と中断操作を常に視認・利用可能に改善。
    - コース種別に応じたコース名（「坂路調教」/「ウッドチップ調教」）の動的表示に対応。
  - **週末レース画面の上部プログレスバー固定 (`src/components/RaceScreen.tsx`):**
    - レース上部ヘッダー（レース中止ボタン、レース名、展開カウント、プログレスバー）コンテナに `sticky top-14 z-40 bg-zinc-50/95 backdrop-blur-xs -mt-4 pt-3 pb-2.5 -mx-4 px-4 border-b border-amber-200/60 shadow-2xs mb-3` を適用。
    - 実況カードや4択の選択肢スクロール時にも、現在の展開カウント・進捗・中止ボタンが常に上部に留まり、実戦レースの臨場感と操作性を両立。

---

## [v0.11.0] - 2026-10-18

### Added
- **週末レースのハイブリッド出題（第1〜2問: 基礎単語 ➡ 第3〜5問: 実戦フレーズ）の実装 ([#64](https://github.com/meshi-z/turf-talk/issues/64)):**
  - **ハイブリッド出題エンジンの導入 (`src/lib/raceMode.ts`):**
    - 単語・用語モード（ウッドチップ調教、#48）の導入に伴い、週末レース（全5問）を「第1〜2問: 基礎単語（`type === 'vocabulary'`）」＋「第3〜5問: 実戦フレーズ（`type !== 'vocabulary'`）」のハイブリッド実戦出題構成へと拡張。
    - 単一母集団から指定問数を優先順位に基づき選出するヘルパー関数 `selectPoolQuestions` を実装。
    - 単語プール（60問）およびフレーズプール（60問）それぞれにおいて、履修済み問題の優先抽出、当該週テーマカテゴリ（`themeCategory`）の一致優先、未履修補填、およびフォールバック機構を独立して適用。
    - レース実況（序盤のパドック・馬場・ゲート ➡ 終盤の直線叩き合い・ゴール前死闘）と出題内容が自然に調和する設計。
  - **レースクイズUIの出題種別表示 (`src/components/RaceScreen.tsx`):**
    - 問題カード上部のラベルを設問タイプに応じて動的切り替え（`TARGET VOCABULARY` / `TARGET PHRASE`）。
    - 設問種別バッジ（`🪵 基礎単語` / `🌿 実戦フレーズ`）を表示し、現在の設問の性質が直感的に伝わるUIへ改善。
  - **愛馬の余力（ヒント機能）の単語・フレーズ両対応 (`src/lib/raceMode.ts`):**
    - 平日調教（好調・絶好調）で得られる「愛馬の余力（不正解選択肢1つ除外）」が、第1〜2問の基礎単語および第3〜5問の実戦フレーズの双方で問題なくシームレスに動作することを確認・担保。
  - **テストの拡充 (`tests/race_mode.test.ts`):**
    - 第1〜2問が必ず単語、第3〜5問が必ずフレーズとして選出される構造の検証。
    - 単語およびフレーズ双方における既習プール優先選出、テーマカテゴリ優先選出の動作検証。
    - 単語問題・フレーズ問題の双方におけるヒント機能（`eliminateOneWrongOption`）の挙動検証テストを追加。

---

## [v0.10.1] - 2026-10-17

### Fixed
- **愛馬命名の文字数制限の修正（カタカナ2〜9文字／英字2〜18文字の言語別ハイブリッドバリデーション・混在禁止） ([#66](https://github.com/meshi-z/turf-talk/issues/66)):**
  - **公式命名規則に準拠した言語別ハイブリッドバリデーションの実装 (`src/lib/careerCycle.ts`):**
    - 日本語（カタカナ・漢字・ひらがな）馬名: JRA競走馬登録規則に準拠し **2文字以上 9文字以内**。
    - 英字（半角英数字・スペース）馬名: 国際協約（IFHA）に準拠し **2文字以上 18文字以内**。
    - 最小文字数制限（`MIN_HORSE_NAME_LENGTH = 2`）を追加し、1文字入力（「ア」「A」など）を無効化。
    - 文字数超過時のエラーメッセージを具体化（「カタカナ等の日本語馬名は2〜9文字以内で入力してください」「英字馬名は2〜18文字以内で入力してください」）。
  - **カタカナと英字の混在禁止ルールの導入 (`src/lib/careerCycle.ts`):**
    - 公式規則に基づき、カタカナと英字が混在した馬名（例: `サンデーR`, `Starスター` 等）を検出して拒否する `hasMixedLanguages` を導入。
    - エラーメッセージ「カタカナと英字を混在させることはできません。カタカナのみ（2〜9文字）、または英字のみ（2〜18文字）で入力してください。」を通知。
  - **サニタイズ処理の言語別クリッピング (`src/lib/careerCycle.ts`):**
    - `sanitizeHorseName` において、入力が英字のみの場合は18文字、全角日本語を含む場合は9文字で適切にクリッピング。
  - **UIプレースホルダーの更新 (`src/components/HomeScreen.tsx`, `src/components/RetirementScreen.tsx`):**
    - ホーム画面および引退式画面の馬名入力欄プレースホルダーを `馬名を入力 (カタカナ9文字 / 英字18文字以内)` に更新。
  - **単体テストの拡充 (`tests/career_cycle.test.ts`):**
    - カタカナ2〜9文字（正常系）および10文字以上（異常系）、英字2〜18文字（正常系）および19文字以上（異常系）、1文字入力の拒否、混在馬名の拒否を検証する単体テストを追加。

---

## [v0.10.0] - 2026-10-17

### Added
- **基礎単語・競馬用語に特化した別調教メニュー「ウッドチップ調教」の導入と問題マスター拡充（120問規模化） ([#48](https://github.com/meshi-z/turf-talk/issues/48)):**
  - **JRA公式「海外競馬英和辞典」準拠の基礎単語・競馬用語マスター（60問）の追加 (`src/data/phrases.ts`):**
    - JRA公式一次ソースに厳格に準拠した基礎用語マスター（`vocab-001`〜`vocab-060`）を新設。
    - 全4カテゴリ（馬場状態・コース条件 `feel` 15問、レース展開・位置取り・馬具 `tactics` 15問、競走馬の挙動・気性・状態 `reaction` 15問、着差・裁決・成績・斤量 `comment` 15問）に均等配分し、既存の実戦フレーズ（60問）と合わせて全体で120問規模へ拡充。
    - `PhraseItem` に `type?: 'phrase' | 'vocabulary'` フィールドを追加。
  - **コース選択型調教システム（🌿 坂路調教 / 🪵 ウッドチップ調教）の実装 (`src/lib/dailyRotation.ts`, `src/types/index.ts`, `src/hooks/useTrainingProgress.ts`):**
    - 出題エンジン `selectDailyPhrases` および `selectExtraTrainingPhrases` に `course?: 'uphill' | 'woodchip'` オプションを追加。コース種別に応じて独立した出題プール（坂路: 実戦フレーズ60問、ウッドチップ: 基礎単語60問）から日付シードで決定論的に3問を選出。
    - ユーザー進捗（`UserProgress`）に `todayWoodchipPhraseIds` および `completedCoursesToday` を追加。
    - **デイリー達成（いずれか一方完了ルール）**: 「坂路調教」または「ウッドチップ調教」のどちらか一方を完了した時点で、当日の調教完了（`completedToday: true`、ストリーク維持、週間調教日数+1、週末レース出走権解放）が達成。
    - 片方の調教完了後も、もう一方のコースを同日中に受講可能。2コース目を完了した際も同日ガードによりストリーク日数・週間調教日数は重複加算されず、正解した問題のみが `learnedPhraseIds` に蓄積される安全設計。
  - **ホーム画面の2コース選択UI実装 (`src/components/HomeScreen.tsx`, `src/App.tsx`):**
    - 「本日の調教メニュー」エリアに「🌿 坂路調教（実戦フレーズ / 3問）」と「🪵 ウッドチップ調教（基礎単語・競馬用語 / 3問）」の2枚のコースカードを配置。
    - 各コースの本日ステータス（未完了 / 完了💮）、調教開始ボタン、および完了後の「追加トレーニング（新3問）」「復習する」ボタンを独立して提供。
    - 片方完了時は「本日の調教ノルマ達成！💮」、両コース完了時は「本日全コース制覇！🏆」の祝賀バナーを表示。
  - **テスト拡充 (`tests/verify_phrases.test.ts`, `tests/woodchip_training.test.ts`):**
    - 全120問の整合性・4カテゴリ均等分布・必須属性・4択構成を網羅する検証テストを更新。
    - ウッドチップ調教の単語選出、坂路調教との独立性、追加トレーニング、および同日2コース受講時のストリーク非重複加算サイクルを検証する単体テストを追加。

---

## [v0.9.2] - 2026-10-17

### Added
- **週末世代交代時の新世代Week 1レース即時出走防止（来週末デビュー制御） ([#61](https://github.com/meshi-z/turf-talk/issues/61)):**
  - 引退式・世代交代時（`retireCurrentHorse`）に、先代馬の週末レース出走ステータス（`hasCompletedWeeklyRace` および `lastRaceWeekMonday`）を新世代の `UserProgress` へ安全に引き継ぎ、土日のうちに新世代のWeek 1レースへ即座に出走してしまう挙動を防止。
  - ホーム画面（`src/components/HomeScreen.tsx`）に、土日に入厩した新馬（Week 1かつ今週末出走済み）専用の「🌿 新馬入厩 • 来週末デビュー！」バナーおよび調教誘導メッセージを追加。
  - 新馬の入厩準備期間中であっても、命名・毛色抽選・路線選択や坂路調教（3問）は土日の間も通常通り実施可能。
  - 翌週月曜午前4時（週替わり境界）を迎えることで出走制限が自動リセットされ、平日調教を経て翌週末にWeek 1デビュー戦（5問）が解放されるサイクルを確立。
  - 世代交代時の出走完了フラグ引き継ぎ、同一週末内の出走ロック、および翌週リセットを網羅する単体テスト（`tests/weekend_generation_transition.test.ts`）を追加。

---

## [v0.9.1] - 2026-10-17

### Added
- **週末レースの表示・出走条件に「調教1回以上の実施」を追加 ([#59](https://github.com/meshi-z/turf-talk/issues/59)):**
  - 土日モードにおいて、愛馬が一度も調教を行っていない状態（`careerHorse.hasTrained === false`）では週末レース出走バナーを非表示にし、代わりに「🔒 週末レース出走 • ロック中」案内カードを表示。
  - 未調教時の「週末の坂路調教メニュー」の未完了カードに「💡 まずは坂路調教で愛馬を仕上げよう！調教を1回完了すると、週末レースに出走できるようになります。」と明記し、調教メニューへ自然に誘導。
  - 坂路調教（3問）を1度完了すると `hasTrained` が `true` に更新され、即座に黄金の週末レース出走バナーが解放・表示されて出走可能になるリアクティブな導線を確立。
  - 初期状態（`hasTrained: false`）での出走ロック、調教完了後のアンロック、および週末レース出走条件（調教済みかつ未出走）を網羅する単体テスト（`tests/weekend_race_unlock.test.ts`）を追加。

---

## [v0.9.0] - 2026-10-17

### Added
- **引退式セレモニーと次世代（新馬）への世代交代ロジックの実装 ([#44](https://github.com/meshi-z/turf-talk/issues/44)):**
  - **二つ名（称号）の自動授与とキャリア戦績サマリー (`src/lib/careerCycle.ts`):**
    - 4週間の戦績（勝利数・合計スコア）および歩んだ路線（全8路線）に応じて称号を授与する `determineHorseEpithet` / `evaluateRetirementSummary` を実装（4戦全勝「不敗の世界覇者」、国内G1＋世界G1連覇の路線別最高称号、世界G1制覇、国内G1制覇の路線別称号、実力馬、堅実無比の名バイプレイヤー等）。
  - **引退式セレモニー画面 (`src/components/RetirementScreen.tsx`):**
    - ファンファーレSEとともに、引退する愛馬の記念プレート（世代・馬名・毛色・路線・授与された二つ名・獲得タイトルバッジ）、Week 1〜4 の出走軌跡、および担当期間中にマスターした英語フレーズ数を表彰。
    - 画面下部にて次世代（`generation + 1`）の新馬の馬名・毛色同時抽選（「🎲 命名・毛色抽選」）、馬名手動編集（「✏️ 手動編集」）、およびキャリア路線（全8路線）を選択して世代交代を確定するフローを実装。
  - **殿堂入りデータの永続化と世代交代ハンドオフ (`src/types/index.ts`, `src/hooks/useTrainingProgress.ts`):**
    - `HallOfFameHorse` 型および `UserProgress.hallOfFame` 配列を追加し、引退時に `createHallOfFameRecord` / `retireAndSpawnNextGeneration` で歴代名馬レコードを LocalStorage に永続保存。
    - ユーザー全体の連続学習ストリーク（`streakDays`）、にんじん所持数（`carrotCount`）、全体の習得済みフレーズ（`learnedPhraseIds` / `lapCount`）を維持したまま、新馬（`generation + 1`, `currentWeek: 1`, `hasTrained: false`）へバトンタッチする `retireCurrentHorse` を実装。
  - **導線・デバッグ機能の追加 (`src/components/RaceResultScreen.tsx`, `src/components/HomeScreen.tsx`, `src/App.tsx`):**
    - Week 4（最終週）のレース完走時のレース結果画面およびホーム画面に「🌸 引退式セレモニーへ進む」ボタン・案内バナーを表示。
    - ホーム画面のデバッグパネルに「🌸 引退式セレモニーを試す（世代交代デモ）」ボタンを追加。
  - 二つ名判定・引退サマリー算出・殿堂入りレコード作成・次世代生成を検証する単体テスト（`tests/career_cycle.test.ts`）を追加。

---

## [v0.8.1] - 2026-10-17

### Added
- **週末レースの出走回数制限（土日1回限定）および調教消化日数の分母修正（7日化） ([#56](https://github.com/meshi-z/turf-talk/issues/56)):**
  - **週末レースの出走回数制限（1週末1回限定）と月曜午前4時リセット:**
    - 月曜午前4時起算の論理週ID算出関数 `getLogicalWeekMonday` および当該週のレース出走済判定関数 `isWeeklyRaceCompletedForWeek` を実装（`src/lib/logicalDate.ts`）。
    - レース完了時に `lastRaceWeekMonday` と `hasCompletedWeeklyRace: true` を記録し、ホーム画面の週末レース出走ボタンを非活性の「`出走完了 🏁（次回出走は来週末）`」表示に切り替えて同週末内の再出走を制限（レース結果画面の「もう一度レースに出走する」ボタンも廃止し、土日分の坂路調教・復習は継続可能に維持）。
    - 週が切り替わる（月曜午前4時）タイミングで出走制限および週間調教日数が自動リセットされるよう制御（`src/hooks/useTrainingProgress.ts`）。
  - **調教消化日数の7日制化とコンディション閾値の適正化:**
    - 担当馬カードの表示を「`🏋️ 調教消化: X / 7日`」に変更し、週間調教日数の上限を `MAX_WEEKLY_TRAINING_DAYS = 7` に拡張。
    - `getConditionFromDays` の判定閾値を7日制に合わせて適正化（5〜7日: 絶好調 `peak`・余力2回 / 3〜4日: 好調 `up`・余力1回 / 1〜2日: 普通 `flat`・余力0回 / 0日: 太め残り `heavy`・余力0回）。
  - デバッグパネルの調教日数切替を `0〜7日` に拡張し、「週末レース出走状態切替（未出走 / 出走済）」コントロールを追加。
  - 7日制コンディション閾値および論理週単位のレース出走制限・月曜午前4時リセットを検証する単体テスト（`tests/condition_bonus.test.ts`, `tests/streak_logical_date.test.ts`）を追加・更新。

---

## [v0.8.0] - 2026-10-17

### Added
- **週替わり模擬レース（新馬戦〜重賞〜国内G1〜海外G1）と演出の実装 ([#43](https://github.com/meshi-z/turf-talk/issues/43)):**
  - **週別（Week 1〜4）の5段階ライブ実況＆リアクション演出:** 新馬戦（初陣のゲート・折り合い確認）、重賞トライアル（位置取り争い・仕掛けの攻防）、国内G1（大観衆の咆哮・魂の追い比べ）、海外G1（世界最高峰の死闘）の4ステージそれぞれに専用の5展開実況テキストと正誤リアクションを実装（`getRacePhasesForWeek`）。
  - **レース距離に応じた動的残り距離算出:** 各路線・各週の距離表記（1200m〜7200m）から総距離を抽出し、5展開の残り距離バッジを動的に生成（`extractDistanceMeters`, `buildPhaseDistanceLabels`）。
  - **週別テーマカテゴリの優先出題ロジック:** Week 1（`feel`: 手応え・感触）、Week 2（`tactics`: 仕掛け・展開）、Week 3（`reaction`: 勝負根性・反応）、Week 4（`comment`: 陣営コメント・総括）のテーマに合致するフレーズ（履修済み優先→未履修→他カテゴリ補充）を優先選出するよう `selectRaceQuestions` を拡張。
  - **ステージ別着順タイトル・総評コメント:** `calculateRacePlacement(score, week)` を拡張し、1着・2着・掲示板（3〜4着）・着外のタイトルと総評コメントが Week 1〜4 の舞台に応じて変化するよう改善。
  - **UI表示の動的化:** ホーム画面の週末レース出走ボタン（「{レース名}に出走する（5問）」）・出題テーマバッジ、およびレース画面ヘッダー（「Week X • {レース名}（{距離}）」）・テーマ表示を実装。
  - 週別実況フェーズ・動的距離算出・週別着順判定・テーマ優先出題を検証する単体テスト（`tests/race_mode.test.ts`）を追加。

---

## [v0.7.1] - 2026-10-17

### Added
- **初回調教前の馬名・路線変更ロックおよび命名時の毛色同時抽選の実装 ([#54](https://github.com/meshi-z/turf-talk/issues/54)):**
  - `CareerHorse` に初回調教実施済みフラグ `hasTrained: boolean` を追加し、ロック判定関数 `isHorseProfileLocked` およびロックガード付き更新関数（`rerollHorseIdentity`, `changeHorseNameIfUnlocked`, `changeHorseRouteIfUnlocked`）を実装（`src/types/index.ts`, `src/lib/careerCycle.ts`）。
  - **「🎲 命名」実行時の馬名・毛色同時抽選:** 未調教時に「🎲 命名」をタップした際、馬名自動生成（`generateRandomHorseName`）とJRA基準8毛色の重み付き抽選（`rollHorseCoatColor`）を同時に実行し、馬名と毛色をセットでリロールできるよう改善。
  - **初回調教完了による確定ロック:** 1度でも調教を完了すると `hasTrained: true` となり、ホーム画面の「🎲 命名」「✏️ 手動編集」「路線変更」コントロールを非表示（`🔒 確定済` 表示）にして世代交代まで変更不可に制御。
  - **未調教時のUIガイド表示:** 初回調教前の愛馬カードに「💡 調教を開始すると馬名・毛色・路線が確定します」の案内メッセージを表示。
  - 初回調教前後のロック制御・馬名毛色同時抽選・新馬誕生時のロック解除を検証する単体テスト（`tests/career_cycle.test.ts`）を追加。

---

## [v0.7.0] - 2026-10-17

### Added
- **競走馬キャリアデータモデルと4週間ステージ進行ロジックの実装 ([#42](https://github.com/meshi-z/turf-talk/issues/42)):**
  - `CareerHorse` / `CareerRaceRecord` / `CareerRouteInfo` の型定義と4週間キャリア管理ロジック（`src/types/index.ts`, `src/lib/careerCycle.ts`）の実装。
  - **JRA基準の全8毛色と重み付き抽選:** 鹿毛(40%)・栗毛(22%)・黒鹿毛(16%)・芦毛(8%)・青鹿毛(6%)・青毛(4%)・栃栗毛(3%)・白毛(1%)の確率テーブルに基づく抽選機能（`rollHorseCoatColor`）を実装。
  - **馬名ランダム自動生成と安全なカスタム入力:**
    - 暴力・薬物・性的表現・ネガティブな語を含まない穏当な単語プール（形容詞＋名詞、名詞＋名詞）から、JRA馬名規定（2〜9文字カタカナ）に収まる馬名をランダム生成（`generateRandomHorseName`）。
    - 手動入力時のホワイトリスト文字検証・最大18文字制限・制御文字除去・XSS無害化処理（`validateHorseName`, `sanitizeHorseName`）を実装。
  - **8大路線（キャリアローテーション）の選択機能:** 3歳牡馬クラシック、3歳牝馬クラシック、スプリント、古馬マイル・中距離、ステイヤー、ダートマイル、ダート王道中距離、障害の全8路線を選択でき、現在週（Week 1〜4）に応じた目標レースが動的に変化。
  - **ステージ進行とLocalStorageマイグレーション:**
    - レース完走時に `raceHistory` へ戦績を記録し、次週（Week 1 → 2 → 3 → 4）へステップアップする進行ロジック（`advanceCareerHorseAfterRace`）およびレース結果画面でのステージ進行表示。
    - 既存の単頭セーブデータから安全に `CareerHorse`（第1世代・Week 1）へ引き継ぐマイグレーション＆フォールバック処理（`migrateToCareerHorse`）。
  - デバッグパネルへの「キャリア週切替 (Week 1〜4)」および「毛色再抽選」コントロールの追加。
  - 毛色抽選・馬名生成・入力サニタイズ・8路線ステージ判定・週進行・マイグレーションを網羅する単体テスト（`tests/career_cycle.test.ts`）の追加。

---

## [v0.6.1] - 2026-10-17

### Changed
- **ヘッダーのにんじんストック表示を削除し表示を担当馬カードに一本化 ([#51](https://github.com/meshi-z/turf-talk/issues/51)):**
  - ホーム画面の担当馬カード（My Stable）内に「🥕 にんじんストック: X / 3個」および詳細な説明があるため、ヘッダー右側のにんじんバッジUI（`🥕 {carrotCount}/3`）を削除。
  - ヘッダー右側を「連続日数ストリークバッジ」と「サウンド切替ボタン」のみに整理・簡素化し、スマートフォン等の狭小画面における横幅圧迫・改行崩れを防止。
  - `HeaderProps` および `App.tsx` から不要となった `carrotCount` props 渡しを削除。

---

## [v0.6.0] - 2026-10-17

### Added
- **当日調教完了後の追加トレーニング（未習得フレーズの継続学習）機能の実装 ([#49](https://github.com/meshi-z/turf-talk/issues/49)):**
  - 1日の通常調教（3問）完了後でも、学習意欲の高いユーザーが未習得フレーズを何回でも継続して学べる「追加トレーニング」CTAボタンおよびセッション開始機能を実装。
  - 出題エンジン `selectExtraTrainingPhrases` の追加:
    - 原則「未習得プールから2問 ＋ 習得済みプールから1問」（計3問）をランダム選出。
    - 未習得プールが1問のみの場合は習得済みから補充して計3問を維持。
    - 全問習得済みの場合は全フレーズからランダム選出する全問復習モードへフォールバック。
    - 各問題の選択肢は既存同様に動的シャッフル。
  - ゲームバランスと既存データの保護:
    - 追加トレーニングを何回受講しても、愛馬の平日調教日数（`weekdayTrainingDays`）およびストリーク（`streakDays`）は増加させず、1日1回分のみを維持（にんじん補填システムや週末レースサイクルの価値を保護）。
    - 当日の初回本番フレーズ（`todayPhraseIds`）は上書きせず保持し、「本日のフレーズを復習する」ボタンからいつでも再受講可能。
    - セッション完了時に正解した未習得フレーズのみを `learnedPhraseIds` に安全に加算。
  - ホーム画面（`src/components/HomeScreen.tsx`）の当日調教完了時UIの刷新:
    - 「🌱 追加トレーニング（新しい3問）」ボタン（Primary）と「🔄 本日のフレーズを復習する」ボタン（Secondary）を並列配置。
  - 出題比率（未習得2＋既習1）、フォールバック動作、進捗更新を網羅する単体テスト（`tests/extra_training.test.ts`）の追加。

---

## [v0.5.2] - 2026-10-12

### Added
- **フレーズマスターの拡充（全60問規模への倍増） ([#15](https://github.com/meshi-z/turf-talk/issues/15)):**
  - 海外競馬中継・勝利騎手インタビュー・調教師コメントから厳選した実戦的競馬英語フレーズ30問を新規追加（`phrase-031`〜`phrase-060`、合計60問へ拡充）。
  - レース実況（`under pressure`, `quickened in an instant`, `went wire-to-wire` 等）、パドック評価（`looked an absolute picture` 等）、馬場適性（`testing conditions`, `sounder surface` 等）、戦術・進路選択（`stole a march`, `brave man’s route` 等）の多彩な競馬表現を網羅。
  - 各設問にリアルなダミー3肢、競馬ファン向けワンポイント解説、難易度（初級・中級）を付与。
  - 設問シチュエーション（`situation`）のネタバレ防止・中立的文脈提示原則を徹底。
  - `tests/verify_phrases.test.ts` を60問（feel:15, tactics:16, reaction:15, comment:14）の属性・一意性・選択肢仕様検証に更新。

---

## [v0.5.1] - 2026-10-12

### Fixed
- **スマートフォン実機（Pixel 8a等）におけるヘッダーテキストおよびバッジ改行崩れの修正 ([#40](https://github.com/meshi-z/turf-talk/issues/40)):**
  - ヘッダーサブタイトルをより簡潔な「競馬英語マイクロラーニング」に見直し、モバイル幅でも1行ですっきり収まるよう調整。
  - ヘッダー内の連続日数バッジ（`{streakDays}日連続`）およびにんじんバッジ（`🥕 {carrotCount}/3`）に `whitespace-nowrap shrink-0` を適用し、画面幅不足による途中改行・レイアウト崩れを防止。
  - モバイル幅（375px〜412px等）におけるパディングおよび各要素間のギャップを最適化（`src/components/Header.tsx`）。

---

## [v0.5.0] - 2026-10-12

### Added
- **レースヒント温存ボーナス「にんじん（ストリーク補填）」システムの実装 ([#38](https://github.com/meshi-z/turf-talk/issues/38)):**
  - レース中アクション名称を世界観に即した「愛馬の余力（残X回）」へとリファイン。
  - レース終了時に未使用で残った余力数分を愛馬へのご褒美「にんじん 🥕」ストックに変換・加算する温存ボーナスロジック（`src/lib/carrotBonus.ts`、所持上限3個）。
  - 未受講日が発生した際に所持にんじんを1個自動消費し、連続学習日数を途切れさせず維持（救済）するストリーク自動補填ロジック（連日未受講でも所持数分まで救済可能）。
  - ヘッダーへのにんじん所持バッジ（`🥕 X/3`）および愛馬カードのストック状況表示（`src/components/Header.tsx`, `src/components/HomeScreen.tsx`）。
  - 直近でにんじん救済が発動した際のホーム画面通知バナー（「愛馬がにんじんを食べて調教記録を維持しました」）。
  - レース結果画面における余力温存にんじん獲得演出カード（`src/components/RaceResultScreen.tsx`）。
  - にんじん獲得・消費専用のWeb Audio API効果音（`playCarrot()`）。
  - デバッグパネルにおける「にんじん所持数（0〜3個）」の即時切り替えUIの追加。
  - 温存加算・上限クリップ・ストリーク救済判定を網羅する単体テスト（`tests/carrot_streak_bonus.test.ts`）の追加。

---

## [v0.4.1] - 2026-10-12

### Added
- **連続学習日数（ストリーク）カウント機能の実装（午前4時/28時更新対応） ([#36](https://github.com/meshi-z/turf-talk/issues/36)):**
  - 現在日時から4時間減算した日時を基準とする論理日付判定ユーティリティ（`src/lib/logicalDate.ts`）の実装。深夜帯（24:00〜28:00 / 翌03:59）のアクセス・学習でも前日分の調教として継続可能。
  - 午前4時（28時）境界での日付切り替え、出題シード、完了日判定の統一。
  - 連続調教日数の正確な追跡ロジック（昨日受講済みからの本日完了で `streakDays + 1`、同日内の復習受講では維持、1日以上の未受講スキップで `0` にリセット）。
  - 新規利用時のストリーク初期値を `0` 日に見直し。
  - 午前4時境界判定およびストリーク更新・リセットロジックを網羅する単体テスト（`tests/streak_logical_date.test.ts`）の追加。

---

## [v0.4.0] - 2026-10-12

### Added
- **平日調教ボーナスと愛馬コンディション連携の実装 ([#14](https://github.com/meshi-z/turf-talk/issues/14)):**
  - 平日の調教消化日数（0〜5日）と連動した愛馬コンディション（太め残り・平行線・好調・絶好調）および馬体重変動（480kg〜500kg）判定ロジック（`src/lib/conditionBonus.ts`）。
  - ホーム画面（`src/components/HomeScreen.tsx`）におけるコンディションバッジ（太め残り⚠️・平行線➡️・好調↗️・絶好調🔥）と調教消化状況（「今週の調教: X / 5日消化」）の可視化。
  - レース中の「⚡ 調教ヒント（残X回）」機能の実装: 好調時は1回、絶好調時は2回使用可能で、発動ごとに不正解の選択肢を1つ除外（1問で2回発動して2択に絞ることも可能）。
  - 調教ヒント発動時のWeb Audio API効果音（キラリと閃く高周波ピッチSE）。
  - レース結果画面（`src/components/RaceResultScreen.tsx`）における「🏇 レース後フィードバック」カード（レース走破による馬体重-4kg変動、次走に向けた調子昇格メッセージ）。
  - 開発・デモ検証用に平日調教日数を即座に切り替えられるデバッグパネル（0〜5日選択チップ）の追加。
  - コンディション判定・不正解除外ヒント・レース後フィードバック計算を網羅する単体テスト（`tests/condition_bonus.test.ts`）の追加。

---

## [v0.3.0] - 2026-10-12

### Added
- **週末「レースモード」クイズ画面と勝敗演出の実装 ([#13](https://github.com/meshi-z/turf-talk/issues/13)):**
  - 週末限定の実戦形式レースクイズ（5問構成）選出ロジックの実装（履修済みフレーズ優先選出・選択肢シャッフル）。
  - レース展開（スタート、向こう正面、第3〜4コーナー、直線叩き合い、ゴール前死闘）と連動したリアルタイム実況アナウンスおよび正誤リアクション演出（`src/components/RaceScreen.tsx`）。
  - 成績（正解数）に応じた着順判定ロジック（5問正解: 1着🥇優勝 / 4問: 2着🥈惜敗 / 2〜3問: 掲示板🎖️ / 0〜1問: 着外💦）。
  - Web Audio API によるレース専用SE（ゲートオープン音、勝利ファンファーレ調アルペジオSE）。
  - 確定着順・愛馬成績・出走フレーズ振り返り・再出走アクションを備えたレース結果画面（`src/components/RaceResultScreen.tsx`）。
  - レース出題・着順判定を網羅する単体テスト（`tests/race_mode.test.ts`）の追加。

---

## [v0.2.0] - 2026-10-12

### Added
- **曜日判定と週末レースモード解放ロジックの実装 ([#12](https://github.com/meshi-z/turf-talk/issues/12)):**
  - 現在日時の曜日判定ユーティリティ（`src/lib/dayMode.ts`）の実装（月〜金: 平日調教モード / 土日: 週末レースモード）。
  - 週末レースまでのカウントダウン（「出走まであと X日」）および土日限定の週末G1レース開催バナー・出走CTAへの動的切り替え。
  - 週末でも坂路調教・復習を行えるサブアクションの維持。
  - デモ・検証用に月曜日〜日曜日（7曜日）および実日時リセットをワンタップで切り替えられるデバッグUIの実装。
  - 曜日判定・週末判定・カウントダウン計算を網羅する単体テスト（`tests/day_mode.test.ts`）の追加。

---

## [v0.1.6] - 2026-10-12

### Changed
- **設問シチュエーション（situation）の過度なネタバレ・ヒント表現の見直し ([#30](https://github.com/meshi-z/turf-talk/issues/30)):**
  - 初期マスターデータ（全30問）の `situation` を総点検し、レース結果や馬の具体的な成否・挙動（「逃げ切った」「進路を失った」「理想的なリズムで」など）の過剰開示を是正。
  - 発言場面・話者の状況の提示に留めた自然で中立的な文脈表現にリライトし、英語フレーズ自体の意味や比喩を解読して回答できる適正な学習体験・クイズ難易度を担保。
  - `docs/specs/phrase-schema.md` のデータ作成規約に「設問シチュエーション（situation）のネタバレ防止と文脈提示原則」を追記。

---

## [v0.1.5] - 2026-10-12

### Added
- **アプリ画面フッターへのバージョン情報表示の実装 ([#27](https://github.com/meshi-z/turf-talk/issues/27)):**
  - `package.json` のバージョン情報を Vite の `define` 経由でフロントエンドへ注入する仕組みを導入（`vite.config.ts`, `src/version.ts`）。
  - アプリ最下部に控えめなトーンでアプリ名とバージョン（例: `TurfTalk • v0.1.5`）を表示する `Footer` コンポーネント（`src/components/Footer.tsx`）を実装。
  - セマンティックバージョニング形式およびバージョン同期を検証する単体テスト（`tests/version.test.ts`）を追加。

---

## [v0.1.4] - 2026-10-12

### Added
- **クイズUIと調教完了演出のブラッシュアップ ([#11](https://github.com/meshi-z/turf-talk/issues/11)):**
  - 選択肢タップ時のマイクロインタラクション（`active:scale-[0.98]`）および正誤判定時のポップ（`animate-pop`）・シェイク（`animate-shake`）アニメーションの実装。
  - Web Audio API によるシンセサイズド効果音（正解アルペジオ、不正解ソフト音、スタンプ打撃音）の実装（`src/lib/sound.ts`）。
  - ヘッダーへのサウンド消音（ミュート）トグルボタンの追加および LocalStorage 永続化。
  - 「💮 調教済」スタンプの押印アニメーション（振り下ろし・バウンス `animate-stamp-drop`）および波紋エフェクト（`animate-stamp-ripple`）の強化。
  - モバイル端末におけるタップ領域（最小高さ 58px）および垂直余白バランスの最適化。

---

## [v0.1.3] - 2026-10-12

### Fixed
- **復習モード出題対象の修正および正答フレーズのみ習得カウント対応 ([#25](https://github.com/meshi-z/turf-talk/issues/25)):**
  - 当日の調教完了後に「本日のフレーズを復習する」を選択した際、未履修フレーズが選出されてしまう不具合を修正し、当日出題された3問（`todayPhraseIds`）から復習出題されるよう改善。
  - クイズ完了時に誤答したフレーズまで習得済みとしてカウントされていた判定ロジックを修正し、正答（`isCorrect: true`）したフレーズのみを習得済みフレーズ（`learnedPhraseIds`）に記録するよう改修。

---

## [v0.1.2] - 2026-10-12

### Added
- **デイリー出題・ローテーションエンジン (`src/lib/dailyRotation.ts`) ([#10](https://github.com/meshi-z/turf-talk/issues/10)):**
  - 日付文字列（`YYYY-MM-DD`）と周回数から32bitハッシュシードを生成し、決定論的に日替わり3問を選出するPRNGエンジン（Mulberry32）を実装。
  - 未履修フレーズを優先して出題し、不足時は既習フレーズから補填するローテーション制御。
  - 全問履修後の復習出題および周回数（`lapCount`）カウントアップ処理。
  - 同一の問題であっても開くたびに4択の並び順が変化する選択肢ランダムシャッフル機能。
  - LocalStorageへの履修済みフレーズIDリスト（`learnedPhraseIds`）および周回数の永続化。
- **ホーム画面の学習進捗UI (`src/components/HomeScreen.tsx`):**
  - 習得フレーズ数（例: `12 / 30問`、`2周目`）のインジケーターおよびプログレスバーの表示。
- **デイリーローテーション・選択肢シャッフル単体テスト (`tests/daily_rotation.test.ts`):**
  - 決定論的シード動作、日替わり選出、未履修優先、全問履修後の復習モード、選択肢シャッフルの動作検証。

---

## [v0.1.1] - 2026-10-12

### Added
- **初期フレーズマスターデータ（全30問）の拡充 ([#9](https://github.com/meshi-z/turf-talk/issues/9)):**
  - 手応え・感触 (`feel`): 8問（`plenty in the tank`, `on the bridle`, `travelling sweetly` 等）
  - 仕掛け・展開 (`tactics`): 8問（`pushed the button`, `set the pace`, `kicked on`, `boxed in` 等）
  - 勝負根性・反応 (`reaction`): 7問（`dug deep`, `found more`, `put the race to bed` 等）
  - 陣営コメント・総括 (`comment`): 7問（`didn’t handle the ground`, `special horse`, `blown away` 等）
  - 各問題に競馬ファン向けワンポイント解説（1〜2行）およびリアルな日本語4択選択肢を完備
- データ整合性検証テスト（件数・ID一意性・選択肢整合性）の追加
- `docs/specs/phrase-schema.md` のカテゴリ定義および収録データ一覧の更新
- GitHub Actions 公式アクション最新化および依存パッケージ（typescript, @types/node）の更新 ([#22](https://github.com/meshi-z/turf-talk/pull/22))

---

## [v0.1.0] - 2026-10-11

### Added
- プロジェクト基盤の初期化（Vite, React, TypeScript, Tailwind CSS, Shadcn UI 連携設定）
- Phase 1 MVP プロトタイプ画面（ホーム画面、平日調教3問クイズ画面、調教完了演出画面）
- LocalStorage による進捗管理（当日の完了判定、連続日数ストリーク、愛馬ステータス）
- GitHub Pages 自動デプロイパイプライン（GitHub Actions）の構築
- Dependabot（npm および GitHub Actions）の設定
