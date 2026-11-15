/**
 * 利用規約・免責事項・プライバシーポリシー・データ保存仕様・お問い合わせ定義
 */
import { APP_VERSION } from '../version.ts';

export const OFFICIAL_X_HANDLE = '@meshi__z';
export const OFFICIAL_X_URL = 'https://x.com/meshi__z';
export const LEGAL_LAST_UPDATED = '2026年11月15日';

export type LegalTabId = 'terms' | 'privacy' | 'storage' | 'contact';

export interface LegalSectionItem {
  badge: string;
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}

export interface LegalTabDefinition {
  id: LegalTabId;
  tabNumber: number;
  shortLabel: string;
  subtitle: string;
  title: string;
  lead: string;
  sections: readonly LegalSectionItem[];
  note: string;
}

export const LEGAL_TABS: readonly LegalTabDefinition[] = [
  {
    id: 'terms',
    tabNumber: 1,
    shortLabel: '規約・免責',
    subtitle: 'TERMS & DISCLAIMER',
    title: '利用規約・免責事項',
    lead: '「TurfTalk」（以下「本サービス」）をご利用いただく際の規約および免責事項です。本サービスをご利用になることで、本規約に同意いただいたものとみなします。',
    sections: [
      {
        badge: '第1条',
        title: '公式競馬主催者・関連団体との非関連明記',
        paragraphs: [
          '本サービスは、海外競馬の実況やインタビューで用いられる英語表現を楽しく学ぶために個人で開発・運営している非公式の英語学習ファンサービスです。',
          '日本中央競馬会（JRA）、地方競馬全国協会（NAR）、海外の各競馬統括機関・主催団体（France Galop、British Horseracing Authority、Breeders’ Cup Limited 等）、ならびに実在する馬主・生産牧場・調教師・騎手・報道機関等の公式団体とは一切関係ありません。',
        ],
      },
      {
        badge: '第2条',
        title: 'サービスの目的（馬券購入・賭博の非勧誘）',
        paragraphs: [
          '本サービスは、競馬中継やインタビューの英語リスニングおよび語彙習得を支援する純粋な語学・文化学習ツールです。',
          '勝馬投票券（馬券）の購入勧誘、レース予想情報の提供、または金銭・賞品等を賭ける行為を一切目的としていません。アプリ内の「調教」「週末レース」「着順」「称号」等はすべて学習継続のためのゲーミフィケーション演出です。',
        ],
      },
      {
        badge: '第3条',
        title: 'コンテンツの正確性と免責事項',
        paragraphs: [
          '収録されている英語フレーズ・和訳・解説・模擬レース情報は、JRA海外競馬英和辞典や実際の海外競馬中継における用例を参考に細心の注意を払って作成していますが、その完全性・正確性・最新性を保証するものではありません。',
          '本サービスの利用、またはシステム障害・メンテナンス・仕様変更等により本サービスが利用できなかったことで生じたいかなる損害についても、運営者は故意または重過失がある場合を除き一切の責任を負いません。',
        ],
      },
      {
        badge: '第4条',
        title: '禁止事項・知的財産権',
        paragraphs: [
          '本サービス内の文章・問題データ・イラスト・音声・プログラム等の著作権および知的財産権は、運営者または正当な権利者に帰属します。以下の行為を禁止します。',
        ],
        bullets: [
          '本サービス内のコンテンツ・イラスト等の無断転載、複製、再配布、または商用利用',
          '不正アクセス、ローカルまたはクラウドデータの不正改ざん、サーバーへ過度な負荷をかける行為',
          '法令または公序良俗に反する行為、その他運営者が不適切と判断する行為',
        ],
      },
    ],
    note: `最終改定日: ${LEGAL_LAST_UPDATED} — サービス改善に伴い、本規約は予告なく改定される場合があります。`,
  },
  {
    id: 'privacy',
    tabNumber: 2,
    shortLabel: 'プライバシー',
    subtitle: 'PRIVACY POLICY',
    title: 'プライバシーポリシー',
    lead: '本サービスにおけるユーザー情報の取り扱い方針を定めています。ユーザーの個人情報を保護し、安心して学習いただける環境を維持します。',
    sections: [
      {
        badge: '取得情報',
        title: '取得・保存する情報について',
        paragraphs: [
          '本サービスは、氏名・住所・電話番号・独自のパスワード等の個人情報を収集・保持しません。サービス提供のため、以下の情報のみを取り扱います。',
        ],
        bullets: [
          '学習・育成データ：習得フレーズ履歴、連続調教日数、育成中の愛馬・殿堂入り履歴、音声設定（ブラウザの LocalStorage および Cloud Firestore に保存）',
          '認証識別子：Firebase Authentication が自動発行するランダムな匿名UID、および任意でクラウド連携（Google / X ログイン）を行った場合の連携先識別情報',
          '利用統計データ：Firebase Analytics による個人を特定しない匿名の利用状況データ（調教完了・レース完走イベント等）',
        ],
      },
      {
        badge: '利用目的',
        title: '情報の利用目的',
        paragraphs: [
          '取得した情報は、以下の目的に限定して利用いたします。',
        ],
        bullets: [
          '学習進捗・愛馬データの保存、および機種変更・複数端末間でのデータ同期のため',
          '問題の正答率や消化率の統計分析、新問題の追加判断、およびアプリ品質改善・不具合調査のため',
          '不正アクセス・データ改ざんの防止およびセキュリティ維持のため',
        ],
      },
      {
        badge: '安全管理',
        title: '第三者提供の禁止とセキュリティ対策',
        paragraphs: [
          '法令に基づく場合を除き、ユーザーの同意なく取得情報を第三者へ提供することはありません。',
          'クラウド基盤には Google Cloud（Firebase）を採用し、パスワードを保持しない OAuth 2.0 / OIDC 認証、本人データのみ読み書きを許可する Firestore セキュリティルール、および Firebase App Check による不正リクエスト遮断を実施しています。',
        ],
      },
      {
        badge: '削除手続',
        title: 'アカウント連携解除・退会（データ削除）',
        paragraphs: [
          'クラウド連携をご利用中の場合でも、ヘッダー右上の「クラウド連携」メニューからいつでも連携解除、または退会（アカウントおよび学習データの削除）を行うことができます。',
        ],
      },
    ],
    note: '解析ツール（Firebase Analytics）は Cookie やモバイル識別子を利用して匿名のトラフィックデータを収集します。',
  },
  {
    id: 'storage',
    tabNumber: 3,
    shortLabel: 'データ保存',
    subtitle: 'DATA STORAGE & BACKUP',
    title: 'データ保存に関する注意事項',
    lead: '本サービスはログイン不要で手軽にご利用いただけますが、ブラウザ保存（LocalStorage）の特性上、データ消失を防ぐために以下の仕様を必ずご確認ください。',
    sections: [
      {
        badge: '重要注意',
        title: '未連携（ゲスト）利用時のデータ消失リスク',
        paragraphs: [
          'クラウド連携を行っていない初期状態（ゲストプレイ）では、学習履歴や愛馬データはすべて「現在お使いのブラウザ内（LocalStorage）」のみに保存されます。',
          '以下の操作や環境ではデータがリセット（初期化）され、元に戻せなくなりますのでご注意ください。',
        ],
        bullets: [
          'ブラウザの「閲覧履歴・キャッシュ・Cookie・サイトデータ」を消去した場合',
          'シークレットモード（プライベートブラウジング）でプレイした場合（タブを閉じると消去されます）',
          'LINE・X（旧Twitter）等のSNSアプリ内ブラウザで一時的に開いてプレイした場合',
          'Safari 等のブラウザ保護機能（ITP等）により、一定期間アクセスがないサイトのデータが自動削除された場合',
        ],
      },
      {
        badge: '移行制限',
        title: '機種変更・別端末への引き継ぎ制限と免責',
        paragraphs: [
          '未連携（ゲスト）状態のデータはブラウザ固有の保存領域に紐づいているため、未連携のままではスマートフォンの機種変更、別ブラウザ（例：アプリ内ブラウザからSafari/Chrome）への乗り換え、PC・スマホ間のデータ引き継ぎは行えません。',
          'ブラウザのデータ消去や端末の紛失・故障等により未連携データが消失した場合、運営者側でのデータ復旧はいたしかねますのであらかじめご了承ください。',
        ],
      },
      {
        badge: '推奨設定',
        title: 'クラウド連携（Google / X）による自動バックアップ',
        paragraphs: [
          '画面右上ヘッダーの「クラウド連携」ボタンから Google アカウントまたは X（旧Twitter）アカウントを連携すると、現在育成中の愛馬・ストリーク・習得フレーズを100%維持したままクラウドへ自動バックアップされます。',
          '大切な愛馬と学習記録を守るため、また機種変更や複数端末でのプレイに備えるため、お早めのクラウド連携を強くおすすめいたします。',
        ],
      },
    ],
    note: '標準ブラウザ（iOSならSafari、Android/PCならChrome等）で開き、ホーム画面に追加（PWA）＋クラウド連携していただくと最も快適・安全にご利用いただけます。',
  },
  {
    id: 'contact',
    tabNumber: 4,
    shortLabel: 'お問合せ',
    subtitle: 'FEEDBACK & SUPPORT',
    title: 'フィードバック・不具合報告',
    lead: 'アプリの不具合報告、英語フレーズ・和訳・解説に関するご指摘、新機能のご要望などは、開発者の X（旧Twitter）アカウントにて受け付けております。',
    sections: [
      {
        badge: '連絡窓口',
        title: `開発者 X（旧Twitter）: ${OFFICIAL_X_HANDLE}`,
        paragraphs: [
          `ご意見・ご感想・不具合のご報告は、開発者アカウント（${OFFICIAL_X_HANDLE}）への DM（ダイレクトメッセージ）、またはメンション（リプライ）／ハッシュタグ「#TurfTalk」付きポストにてお気軽にお寄せください。`,
          '個人開発で運営しているため、すべてのご連絡に個別返信できない場合がございますが、いただいたご報告・ご要望はすべて目を通し、問題データの改善や機能アップデートに活用させていただきます。',
        ],
      },
      {
        badge: 'ご報告時',
        title: '不具合報告時に添えていただくと助かる情報',
        paragraphs: [
          '不具合や表示崩れをご報告いただく際は、以下の項目（下のボタンからテンプレートをコピーできます）を添えていただくと原因特定がスムーズになります。',
        ],
        bullets: [
          '発生した画面・操作手順（例：週末レース結果画面、フレーズ図鑑の検索時など）',
          'ご利用環境（iPhone / Android / PC、Safari / Chrome 等）とアプリバージョン',
          '気になっている問題文や英語フレーズ（フレーズ内容に関するご指摘の場合）',
        ],
      },
    ],
    note: 'アカウントのDM受信設定等によりDMが送信できない場合は、お手数ですがリプライ（メンション）にてお声がけください。',
  },
];

/**
 * 指定されたタブIDに対応する定義を取得します。
 */
export function getLegalTabById(tabId: LegalTabId): LegalTabDefinition {
  return LEGAL_TABS.find((tab) => tab.id === tabId) ?? LEGAL_TABS[0];
}

export interface FeedbackTemplateParams {
  appVersion?: string;
  isCloudLinked?: boolean;
}

/**
 * 不具合報告・フィードバック送信時に貼り付けやすい環境情報テンプレートを生成します。
 */
export function generateFeedbackTemplate(params: FeedbackTemplateParams = {}): string {
  const version = params.appVersion ?? APP_VERSION;
  const syncStatus =
    params.isCloudLinked === undefined
      ? '未確認'
      : params.isCloudLinked
        ? 'クラウド連携済'
        : 'ゲスト（未連携）';

  return [
    '【TurfTalk フィードバック・不具合報告】',
    `・バージョン: ${version}`,
    `・連携状態: ${syncStatus}`,
    '・ご利用端末/ブラウザ: （例: iPhone / Safari）',
    '・内容: ',
  ].join('\n');
}
