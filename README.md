# TurfTalk | 海外競馬英語マイクロラーニング

一般的な英語学習サービスでは学べない、海外G1の勝利騎手・調教師インタビューや現地公式中継の「生きた英語表現・スラング（`in the tank`, `on the bridle`, `dug deep` など）」を、愛馬の育成サイクルとともに1日3問から直感的に身につける競馬英語マイクロラーニングアプリです。

- **公開URL**: https://turftalk-jp.web.app/
- **現在のバージョン**: `v1.1.4`

---

## 主な特徴

1. **平日調教（1日3問）× 週末レース（全5問）のリズム**
   - **坂路調教（実戦フレーズ 60問）** と **ウッドチップ調教（基礎・重要語彙 60問）** の全120問（JRA海外競馬英和辞典・海外競馬メディア準拠）を収録。
   - 平日の調教消化日数に応じて愛馬のコンディションと週末レースで使える「余力（誤答除外ヒント）」が変化し、余力を温存して完走すると連続調教記録を守る「にんじん」を獲得できます。
2. **4週間キャリアサイクル & 殿堂入りアーカイブ**
   - JRA基準の全8毛色・全8大路線から愛馬を迎え、Week 1（新馬戦）から Week 4（凱旋門賞・BCクラシック等の世界最高峰G1）まで4週間を駆け抜けます。
   - 引退式で戦績に応じた「二つ名（称号）」が授与され、額装記念ポートレート・記念カード画像保存・SNSシェアに対応した殿堂入りギャラリーに記録されます。
3. **フレーズ図鑑 & 3カ国アクセント音声読み上げ**
   - 米国（US）・英国（UK）・豪州（AU）の3カ国英語アクセントと再生速度切替（1.0x / 0.8x）に対応。要復習ブックマークや初習得時のパートナー愛馬記録も備えています。
4. **オフライン完全対応（PWA）& クラウドバックアップ**
   - Service Worker により混雑した競馬場や移動中のオフライン環境でも動作。
   - ログイン不要のゲスト利用（LocalStorage保存）に加え、Google / X（旧Twitter）アカウント連携による Cloud Firestore への自動バックアップ・端末間引き継ぎに対応しています。

---

## 技術スタック

- **フロントエンド**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons
- **PWA / オフライン**: `vite-plugin-pwa` (Workbox Service Worker), Web Audio API, Web Speech API
- **バックエンド / クラウド**: Firebase Hosting, Firebase Authentication (Anonymous / Google / X OAuth), Cloud Firestore, Firebase App Check, Firebase Analytics

---

## 開発コマンド

```bash
# 依存パッケージのインストール
npm install

# ローカル開発サーバーの起動
npm run dev

# Lint 検査 (oxlint)
npm run lint

# 単体テストの実行 (Node.js test runner)
npm test

# 型検査 & 本番ビルド
npm run build
```

---

## ドキュメント一覧

詳細な仕様・設計書は `docs/` 配下で管理されています（詳細は [`AGENTS.md`](./AGENTS.md) を参照）：

- [`docs/VISION_AND_REQUIREMENTS.md`](./docs/VISION_AND_REQUIREMENTS.md): プロダクトビジョン・要求定義
- [`docs/ROADMAP.md`](./docs/ROADMAP.md): ロードマップ・フェーズ計画
- [`docs/non-functional-requirements.md`](./docs/non-functional-requirements.md): 非機能要件・品質基準
- [`docs/specs/phrase-schema.md`](./docs/specs/phrase-schema.md): フレーズマスタースキーマ・データ作成原則
- [`docs/specs/horse-career-cycle.md`](./docs/specs/horse-career-cycle.md): 競走馬4週間キャリア・世代継承仕様
- [`docs/specs/horse-visual-assets.md`](./docs/specs/horse-visual-assets.md): 全8毛色・全6シーンイラスト仕様
- [`docs/specs/backend-architecture.md`](./docs/specs/backend-architecture.md): Firebase / BigQuery / Looker Studio アーキテクチャ仕様
- [`docs/CHANGELOG.md`](./docs/CHANGELOG.md): 変更履歴・リリースノート

---

## 免責事項

本サービスは個人で開発・運営している非公式の英語学習ファンサービスであり、日本中央競馬会（JRA）、地方競馬全国協会（NAR）、海外の各競馬統括機関・主催団体、および実在する馬主・調教師・騎手・生産牧場等の公式団体とは一切関係ありません。
