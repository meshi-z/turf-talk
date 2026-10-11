# Project rules

## Sources of truth

優先順位は次のとおり。

1. `docs/VISION_AND_REQUIREMENTS.md`（プロダクトビジョン・要求定義書）
2. `docs/ROADMAP.md`（ロードマップ・各フェーズスコープ）
3. `docs/specs/`（クイズエンジンおよびフレーズデータ仕様書）
4. `docs/non-functional-requirements.md`（非機能要件）
5. `components.json`
6. 既存のソースコードとテスト
7. Shadcn UI公式ドキュメント

- 要件と実装が矛盾する場合、黙って一方を採用せず報告する。
- 仕様が確認できない場合は、推測でプロジェクト標準を変更しない。

## Data accuracy & Single Source of Truth (フレーズデータの正確性)

- **実在する競馬現場・公式メディアの英語表現への準拠**:
  - フレーズマスターデータは、海外競馬公式中継、主要G1勝利騎手・調教師インタビュー、海外競馬メディア（Racing Post, Sporting Life, BloodHorse等）等で実際に使われる表現・慣用句・スラングを正とする。
- **事実データ・実績値の推測補完・架空生成の厳禁**:
  - AIの内部記憶や連想による不自然な造語や、実在しない架空の競馬スラング・解説をマスターデータに登録してはならない。
  - ニュアンスや用例に確証が持てない場合は、推測で補完せず公式用例または信頼できる一次ソースを確認・検証する。
- **競馬ファンの文脈に寄り添ったワンポイント解説**:
  - 機械的な直訳や過剰な文法解説ではなく、「競馬ファンなら直感で腑に落ちるレース展開・馬の手応え・関係者の感情」に即した解説を維持する。

## Technology

- UIの基盤としてShadcn UIを採用する。
- 実際のフレームワーク、スタイル、RSC、TypeScript、Tailwind CSS、エイリアスの設定は、`components.json`を正本とする。
- ランタイムとパッケージマネージャーのバージョンは、`package.json`、ロックファイル、バージョン管理ファイルに従う。

## Change scope

- 依頼範囲を超えてShadcn UIコンポーネントを更新・改変しない。
- `components.json`の初期化時設定を無断で変更しない。
- 新しいUI依存関係や外部ライブラリを追加する前に承認を得る。
- ロックファイルを意図せず全面更新しない。
- 自動生成コマンド実行後は、生成されたコードと依存関係の差分を確認する。

## Commands

プロジェクトで定義されたコマンドを使用する。

- Install: `npm install`
- Development: `npm run dev`
- Lint / Type check: `npm run lint` / `npm run type-check`
- Test: `npm test`
- Build: `npm run build`

存在しないコマンドを推測で実行しない。

## Temporary file management (一時ファイルの管理)

- **リポジトリワークスペース内への一時ファイル配置・コミットの厳禁**:
  - AIエージェントがIssue本文、PR本文、コミットメッセージ、リリースノート、調査用スクラッチファイル等の一時ファイルを生成する際は、リポジトリワークスペース内への配置を厳禁とする。
- **エージェント専用スクラッチ領域の使用徹底**:
  - シェル実行時のエスケープエラー回避や一時データ保存が必要な場合は、リポジトリ外のエージェント専用スクラッチディレクトリ（`<appDataDir>/brain/<conversation-id>/scratch/` 等）を使用すること。