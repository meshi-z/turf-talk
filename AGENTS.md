# Antigravity Agent Routing Index: TurfTalk

このファイルは、競馬英語学習マイクロラーニングアプリ「TurfTalk」におけるAIエージェント（Antigravity）用の目次およびルーティングガイドです。
具体的なルールや仕様は本ファイルには記載していません。タスクの内容に応じて、以下の関連ファイル（Single Source of Truth）を必ず読み込み、その指示に従って作業を開始してください。

## 1. プロダクト仕様・要件ルーティング (Product Specifications Routing)

タスクの目的に応じて、以下のドキュメントを参照・更新してください。

| タスクの対象・目的 | 参照先ドキュメント (Single Source of Truth) | 内容・用途 |
| :--- | :--- | :--- |
| **プロダクトビジョン・要求定義** | **`docs/VISION_AND_REQUIREMENTS.md`** | プロダクト概要、ビジョン、ペルソナ、ユーザーストーリー、コア機能要件 |
| **ロードマップ・フェーズ計画** | **`docs/ROADMAP.md`** | Phase 1 (MVP) 〜 Phase 3 (Official Release) のスコープおよび完了判定基準 |
| **クイズ・フレーズ仕様（策定中）** | **`docs/specs/quiz-engine.md`** / **`phrases.md`** | フレーズマスターデータ構造、4択生成ロジック、調教・レース判定ロジック |
| **非機能要件・品質基準** | **`docs/non-functional-requirements.md`** | 性能指標（FCP/LCP/INP、バンドルサイズ）、レスポンシブ・オフライン動作要件 |
| **変更履歴・開発実績** | **`docs/CHANGELOG.md`** | 各フェーズ・バージョンのリリースノートおよび変更履歴 |

---

## 2. プロジェクト開発規約 (Agent Rules)

コードを生成・変更する際の基本ルール、コマンド定義、正本の優先順位については以下を参照してください。

- **`.agents/rules/00-project.md`**: プロジェクトルールの正本（参照ドキュメントの優先順位、使用技術、データ正確性原則、変更スコープ）。

### A. AIコードコミット規約 (AI Code Commit Rules)

Gitコミットを行う際は、人間とAIの共同開発を正確に記録するため、コミットメッセージの最下部（フッター）に必ず以下の「`Co-authored-by`」表記を含めてください。

メッセージの構成ルール:

1. コミットメッセージ本文（通常の変更内容の記述）
2. 「必ず1行の空行」を入れる
3. 以下のテキストをそのまま記述する

```text
Co-authored-by: Antigravity <antigravity@example.com>
```

### B. AI GitHub規約 (AI GitHub Rules)

GitHubにPull Requestを出したり、Issueを出したりする際は、人間とAIの共同開発を正確に記録するため、必ず `--body`（または `-b`）の末尾に必ず以下の「`Co-authored-by`」表記を含めてください。

メッセージの構成ルール:

1. 本文（通常の変更内容の記述）
2. 「必ず1行の空行」を入れる
3. 以下のテキストをそのまま記述する

```text
Co-authored-by: Antigravity <antigravity@example.com>
```

---

## 3. UI/UX & デザインシステム要件 (Design System)

フロントエンド（Shadcn UI, Tailwind CSS, アクセシビリティ）の実装・変更を行う場合は以下を参照してください。

- **`.agents/rules/10-design-system.md`**: Shadcn UI の実装ルール、テーマリング、アクセシビリティ基準。
- **`components.json`**: Shadcn UI CLI の設定（エイリアス、ベースカラー等）の正本。

---

## 4. 品質・非機能要件 (Quality & Ops)

セキュリティ、パフォーマンス、またはタスクの完了確認を行う場合は以下を参照してください。

- **`.agents/rules/20-security.md`**: セキュリティ要件（クライアントサイドストレージ、入力サニタイズ等）。
- **`.agents/rules/30-performance.md`**: パフォーマンス要件（軽量性、表示速度、再レンダリング抑制）。
- **`.agents/rules/40-definition-of-done.md`**: タスクの完了定義 (Definition of Done)。