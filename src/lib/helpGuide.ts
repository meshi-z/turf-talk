/**
 * ヘルプガイド（オンボーディング＆使い方解説モーダル）の定義と既読状態管理
 */

export const HELP_GUIDE_STORAGE_KEY = 'turf_talk_help_guide_seen_v1';

export type HelpGuideStepId =
  | 'overview'
  | 'weekday-training'
  | 'weekend-race'
  | 'career-retirement'
  | 'archive-features';

export interface HelpGuideHighlightItem {
  badge: string;
  title: string;
  description: string;
}

export interface HelpGuideStep {
  id: HelpGuideStepId;
  stepNumber: number;
  shortLabel: string;
  subtitle: string;
  title: string;
  lead: string;
  highlights: HelpGuideHighlightItem[];
  tip: string;
}

export const HELP_GUIDE_STEPS: readonly HelpGuideStep[] = [
  {
    id: 'overview',
    stepNumber: 1,
    shortLabel: '概要',
    subtitle: 'ABOUT TURFTALK',
    title: 'TurfTalkとは？',
    lead: '海外競馬の実況・インタビュー・現地観戦で使われる本格的な競馬英語を、愛馬の育成サイクルとともに1日3問からサクッと学べるマイクロラーニングアプリです。',
    highlights: [
      {
        badge: '120問収録',
        title: 'JRA海外競馬英和辞典に準拠した実践問題',
        description:
          '実戦フレーズ60問＋基礎重要語彙60問の全120問を収録。手応え・仕掛け・勝負根性・陣営コメントまで網羅しています。',
      },
      {
        badge: '1週間の流れ',
        title: '平日調教 ➡ 週末レースのリズムで定着',
        description:
          '平日は1日3問の調教クイズで英語と愛馬の調子を仕上げ、土日の週末レース（5問）で実戦力を試すサイクルです。',
      },
      {
        badge: '全8毛色',
        title: 'あなただけの愛馬とともに歩む4週間',
        description:
          'JRA基準の全8毛色（鹿毛〜白毛）と8大路線から愛馬を迎え、学んだ英語フレーズがそのまま愛馬との絆として記録されます。',
      },
    ],
    tip: 'ヘッダー右上の「？」ボタンやフッターの「使い方ガイド」から、いつでもこのガイドを再確認できます。',
  },
  {
    id: 'weekday-training',
    stepNumber: 2,
    shortLabel: '平日調教',
    subtitle: 'WEEKDAY TRAINING',
    title: '平日の調教サイクル（月〜金）',
    lead: '平日は「坂路」と「ウッドチップ」の2つの調教コースから選んで受講できます。どちらか1コース（3問）クリアで当日の調教達成となります。',
    highlights: [
      {
        badge: '第1コース',
        title: '坂路調教（実戦フレーズ 60問）',
        description:
          'レース実況や騎手・調教師インタビューでそのまま使われる生きた英語表現（traveling well 等）を4択で鍛えます。',
      },
      {
        badge: '第2コース',
        title: 'ウッドチップ調教（基礎・重要語彙 60問）',
        description:
          'furlong、going、colt、handicap など、海外競馬ニュースや出馬表を読むうえで欠かせない基礎単語を固めます。',
      },
      {
        badge: 'コンディション',
        title: '毎日の調教でベスト馬体重＆ストリーク維持',
        description:
          '週間の調教日数（0〜7日）が増えるほど愛馬の調子が「絶好調」へ上がり、週末レースで使える「余力（ヒント）」が増加します。',
      },
    ],
    tip: '日付の切り替えは毎日「午前4時」です。当日完了後も「追加調教」で未習得問題をどんどん進められます。',
  },
  {
    id: 'weekend-race',
    stepNumber: 3,
    shortLabel: '週末レース',
    subtitle: 'WEEKEND RACE & CARROTS',
    title: '週末レースと余力・にんじん（土・日）',
    lead: '土曜日・日曜日になると「週末レース」が解放されます（週1回出走可能）。実況アナウンスとともに展開する全5問の勝負に挑みましょう。',
    highlights: [
      {
        badge: '全5問構成',
        title: '基礎語彙2問 ➡ 実戦フレーズ3問のハイブリッド出題',
        description:
          'スタートから道中（第1〜2問）は基礎単語、勝負所から最後の直線（第3〜5問）は実戦フレーズが出題され、正答数で着順が決まります。',
      },
      {
        badge: '愛馬の余力',
        title: '迷ったときに使える「誤答除外ヒント」',
        description:
          '平日の調教日数に応じて最大3回の「余力（ヒント）」を獲得。レース中に使うと不正解の選択肢を1つ除外できます。',
      },
      {
        badge: '温存ボーナス',
        title: '余力を残してゴールすると「にんじん」獲得！',
        description:
          '余力を温存したまま完走すると、残数分の「にんじん（最大5本）」を獲得。うっかり調教を休んだ日に自動で消費され、連続記録（ストリーク）を守ります。',
      },
    ],
    tip: '初回の平日調教を1回以上完了すると、その愛馬の週末レース出走ゲートが開きます。',
  },
  {
    id: 'career-retirement',
    stepNumber: 4,
    shortLabel: '引退・継承',
    subtitle: '4-WEEK CAREER & SUCCESSION',
    title: '4週間キャリアと引退式・世代継承',
    lead: '1頭の愛馬の現役生活は「Week 1 〜 Week 4」の4週間です。選択した路線（全8路線）に沿って、メイクデビューから最高峰の舞台へと駆け上がります。',
    highlights: [
      {
        badge: 'Week 1 → 4',
        title: '新馬戦から国内G1、そして世界最高峰レースへ',
        description:
          'Week 1（新馬戦）➡ Week 2（重賞）➡ Week 3（国内G1）➡ Week 4（凱旋門賞・BCクラシック等の最高峰G1）とステージが進みます。',
      },
      {
        badge: '引退式',
        title: '4週完走で「二つ名（称号）」授与＆殿堂入り',
        description:
          'Week 4 のレースを終えると引退式が開催され、4週間の勝利数・G1制覇・習得英語数に応じた栄誉ある「二つ名」が授与されます。',
      },
      {
        badge: '世代継承',
        title: '英語の知識を引き継ぎ、次世代（第N+1世代）へ',
        description:
          '引退後は新たな毛色・馬名・路線で次世代の愛馬が誕生。習得した英語フレーズはそのまま引き継がれ、さらなる高みを目指せます。',
      },
    ],
    tip: '馬名・毛色抽選・挑戦路線は、その世代の「初回調教」を開始する前であればホーム画面で自由に変更できます。',
  },
  {
    id: 'archive-features',
    stepNumber: 5,
    shortLabel: '図鑑・殿堂',
    subtitle: 'PHRASE BOOK & HALL OF FAME',
    title: 'フレーズ図鑑 & 殿堂入りギャラリー',
    lead: 'ホーム画面下部のコレクションメニューから、これまでに培った英語知識と歴代パートナー馬の栄光をいつでも振り返ることができます。',
    highlights: [
      {
        badge: 'フレーズ図鑑',
        title: '3カ国アクセント音声読み上げ＆要復習ブックマーク',
        description:
          '全120問をコース・カテゴリ・習得状況で検索可能。米国（US）・英国（UK）・豪州（AU）の3カ国アクセントと速度切替（1.0x / 0.8x）でリスニングも鍛えられます。',
      },
      {
        badge: 'パートナー記録',
        title: '「どの愛馬と初めて習得したか」を永久記録',
        description:
          '図鑑の各フレーズには、最初に正解して習得したときの愛馬の世代・馬名・毛色がパートナーとして刻まれます。',
      },
      {
        badge: '殿堂入り',
        title: '額装記念肖像画とSNSシェア・記念カード保存',
        description:
          '引退した歴代愛馬が専用額装ポートレートとともに並びます。戦績の振り返りや、X（旧Twitter）シェア、記念カード画像（PNG）の保存が可能です。',
      },
    ],
    tip: '気になるフレーズに「★（要復習）」を付けておくと、週末レース前の直前チェックに便利です！',
  },
];

function resolveStorage(
  customStorage?: Pick<Storage, 'getItem' | 'setItem'> | null
): Pick<Storage, 'getItem' | 'setItem'> | null {
  if (customStorage !== undefined) {
    return customStorage;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // プライベートブラウジング等で localStorage アクセスが制限されている場合
  }
  return null;
}

/**
 * ヘルプガイドを既に確認済みかどうかを判定します。
 */
export function hasSeenHelpGuide(
  customStorage?: Pick<Storage, 'getItem' | 'setItem'> | null
): boolean {
  const storage = resolveStorage(customStorage);
  if (!storage) return false;
  try {
    return storage.getItem(HELP_GUIDE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * ヘルプガイドを確認済みとして記録します。
 */
export function markHelpGuideSeen(
  customStorage?: Pick<Storage, 'getItem' | 'setItem'> | null
): void {
  const storage = resolveStorage(customStorage);
  if (!storage) return;
  try {
    storage.setItem(HELP_GUIDE_STORAGE_KEY, 'true');
  } catch {
    // 容量制限等で保存できない場合は無視して継続
  }
}
