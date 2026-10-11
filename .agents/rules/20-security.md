# Security implementation rules

セキュリティ要件の詳細仕様がある場合は、`docs/security/` を正本とする。

## Input and output

- すべての外部入力・ユーザー入力を信頼境界として扱う。
- `dangerouslySetInnerHTML`は、承認されたサニタイズ処理なしで使用しない。
- ユーザー入力からクラス名、URL、リダイレクト先、ファイルパスを無制限に構築しない。
- XSS脆弱性を防ぐため、フレームワーク標準のエスケープ機構を活用する。

## Client-side storage & Privacy

- LocalStorage等のクライアントストレージに個人情報や機密情報を保存しない。
- LocalStorageから読み込んだデータは型検証・バリデーションを行い、破損データや不正なスクリプト混入に対処できる防御的設計とする。
- 秘密情報、認証トークンをログやクライアントバンドルへ直接記述しない。
- 秘密情報は環境変数から参照し、クライアント公開用（`NEXT_PUBLIC_`や`VITE_`等）とサーバー専用環境変数を厳格に区別する。

## Dependencies and registries

- Shadcn UIのRegistryから取得するコードも外部コードとしてレビューする。
- 未承認のRegistryを`components.json`に追加しない。
- 追加されたnpm依存関係について、用途、保守状況、ライセンス、既知の脆弱性を確認する。
- ロックファイルをコミットし、再現可能なインストールを維持する。

## Browser security

- 外部リンクには `rel="noopener noreferrer"` 等、用途に応じた安全な属性を設定する。
- URL、iframe、画像、音声ファイルの読み込み元を制限・検証する。
- Content Security Policy (CSP) を無効化してUIを動作させない。
