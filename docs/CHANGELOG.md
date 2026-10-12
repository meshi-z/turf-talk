# Changelog

すべての主要な変更履歴は本ファイルに記録されます。
フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準拠し、セマンティックバージョニングを採用しています。

---

## [0.1.1] - 2026-10-12

### 変更 (Changed)
- **CI/CDワークフローの更新**:
  - GitHub Pagesデプロイワークフローのアクションを最新メジャーバージョンへ更新（`actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`）
- **開発依存パッケージの更新**:
  - `typescript` を 7.0.2 に更新
  - `@types/node` を 26.6.4 に更新

---

## [0.1.0] - 2026-10-12

### Phase 1: MVP（最小検証版）初期リリース

海外競馬の勝利騎手・調教師の「生のつぶやき・興奮」を直感で掴むマイクロラーニングアプリ「TurfTalk」のMVPリリースです。

#### 追加 (Added)
- **平日調教モード（4択クイズエンジン）**:
  - 1日3問のスキマ時間学習サイクル
  - 競馬特有の比喩表現・スラングに特化した初期フレーズマスターデータ
  - 即時正誤判定と競馬ファン向けのワンポイント解説
- **画面プロトタイプ**:
  - ホーム画面（調教開始・ステータス表示）
  - クイズ画面（問題文、プログレスバー、4択選択肢）
  - 結果画面（正解数、フィードバック、調教完了演出）
- **ブランドアイデンティティ & PWA（Progressive Web App）対応**:
  - リリース済み「重賞カレンダー」アプリと統一感を持たせたシスターアプリアイコン（角丸四角形白ベタ吹き出し「シスター・バブル」）の策定
  - iOS / Android / デスクトップ向けの全解像度アイコン（192x192, 512x512, maskable, apple-touch-icon, favicon）の生成・配置
  - ベクターSVGアイコン（`favicon.svg`, `icon.svg`）の導入
  - `manifest.webmanifest` によるスタンドアロン起動およびテーマカラー対応
- **開発基盤 & CI/CD**:
  - Vite + React 19 + TypeScript + Tailwind CSS による軽量・高速フロントエンド基盤
  - GitHub Pages への自動ビルド・デプロイパイプライン
  - Dependabot および GitHub Issue Templates（Bug / Feature / Chore / Documentation）
