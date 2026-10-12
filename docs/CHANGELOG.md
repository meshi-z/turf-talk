# 変更履歴 (Changelog)

すべての重要な変更は本ドキュメントに記録されます。
フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づき、セマンティックバージョニングに準拠します。

---

## [Unreleased]

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
