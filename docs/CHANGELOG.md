# 変更履歴 (Changelog)

すべての重要な変更は本ドキュメントに記録されます。
フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づき、セマンティックバージョニングに準拠します。

---

## [Unreleased]

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
