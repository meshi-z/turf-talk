# Firebase 初期セットアップ & GitHub Secrets 登録ガイド

本ドキュメントは、Firebase / Google Cloud を初めて触る開発者向けに、「TurfTalk」を Firebase Hosting にデプロイし、GitHub Actions での自動デプロイを設定するための手順書です。

---

## 1. Firebase プロジェクトの作成（約3分）

1. [Firebase Console](https://console.firebase.google.com/) にアクセスし、Googleアカウントでログインします。
2. **「プロジェクトを追加」** をクリックします。
3. プロジェクト名に `turf-talk`（または任意の一意な名前）を入力し、「続行」をクリックします。
4. **Google アナリティクス**:
   - 「このプロジェクトで Google アナリティクスを有効にする」を **有効（推奨）** にして「続行」をクリック。
   - アナリティクスアカウントを選択（または「Default Account for Firebase」を新規作成）し、「プロジェクトを作成」をクリック。
5. プロジェクトの作成が完了したら「続行」をクリックしてダッシュボードに入ります。

---

## 2. Web アプリ（マイアプリ）の追加 & APIキーの取得（約2分）

1. Firebase Console のホーム画面中央にある **ウェブアイコン（`</>`）** をクリックします。
2. アプリのニックネームに `TurfTalk Web` と入力します。
3. **「このアプリの Firebase Hosting も設定します」** にチェックを入れます。
4. 「アプリを登録」をクリックします。
5. 画面に `const firebaseConfig = { ... }` という設定オブジェクトが表示されます。ここに記載されている以下の値をメモします：
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId`
6. 「次へ」を押し進め、「コンソールに進む」で完了します。

---

## 3. GitHub Actions 用のデプロイ鍵（サービスアカウント）の取得（約3分）

GitHub Actions から Firebase Hosting へ自動デプロイするために、サービスアカウントキーを発行します。

### ■ 方法 A: Firebase CLI から自動発行（最も簡単・おすすめ）
パソコンのターミナルで以下を実行します：
```bash
# ログイン（ブラウザが開きます）
npx firebase login

# GitHub Actions 用の初期化（GitHub リポジトリとの紐付け）
npx firebase init hosting:github
```
質問に沿って以下のように進めます：
1. `For which GitHub repository would you like to set up a github workflow?`: `meshi-z/turf-talk`
2. `Set up the workflow to run a build script before every deploy?`: `Yes`
3. `What script should be run before every deploy?`: `npm ci && npm run build`
4. `Set up automatic deployment to your site's live channel when a PR is merged?`: `Yes`
5. `What is the name of the GitHub branch associated with your site's live channel?`: `master`

→ これを実行すると、Firebase CLI が自動的に GitHub の Secrets に `FIREBASE_SERVICE_ACCOUNT` を安全に登録してくれます！

---

## 4. GitHub リポジトリへの環境変数（Secrets）登録（約2分）

GitHub のリポジトリ画面（`https://github.com/meshi-z/turf-talk/settings/secrets/actions`）を開き、**「New repository secret」** から手順 2 でメモした以下の値を登録します：

| Secret 名 | 設定する値（例） |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `AIzaSy...`（Webアプリの apiKey） |
| `VITE_FIREBASE_AUTH_DOMAIN` | `turf-talk-xxxx.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `turf-talk-xxxx` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `turf-talk-xxxx.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` |
| `VITE_FIREBASE_APP_ID` | `1:123456789012:web:abcdef...` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-XXXXXXXXXX` |
| `FIREBASE_SERVICE_ACCOUNT` | ※手順 3 で自動登録された場合は登録不要 |

---

## 5. ローカル開発環境での確認（任意）

ローカル環境でも Firebase と接続してテストしたい場合は、プロジェクトルート直下に `.env.local` ファイルを作成し、同じ値を記載します：

```env
# .env.local
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=turf-talk-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=turf-talk-xxxx
VITE_FIREBASE_STORAGE_BUCKET=turf-talk-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```
※ `.env.local` は `.gitignore` に含まれているため、GitHub にコミットされることはありません。
