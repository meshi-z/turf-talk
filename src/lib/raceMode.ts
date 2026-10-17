import type { PhraseCategory, PhraseItem, QuizOption } from '../data/phrases';
import type { CareerRouteRace, CareerWeek } from '../types';

export const RACE_QUESTION_COUNT = 5;
export const RACE_VOCABULARY_COUNT = 2; // レース前半（第1〜2問）: 基礎単語・競馬用語
export const RACE_PHRASE_COUNT = 3;     // レース後半（第3〜5問）: 実戦フレーズ

export interface RacePhase {
  step: number; // 1 to 5
  phaseName: string;
  distanceRemaining: string;
  commentary: string;
  correctReaction: string;
  incorrectReaction: string;
}

export const RACE_THEME_LABELS: Record<PhraseCategory, string> = {
  feel: '手応え・感触',
  tactics: '仕掛け・展開',
  reaction: '勝負根性・反応',
  comment: '陣営コメント・総括',
};

export function getRaceThemeLabel(category: PhraseCategory): string {
  return RACE_THEME_LABELS[category] ?? '総合実戦';
}

/**
 * 距離表記（例: "芝1800m", "G2・芝2000m", "英G3・障7200m"）からメートル数値を抽出する
 */
export function extractDistanceMeters(distanceText?: string): number {
  if (!distanceText) return 2400;
  const match = distanceText.match(/(\d{3,4})\s*m/i);
  if (!match) return 2400;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed >= 1000 ? parsed : 2400;
}

/**
 * 総距離（m）から5展開それぞれの残り距離テキストを生成する
 */
export function buildPhaseDistanceLabels(
  totalMeters: number = 2400
): readonly [string, string, string, string, string] {
  if (totalMeters === 2400) {
    return ['残り 2400m', '残り 1600m', '残り 800m', '残り 400m', '残り 100m'];
  }
  const step2 = Math.max(600, Math.round((totalMeters * 0.65) / 100) * 100);
  const step3 = Math.max(400, Math.round((totalMeters * 0.35) / 100) * 100);
  const step4 = Math.min(400, Math.max(200, Math.round((totalMeters * 0.2) / 100) * 100));

  return [
    `残り ${totalMeters}m`,
    `残り ${step2}m`,
    `残り ${step3}m`,
    `残り ${step4}m`,
    '残り 100m',
  ];
}

export const RACE_PHASES: readonly RacePhase[] = [
  {
    step: 1,
    phaseName: 'スタート',
    distanceRemaining: '残り 2400m',
    commentary: '各馬綺麗に揃ったスタート！ポジション争いが始まります。',
    correctReaction: '好スタートから抜群の行き脚！好位の絶好ポジションを確保！🔥',
    incorrectReaction: 'やや立ち遅れ！後方からの追走を余儀なくされる…！💦',
  },
  {
    step: 2,
    phaseName: '向こう正面',
    distanceRemaining: '残り 1600m',
    commentary: '隊列が落ち着き向こう正面へ。ゆったりとしたペースで流れます。',
    correctReaction: '折り合いピタリ！ハミを取って理想的なリズムで追走！🔥',
    incorrectReaction: '少し力みが見られるか！？外から他馬にプレッシャーをかけられる…！💦',
  },
  {
    step: 3,
    phaseName: '第3〜4コーナー',
    distanceRemaining: '残り 800m',
    commentary: 'レースが動き出す勝負所！各騎手の手が激しく動き始めます！',
    correctReaction: '手応え抜群！持ったままの手応えで前を射程圏に捉える！🔥',
    incorrectReaction: '前の馬が壁になって進路が狭い…！外へ持ち出すロス！💦',
  },
  {
    step: 4,
    phaseName: '直線・叩き合い',
    distanceRemaining: '残り 400m',
    commentary: '最後の直線コースへ向いた！外か内か、先頭争いが激化！',
    correctReaction: '一気に加速！豪快なフットワークで先頭に躍り出る！🔥',
    incorrectReaction: '外から他馬の強烈なプレッシャー！脚色が少し鈍る…！💦',
  },
  {
    step: 5,
    phaseName: 'ゴール前・死闘',
    distanceRemaining: '残り 100m',
    commentary: '残り100m！栄冠をかけた最後の直線、渾身の叩き合い！',
    correctReaction: '内から力強く抜け出した！栄光のゴールへ一直線！🔥',
    incorrectReaction: '外の強襲に必死に食い下がる！最後まで粘れるか！？💦',
  },
];

const WEEKLY_PHASE_TEMPLATES: Record<CareerWeek, readonly Omit<RacePhase, 'distanceRemaining'>[]> = {
  1: [
    {
      step: 1,
      phaseName: '発走・初陣のゲート',
      commentary: '記念すべきデビュー戦のゲートが開いた！初陣の舞台へ飛び出します！',
      correctReaction: '初出走とは思えない落ち着き！好スタートから抜群の手応えで流れに乗る！🔥',
      incorrectReaction: '初めての実戦に少し戸惑ったか！？やや遅れて後方からの追走に…！💦',
    },
    {
      step: 2,
      phaseName: '道中・折り合い確認',
      commentary: '先団を見ながら初めての道中へ。馬の走るリズムとハミ受けを確かめます。',
      correctReaction: 'ピタリと折り合いがついた！鞍上の扶助に素直に応えてリラックスした走り！🔥',
      incorrectReaction: '周囲の馬を気にして少し行きたがる素振り…！なだめながらの追走！💦',
    },
    {
      step: 3,
      phaseName: '第3〜4コーナー',
      commentary: '勝負所のコーナーへ！馬の手応えを探りながら直線の入り口を窺います！',
      correctReaction: '手応えは依然として楽！持ったままの感触で先団の直後へ進出！🔥',
      incorrectReaction: 'ペースアップに少し置かれ気味か！？鞍上の手が早くも動き始める…！💦',
    },
    {
      step: 4,
      phaseName: '直線・初めての追い比べ',
      commentary: '最後の直線コースへ向いた！初陣を飾るべく、馬場の真ん中へ持ち出す！',
      correctReaction: '進路が開けた瞬間に鋭く反応！素質の高さを感じさせる伸び脚！🔥',
      incorrectReaction: '直線に向いて少しフラつく場面も…！懸命に体勢を立て直す！💦',
    },
    {
      step: 5,
      phaseName: 'ゴール前・初陣の結末',
      commentary: '残り100m！デビュー戦のゴール板が目前に迫る！最後まで脚色は衰えないか！？',
      correctReaction: '余力たっぷりに先頭で駆け抜けた！将来が楽しみになる鮮やかな初陣！🔥',
      incorrectReaction: '最後まで懸命に脚を伸ばしてゴールへ！実戦を経験して次走に繋がる走り！💦',
    },
  ],
  2: [
    {
      step: 1,
      phaseName: 'スタート・位置取り争い',
      commentary: '大舞台への優先出走権をかけた前哨戦がスタート！序盤の主導権争いが始まります！',
      correctReaction: '狙い通りの好発進！有力馬の動きを見極められる絶好のポジションを確保！🔥',
      incorrectReaction: '内の馬に前をカットされ、想定より一列後ろのポジションに…！💦',
    },
    {
      step: 2,
      phaseName: '向こう正面・ペース判断',
      commentary: '重賞ならではの引き締まったペース！仕掛けのタイミングを計りながら進みます。',
      correctReaction: '冷静なペース判断！脚をじっくり溜めながら勝負所へ備える！🔥',
      incorrectReaction: 'ペースの緩急に少し脚を使わされたか！？外からプレッシャーを受ける展開！💦',
    },
    {
      step: 3,
      phaseName: '勝負所・仕掛けの攻防',
      commentary: '第3〜4コーナーから各馬が一斉に仕掛け始める！進路取りと戦術が問われる局面！',
      correctReaction: '絶妙なコーナリング！ロスなく外へ持ち出し、ゴーサインと同時に一気に加速！🔥',
      incorrectReaction: '内で包まれて進路が狭い…！外へ切り替えるのに少し時間を要する！💦',
    },
    {
      step: 4,
      phaseName: '直線・重賞の壁',
      commentary: '最後の直線！重賞級の強敵たちが立ちはだかる中、渾身の追い出しを開始！',
      correctReaction: '鋭い仕掛けでライバルたちを一気に捉えた！先頭へ並びかける！🔥',
      incorrectReaction: '前を行く有力馬の脚色も衰えない！必死に差を詰めにかかる…！💦',
    },
    {
      step: 5,
      phaseName: 'ゴール前・大一番への切符',
      commentary: '残り100m！G1への切符をかけた激しい叩き合い！抜け出すのはどの馬か！？',
      correctReaction: '見事な戦術眼で競り勝った！大一番の主役へ名乗りを上げる快走！🔥',
      incorrectReaction: '重賞の厳しい洗礼を受けつつも、最後まで諦めずにゴールへ食い下がる！💦',
    },
  ],
  3: [
    {
      step: 1,
      phaseName: '発走・大観衆の咆哮',
      commentary: '満員のスタンドから地鳴りのような大歓声！国内最高峰G1のゲートが今、開かれた！',
      correctReaction: '大舞台の雰囲気にも一切動じず好スタート！絶好のポジションへ！🔥',
      incorrectReaction: '大歓声に少し高ぶったか、スタートでやや後手を踏む展開に…！💦',
    },
    {
      step: 2,
      phaseName: '向こう正面・頂上決戦',
      commentary: '国内の頂点を決める極限の緊張感！淀みない流れで向こう正面を通過します。',
      correctReaction: '抜群の集中力！鞍上の指示を待ちながら闘志を内に秘めて追走！🔥',
      incorrectReaction: '激しい先行争いの煽りを受け、少し窮屈な位置取りを強いられる…！💦',
    },
    {
      step: 3,
      phaseName: '最終コーナー・大歓声の渦',
      commentary: '勝負の第4コーナー！大観衆のボルテージが最高潮に達する中、直線へ！',
      correctReaction: '抜群の反応でコーナーを加速！手応え十分のまま先頭集団を射程圏に！🔥',
      incorrectReaction: '有力馬たちの早めに動く展開に、必死に食らいついて直線へ向く！💦',
    },
    {
      step: 4,
      phaseName: '直線・魂の追い比べ',
      commentary: '最後の直線！栄光のゴールを目指し、国内最強メンバーによる意地と意地のぶつかり合い！',
      correctReaction: '合図に応えて爆発的な末脚！ライバルをねじ伏せるように先頭へ躍り出る！🔥',
      incorrectReaction: 'ライバルたちの強烈な末脚！歯を食いしばって必死に応戦する！💦',
    },
    {
      step: 5,
      phaseName: 'ゴール前・国内頂点の栄冠',
      commentary: '残り100m！国内頂点の座をかけた極限のデッドヒート！勝負根性が試される！',
      correctReaction: '驚異の二枚腰で完全に抜け出した！大歓声に包まれながら栄光のゴールへ！🔥',
      incorrectReaction: '最後の最後まで渾身の力を振り絞り、頂点のゴール板へと飛び込む！💦',
    },
  ],
  4: RACE_PHASES.map(({ step, phaseName, commentary, correctReaction, incorrectReaction }) => ({
    step,
    phaseName,
    commentary,
    correctReaction,
    incorrectReaction,
  })),
};

/**
 * キャリア週（Week 1〜4）およびレース条件に応じた5段階の実況フェーズ配列を返す
 */
export function getRacePhasesForWeek(
  week: CareerWeek = 4,
  raceInfo?: Pick<CareerRouteRace, 'distanceText'>
): readonly RacePhase[] {
  const templates = WEEKLY_PHASE_TEMPLATES[week] ?? WEEKLY_PHASE_TEMPLATES[4];
  const totalMeters = extractDistanceMeters(raceInfo?.distanceText);
  const distanceLabels = buildPhaseDistanceLabels(totalMeters);

  return templates.map((tmpl, idx) => ({
    ...tmpl,
    distanceRemaining: distanceLabels[idx] ?? '残り 100m',
  }));
}

export type RacePlacementType = '1st' | '2nd' | 'board' | 'unplaced';

export interface RacePlacement {
  type: RacePlacementType;
  rankText: string;
  title: string;
  comment: string;
  badgeBg: string;
  textColor: string;
}

/**
 * 正解数（0〜5問）およびキャリア週（Week 1〜4）に応じた着順・タイトル・総評判定
 */
export function calculateRacePlacement(
  score: number,
  week: CareerWeek = 4
): RacePlacement {
  if (score === 5) {
    const winByWeek: Record<CareerWeek, { title: string; comment: string }> = {
      1: {
        title: 'デビュー戦快勝！華々しい初陣！',
        comment: '初陣で見事な勝利！素質の高さを証明し、次走の重賞戦線へ視界良好です！',
      },
      2: {
        title: '前哨戦制覇！大一番へ主役名乗り！',
        comment: '鮮やかな戦術で重賞の壁を突破！次週の国内G1へ向けて最高の弾みがつきました！',
      },
      3: {
        title: '国内G1制覇！世代の頂点に君臨！',
        comment: '大観衆の歓声に応える圧巻の勝負根性！国内最高峰を制し、次はいよいよ世界へ挑みます！',
      },
      4: {
        title: '海外G1制覇！歴史的勝利！',
        comment: '抜群のレース運びで世界最高峰の頂点に立ちました！完璧な仕上げの証明です。',
      },
    };
    const msg = winByWeek[week] ?? winByWeek[4];
    return {
      type: '1st',
      rankText: '1着 🥇 (優勝)',
      title: msg.title,
      comment: msg.comment,
      badgeBg: 'bg-amber-400 text-amber-950 border-amber-300',
      textColor: 'text-amber-800',
    };
  }

  if (score === 4) {
    const secondByWeek: Record<CareerWeek, { title: string; comment: string }> = {
      1: {
        title: '初陣2着！素質感じる好走！',
        comment: '勝ち馬に迫る見事なデビュー戦！実戦の感触を掴み、次走の重賞でも十分戦えます！',
      },
      2: {
        title: '重賞2着確保！優先出走権を獲得！',
        comment: '勝ち馬と接戦を演じて堂々の連対！本番の国内G1へ向けて視界は良好です！',
      },
      3: {
        title: '国内G1・2着！頂点にあと一歩！',
        comment: '国内最高峰の舞台で死闘を演じ、世代トップクラスの実力を天下に示しました！',
      },
      4: {
        title: 'アタマ差の惜敗…！',
        comment: '勝ち馬と激しい叩き合いの末、惜しくも2着。しかし世界の強豪と互角に渡り合いました！',
      },
    };
    const msg = secondByWeek[week] ?? secondByWeek[4];
    return {
      type: '2nd',
      rankText: '2着 🥈 (惜敗)',
      title: msg.title,
      comment: msg.comment,
      badgeBg: 'bg-zinc-200 text-zinc-900 border-zinc-300',
      textColor: 'text-zinc-700',
    };
  }

  if (score >= 2) {
    const rank = 6 - score; // score 3 -> 3着, score 2 -> 4着
    const boardByWeek: Record<CareerWeek, { title: string; comment: string }> = {
      1: {
        title: '初陣で掲示板確保！上々の滑り出し',
        comment: '初めての実戦でしっかり最後まで走り切りました！一度使われた上積みに期待しましょう。',
      },
      2: {
        title: '前哨戦で掲示板確保！大舞台へ前進',
        comment: '重賞の厳しい流れの中で善戦！この経験を糧に次週の大一番へ挑みましょう。',
      },
      3: {
        title: '国内G1入着！大舞台で堂々の健闘',
        comment: '国内最高峰の強豪相手に掲示板を確保！積み重ねた調教の成果が光りました。',
      },
      4: {
        title: '掲示板確保！健闘の走り',
        comment: '世界の強豪相手に堂々の入着！平日の坂路調教の積み重ねがしっかりと発揮されました。',
      },
    };
    const msg = boardByWeek[week] ?? boardByWeek[4];
    return {
      type: 'board',
      rankText: `${rank}着 🎖️ (掲示板)`,
      title: msg.title,
      comment: msg.comment,
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      textColor: 'text-emerald-800',
    };
  }

  const unplacedByWeek: Record<CareerWeek, { title: string; comment: string }> = {
    1: {
      title: 'ほろ苦いデビュー戦…次走で巻き返しへ',
      comment: '初陣は緊張もあって力を出し切れず。平日の坂路調教で基礎を固めて次走の重賞に挑みましょう！',
    },
    2: {
      title: '重賞の壁に阻まれる…本番で逆襲へ',
      comment: '前哨戦のペースに戸惑う結果となりましたが、本番のG1で巻き返すべく調教を積みましょう！',
    },
    3: {
      title: '国内G1の壁…世界挑戦でリベンジへ',
      comment: '大舞台の厳しい洗礼を受けましたが、まだキャリアは終わりません。最終週の海外遠征へ仕上げましょう！',
    },
    4: {
      title: '悔しい着外…次走へ糧に',
      comment: '世界の壁は厚かった…！平日の坂路調教でさらに英語フレーズを磨き、次走のG1でリベンジしましょう！',
    },
  };
  const msg = unplacedByWeek[week] ?? unplacedByWeek[4];
  return {
    type: 'unplaced',
    rankText: '着外 💦 (6着以下)',
    title: msg.title,
    comment: msg.comment,
    badgeBg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    textColor: 'text-zinc-600',
  };
}

/**
 * 疑似ランダムシャッフル（Fisher-Yates）
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffleOptions(options: readonly QuizOption[]): QuizOption[] {
  return shuffleArray(options as QuizOption[]);
}

/**
 * 単一の母集団（単語プールまたはフレーズプール）から優先順位に基づいて問題を選出する
 * - themeCategory が指定されている場合: 当該テーマ（履修済 → 未履修）を最優先
 * - 残りは他カテゴリ（履修済 → 未履修）から選出
 */
function selectPoolQuestions(
  poolPhrases: readonly PhraseItem[],
  learnedSet: Set<string>,
  targetCount: number,
  themeCategory?: PhraseCategory
): PhraseItem[] {
  if (poolPhrases.length === 0 || targetCount <= 0) return [];

  const pools: PhraseItem[][] = [];

  if (themeCategory) {
    const themeLearned = poolPhrases.filter(
      (p) => p.category === themeCategory && learnedSet.has(p.id)
    );
    const themeUnlearned = poolPhrases.filter(
      (p) => p.category === themeCategory && !learnedSet.has(p.id)
    );
    const otherLearned = poolPhrases.filter(
      (p) => p.category !== themeCategory && learnedSet.has(p.id)
    );
    const otherUnlearned = poolPhrases.filter(
      (p) => p.category !== themeCategory && !learnedSet.has(p.id)
    );
    pools.push(
      shuffleArray(themeLearned),
      shuffleArray(themeUnlearned),
      shuffleArray(otherLearned),
      shuffleArray(otherUnlearned)
    );
  } else {
    const learnedPool = poolPhrases.filter((p) => learnedSet.has(p.id));
    const unlearnedPool = poolPhrases.filter((p) => !learnedSet.has(p.id));
    pools.push(shuffleArray(learnedPool), shuffleArray(unlearnedPool));
  }

  const selected: PhraseItem[] = [];
  const selectedIds = new Set<string>();

  for (const pool of pools) {
    for (const item of pool) {
      if (selected.length < targetCount && !selectedIds.has(item.id)) {
        selected.push(item);
        selectedIds.add(item.id);
      }
    }
  }

  // 万一足りない場合は対象プール全体から補填
  if (selected.length < targetCount) {
    for (const item of shuffleArray([...poolPhrases])) {
      if (selected.length < targetCount && !selectedIds.has(item.id)) {
        selected.push(item);
        selectedIds.add(item.id);
      }
    }
  }

  return selected;
}

/**
 * 週末レース用の5問をハイブリッド選出する
 * - 第1〜2問: 基礎単語・競馬用語（vocabulary / 2問）
 * - 第3〜5問: 実戦フレーズ（phrase / 3問）
 * - themeCategory が指定されている場合、単語・フレーズそれぞれにおいて当該テーマカテゴリのフレーズ（履修済み → 未履修）を最優先でピックアップ
 * - 足りない分は他カテゴリの履修済み → 未履修から補充
 * - 各問題の選択肢を開くたびにシャッフル
 */
export function selectRaceQuestions(
  allPhrases: PhraseItem[],
  learnedPhraseIds: string[] = [],
  themeCategory?: PhraseCategory
): PhraseItem[] {
  if (allPhrases.length === 0) return [];

  const learnedSet = new Set(learnedPhraseIds);

  const vocabPool = allPhrases.filter((p) => p.type === 'vocabulary');
  const phrasePool = allPhrases.filter((p) => p.type !== 'vocabulary');

  // 単語・フレーズの双方が存在する場合（通常のハイブリッド出題）
  if (vocabPool.length > 0 && phrasePool.length > 0) {
    const vocabSelected = selectPoolQuestions(
      vocabPool,
      learnedSet,
      RACE_VOCABULARY_COUNT,
      themeCategory
    );
    const phraseSelected = selectPoolQuestions(
      phrasePool,
      learnedSet,
      RACE_PHRASE_COUNT,
      themeCategory
    );

    const combined = [...vocabSelected, ...phraseSelected];

    // 全体で5問に満たない場合（極小データセット等）のフォールバック
    if (combined.length < RACE_QUESTION_COUNT) {
      const combinedIds = new Set(combined.map((q) => q.id));
      for (const item of shuffleArray(allPhrases)) {
        if (combined.length < RACE_QUESTION_COUNT && !combinedIds.has(item.id)) {
          combined.push(item);
          combinedIds.add(item.id);
        }
      }
    }

    return combined.slice(0, RACE_QUESTION_COUNT).map((item) => ({
      ...item,
      options: shuffleOptions(item.options),
    }));
  }

  // どちらか一方のプールしか存在しない場合の安全フォールバック（旧データ等）
  const fallbackSelected = selectPoolQuestions(
    allPhrases,
    learnedSet,
    RACE_QUESTION_COUNT,
    themeCategory
  );

  return fallbackSelected.map((item) => ({
    ...item,
    options: shuffleOptions(item.options),
  }));
}

