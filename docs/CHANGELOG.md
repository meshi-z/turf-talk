# 変更履歴 (Changelog)

すべての重要な変更は本ドキュメントに記録されます。
フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づき、セマンティックバージョニングに準拠します。

---

## [Unreleased]

### Added
- **初期フレーズマスターデータ（全30問）の拡充 ([#9](https://github.com/meshi-z/turf-talk/issues/9)):**
  - 手応え・感触 (`feel`): 8問（`plenty in the tank`, `on the bridle`, `travelling sweetly` 等）
  - 仕掛け・展開 (`tactics`): 8問（`pushed the button`, `set the pace`, `kicked on`, `boxed in` 等）
  - 勝負根性・反応 (`reaction`): 7問（`dug deep`, `found more`, `put the race to bed` 等）
  - 陣営コメント・総括 (`comment`): 7問（`didn’t handle the ground`, `special horse`, `blown away` 等）
  - 各問題に競馬ファン向けワンポイント解説（1〜2行）およびリアルな日本語4択選択肢を完備
- データ整合性検証テスト（件数・ID一意性・選択肢整合性）の追加
- `docs/specs/phrase-schema.md` のカテゴリ定義および収録データ一覧の更新

---

## [v0.1.0] - 2026-10-11

### Added
- プロジェクト基盤の初期化（Vite, React, TypeScript, Tailwind CSS, Shadcn UI 連携設定）
- Phase 1 MVP プロトタイプ画面（ホーム画面、平日調教3問クイズ画面、調教完了演出画面）
- LocalStorage による進捗管理（当日の完了判定、連続日数ストリーク、愛馬ステータス）
- GitHub Pages 自動デプロイパイプライン（GitHub Actions）の構築
- Dependabot（npm および GitHub Actions）の設定
