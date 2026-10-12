export type PhraseCategory = 'feel' | 'tactics' | 'reaction' | 'comment';
export type PhraseLevel = 'beginner' | 'intermediate';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface PhraseItem {
  id: string;
  situation: string;
  phrase: string;
  literalTranslation?: string;
  options: QuizOption[];
  explanation: string;
  category: PhraseCategory;
  level: PhraseLevel;
}

export const INITIAL_PHRASES: PhraseItem[] = [
  // ==========================================
  // カテゴリ 1: 手応え・感触 (feel) - 8問
  // ==========================================
  {
    id: 'phrase-001',
    situation: 'G1勝利騎手インタビュー（直線に入る前の手応えを聞かれて）',
    phrase: 'He had plenty in the tank coming into the straight.',
    literalTranslation: '直線に入った時点でタンクに十分な余力があった',
    options: [
      { id: 'opt-1', text: '直線に入っても手応えは抜群で、余力たっぷりだった', isCorrect: true },
      { id: 'opt-2', text: '直線に向いたところで、すでに脚を使ってしまっていた', isCorrect: false },
      { id: 'opt-3', text: '直線で外から寄られて、進路が狭くなってしまった', isCorrect: false },
      { id: 'opt-4', text: '直線に入って急に馬が物見をして、ブレーキをかけた', isCorrect: false },
    ],
    explanation: '「tank（燃料タンク）」に「plenty（たっぷり）」ある＝まだまだ余力十分で持ったまま直線に入ったという意味の定番フレーズです。',
    category: 'feel',
    level: 'beginner',
  },
  {
    id: 'phrase-002',
    situation: '逃げ・先行馬の道中のリズムについて',
    phrase: 'He was travelling very sweetly on the bridle.',
    literalTranslation: 'ハミの上でとても気持ちよく走っていた',
    options: [
      { id: 'opt-1', text: 'ハミを噛んで暴走し、コントロールを失っていた', isCorrect: false },
      { id: 'opt-2', text: 'ハミ受けが良く、抜群の手応えで気分良く運べていた', isCorrect: true },
      { id: 'opt-3', text: 'ハミを取らずに進みが悪く、終始気合をつけていた', isCorrect: false },
      { id: 'opt-4', text: '手綱を引っ張りすぎて、走るリズムを崩してしまった', isCorrect: false },
    ],
    explanation: '「on the bridle」は「馬がハミをしっかり取って手応えが良い」状態。これに「sweetly」が付くと『文句なしの絶好の手応え』を意味します。',
    category: 'feel',
    level: 'intermediate',
  },
  {
    id: 'phrase-003',
    situation: '中団待機策をとった馬の道中の様子',
    phrase: 'He was full of running round the home turn.',
    literalTranslation: '最終コーナーを回る時、走る力に満ちていた',
    options: [
      { id: 'opt-1', text: '最終コーナーで手応えが尽きて、一杯になっていた', isCorrect: false },
      { id: 'opt-2', text: '最終コーナーで大きく外へ振られてロスがあった', isCorrect: false },
      { id: 'opt-3', text: '最終コーナーでどこからでも突き抜けるほど余力十分だった', isCorrect: true },
      { id: 'opt-4', text: '最終コーナーを回るのが下手で、モタついていた', isCorrect: false },
    ],
    explanation: '「full of running」は「余力や行きっぷりが満ち溢れている」状態。馬なりでいつでも抜け出せる抜群の手応えを表します。',
    category: 'feel',
    level: 'beginner',
  },
  {
    id: 'phrase-004',
    situation: '勝負どころ（3〜4コーナー）で苦しくなった馬について',
    phrase: 'He was off the bridle turning for home.',
    literalTranslation: '直線に向くところでハミから外れていた',
    options: [
      { id: 'opt-1', text: '直線に向くところでハミが外れて落馬しそうになった', isCorrect: false },
      { id: 'opt-2', text: '直線に向くところで手応えが怪しくなり、激しく手が動いていた', isCorrect: true },
      { id: 'opt-3', text: '直線に向くところで引っかかり、騎手が必死に抑えていた', isCorrect: false },
      { id: 'opt-4', text: '直線に向くところで進路が開かず、追い出しを待っていた', isCorrect: false },
    ],
    explanation: '「on the bridle（持ったまま）」の対義語。ハミ受けの手応えがなくなり、騎手が手を激しく動かして気合を入れざるを得ない苦しい状態です。',
    category: 'feel',
    level: 'intermediate',
  },
  {
    id: 'phrase-005',
    situation: '楽な手応えで外から前を飲み込みにいく瞬間',
    phrase: 'He was just cruising three wide.',
    literalTranslation: '外3頭目をただクルージングしていた',
    options: [
      { id: 'opt-1', text: '外3頭目を馬なりで持ったまま、楽な手応えで進出していた', isCorrect: true },
      { id: 'opt-2', text: '外3頭目を回らされてスタミナを大きく消耗していた', isCorrect: false },
      { id: 'opt-3', text: '外3頭目でスピードに乗り切れず、置いていかれていた', isCorrect: false },
      { id: 'opt-4', text: '外3頭目の他馬に何度もぶつけられて怯んでいた', isCorrect: false },
    ],
    explanation: '「cruising」はドライブやクルーズ船のように「楽々と・余裕綽々で」走っている様子。追い出す前の絶好の手応えを表します。',
    category: 'feel',
    level: 'beginner',
  },
  {
    id: 'phrase-006',
    situation: '先行して直線で失速した馬の敗戦コメント',
    phrase: 'He was completely empty at the furlong pole.',
    literalTranslation: '残り1ハロン標識で完全に空っぽだった',
    options: [
      { id: 'opt-1', text: '残り1ハロン標識で周囲に他馬がいなくなり、一頭になった', isCorrect: false },
      { id: 'opt-2', text: '残り1ハロン標識のところで、完全に余力がなくなりガス欠だった', isCorrect: true },
      { id: 'opt-3', text: '残り1ハロン標識で進路がクリアになり、前が開いた', isCorrect: false },
      { id: 'opt-4', text: '残り1ハロン標識でペースを落として息を入れようとした', isCorrect: false },
    ],
    explanation: '「empty」は燃料タンクが空＝スタミナ切れで「脚が完全に上がってしまった」状態を意味します。',
    category: 'feel',
    level: 'beginner',
  },
  {
    id: 'phrase-007',
    situation: '道中で引っかかってスタミナをロスした馬について',
    phrase: 'He was very keen and pulling hard in the early stages.',
    literalTranslation: '序盤にとても熱狂的で激しく引っ張っていた',
    options: [
      { id: 'opt-1', text: '序盤から抜群の手応えで、いつでも動ける状態だった', isCorrect: false },
      { id: 'opt-2', text: '序盤から行き脚がつかず、後方に置かれてしまっていた', isCorrect: false },
      { id: 'opt-3', text: '序盤に行きたがって口を割り、激しく折り合いを欠いていた', isCorrect: true },
      { id: 'opt-4', text: '序盤に前の馬が急ブレーキをかけ、手綱を引く不利があった', isCorrect: false },
    ],
    explanation: '「keen」や「pull hard」は競馬英語で「折り合いを欠く・引っかかる・ハミを噛む」こと。騎手と喧嘩してスタミナを消費する場面でよく使われます。',
    category: 'feel',
    level: 'intermediate',
  },
  {
    id: 'phrase-008',
    situation: '差し馬が好位の直後で理想的なリズムで追走したとき',
    phrase: 'He dropped the bridle nicely and relaxed.',
    literalTranslation: '上手にハミを落としてリラックスした',
    options: [
      { id: 'opt-1', text: 'ハミを抜いて上手にリラックスし、ピタッと折り合えた', isCorrect: true },
      { id: 'opt-2', text: 'ハミが外れてコントロールが利かなくなり、焦った', isCorrect: false },
      { id: 'opt-3', text: '手綱を緩めたら急に失速して後ろに下がってしまった', isCorrect: false },
      { id: 'opt-4', text: 'ハミを嫌がって頭を上げ、リズムを大きく崩した', isCorrect: false },
    ],
    explanation: '「drop the bridle」は「無駄な力みが抜け、ハミから力を抜いてリラックスする（＝完璧に折り合う）」という好意的な表現です。',
    category: 'feel',
    level: 'intermediate',
  },

  // ==========================================
  // カテゴリ 2: 仕掛け・展開 (tactics) - 8問
  // ==========================================
  {
    id: 'phrase-009',
    situation: '直線で満を持してスパートをかけた瞬間',
    phrase: 'I pushed the button at the two-furlong pole.',
    literalTranslation: '残り2ハロン標識でボタンを押した',
    options: [
      { id: 'opt-1', text: '残り2ハロン標識のところで、馬が急加速して暴走した', isCorrect: false },
      { id: 'opt-2', text: '残り2ハロン標識のところで合図を出し、ゴーサインを出した', isCorrect: true },
      { id: 'opt-3', text: '残り2ハロン標識で鐙（あぶみ）が外れそうになって焦った', isCorrect: false },
      { id: 'opt-4', text: '残り2ハロン標識のところで、早々と手応えがなくなってしまった', isCorrect: false },
    ],
    explanation: '「push the button（ボタンを押す）」は競馬で「ゴーサインを出す／点火する」という比喩表現。手応えがある状態で満を持して仕掛ける合図です。',
    category: 'tactics',
    level: 'beginner',
  },
  {
    id: 'phrase-010',
    situation: '単騎逃げの作戦をとった騎手のレース後コメント',
    phrase: 'The plan was always to set our own pace.',
    literalTranslation: '計画は常に自分たちのペースを作ることだった',
    options: [
      { id: 'opt-1', text: 'ハナを切って逃げ、自分のペースでレースを運ぶのが作戦だった', isCorrect: true },
      { id: 'opt-2', text: '前がハイペースになるのを見越して、後方待機するのが作戦だった', isCorrect: false },
      { id: 'opt-3', text: '他馬のペースに合わせて、好位の内側を追走する作戦だった', isCorrect: false },
      { id: 'opt-4', text: 'スタート直後に無理せず、中団からまくる作戦だった', isCorrect: false },
    ],
    explanation: '「set the pace」は「先頭に立ってペースを作る（逃げる）」こと。レースの主導権を握る戦術を指します。',
    category: 'tactics',
    level: 'beginner',
  },
  {
    id: 'phrase-011',
    situation: '直線入り口で後続を引き離しにかかる合図',
    phrase: 'He kicked on nicely when we turned into the straight.',
    literalTranslation: '直線に向いた時、上手に蹴り進めた',
    options: [
      { id: 'opt-1', text: '直線に向いたところで、他馬を蹴飛ばそうとして危なかった', isCorrect: false },
      { id: 'opt-2', text: '直線に向いたところで、後続を突き放す素晴らしい再加速を見せた', isCorrect: true },
      { id: 'opt-3', text: '直線に向いたところで、急に手前を変えてバランスを崩した', isCorrect: false },
      { id: 'opt-4', text: '直線に向いたところで、手応えが鈍くなり置かれてしまった', isCorrect: false },
    ],
    explanation: '「kick on」は先頭・好位の馬が「もう一段ギアを上げて突き放しにかかる・再加速する」という意味の頻出動詞です。',
    category: 'tactics',
    level: 'intermediate',
  },
  {
    id: 'phrase-012',
    situation: '直線の勝負どころで進路を失った敗戦コメント',
    phrase: 'We got completely boxed in with nowhere to go.',
    literalTranslation: '完全に箱に詰められ、行く場所がどこにもなかった',
    options: [
      { id: 'opt-1', text: 'ゲートの枠順（ボックス）が悪すぎて、スタートから不利だった', isCorrect: false },
      { id: 'opt-2', text: '前も横も他馬に塞がれて完全に前が壁になり、進路がなかった', isCorrect: true },
      { id: 'opt-3', text: '馬群の外を回されすぎて、距離ロスが大きすぎた', isCorrect: false },
      { id: 'opt-4', text: '直線で隣の馬と接触し、馬が走る気を失ってしまった', isCorrect: false },
    ],
    explanation: '「boxed in」や「pocketed」は「前と横を他馬に包まれて完全にポケット（壁）に入り、追えない」状態のことです。',
    category: 'tactics',
    level: 'beginner',
  },
  {
    id: 'phrase-013',
    situation: '好位追走からの抜け出しを図った騎手のプラン',
    phrase: 'I wanted to track the leader in a handy position.',
    literalTranslation: '手頃なポジションで先頭馬を追跡したかった',
    options: [
      { id: 'opt-1', text: '逃げ馬の後ろの絶好の好位（2〜3番手）でレースを進めたかった', isCorrect: true },
      { id: 'opt-2', text: '後方集団のインコースでじっくり脚を溜めたかった', isCorrect: false },
      { id: 'opt-3', text: 'いつでも先頭を奪えるよう、競りかけてペースを上げたかった', isCorrect: false },
      { id: 'opt-4', text: '他馬の動きを警戒して、外目を回して安全に運びたかった', isCorrect: false },
    ],
    explanation: '「handy position」は「先頭集団を射程圏に入れる絶好の好位（好ポジション）」を意味します。',
    category: 'tactics',
    level: 'beginner',
  },
  {
    id: 'phrase-014',
    situation: 'ハナを切って逃げ切った馬の実況・短評',
    phrase: 'He made all and was never challenged.',
    literalTranslation: '彼はすべてを作り、決して挑まれなかった',
    options: [
      { id: 'opt-1', text: '終始後方にいたが、直線だけで全馬をごぼう抜きにした', isCorrect: false },
      { id: 'opt-2', text: 'スタートから先頭を一度も譲らず、危なげなく逃げ切った', isCorrect: true },
      { id: 'opt-3', text: 'ハイペースに巻き込まれ、直線で力尽きてしまった', isCorrect: false },
      { id: 'opt-4', text: '道中で何度も他馬に並びかけられたが、写真判定で凌いだ', isCorrect: false },
    ],
    explanation: '「made all」は「最初から最後まで先頭（ハナ）を譲らずに勝った（＝鮮やかな逃げ切り勝ち）」を表す定番フレーズです。',
    category: 'tactics',
    level: 'intermediate',
  },
  {
    id: 'phrase-015',
    situation: '追い込み馬の騎手が後方で仕掛けを待つ心境',
    phrase: 'I was happy to sit chilly and wait for the gaps.',
    literalTranslation: '寒く座って隙間を待つことに満足していた',
    options: [
      { id: 'opt-1', text: '寒さで体が動かず、追い出すタイミングが遅れてしまった', isCorrect: false },
      { id: 'opt-2', text: '前が詰まるのを恐れて、大外ぶん回しの競馬を選んだ', isCorrect: false },
      { id: 'opt-3', text: '慌てずじっくりと仕掛けを我慢し、前が開くのを待てた', isCorrect: true },
      { id: 'opt-4', text: 'スタートで行き脚がつかず、やむを得ず最後方に下げた', isCorrect: false },
    ],
    explanation: '「sit chilly」は「微動だにせずじっと我慢する・動かない」こと。手綱を持ったまま後方で死んだふりをして脚を溜める騎乗を褒める表現です。',
    category: 'tactics',
    level: 'intermediate',
  },
  {
    id: 'phrase-016',
    situation: '早仕掛けになってしまったことの反省コメント',
    phrase: 'I committed too early and was caught near the line.',
    literalTranslation: '早すぎる関与をしてしまい、ゴールの近くで捕まった',
    options: [
      { id: 'opt-1', text: '早仕掛けになってしまい、ゴール直前で差されてしまった', isCorrect: true },
      { id: 'opt-2', text: '仕掛けが遅れすぎて、前を捉えきれずに届かなかった', isCorrect: false },
      { id: 'opt-3', text: 'コーナーで膨れてしまい、ゴール前で急ブレーキをかけた', isCorrect: false },
      { id: 'opt-4', text: 'スタートで先頭に立ってしまい、すぐにバテて下がった', isCorrect: false },
    ],
    explanation: '「commit（身を委ねる・決断する）」は競馬では「スパートをかける・仕掛ける」という意味。仕掛けが早すぎて最後に甘くなった反省で使われます。',
    category: 'tactics',
    level: 'intermediate',
  },

  // ==========================================
  // カテゴリ 3: 勝負根性・馬の反応 (reaction) - 7問
  // ==========================================
  {
    id: 'phrase-017',
    situation: '直線での激しい追い比べ・接戦を制した後のコメント',
    phrase: 'When they challenged us, he dug deep.',
    literalTranslation: '他馬が挑みかかってきた時、深く掘り下げた',
    options: [
      { id: 'opt-1', text: '他馬に並びかけられた時、驚いて怯んでしまった', isCorrect: false },
      { id: 'opt-2', text: '他馬に並びかけられた時、根性を発揮してもうひと伸びしてくれた', isCorrect: true },
      { id: 'opt-3', text: '他馬に並びかけられた時、騎手の合図に全く反応しなかった', isCorrect: false },
      { id: 'opt-4', text: '他馬に並びかけられた時、馬場の悪い内側へモタれてしまった', isCorrect: false },
    ],
    explanation: '「dig deep（深く掘る）」は「底力を絞り出す・勝負根性を見せる」の意味。激しい叩き合いで競り勝った際によく使われます。',
    category: 'reaction',
    level: 'intermediate',
  },
  {
    id: 'phrase-018',
    situation: '直線で追い出してからの馬の鋭い反応について',
    phrase: 'Every time I asked him, he found more.',
    literalTranslation: '彼に求めるたびに、彼はもっと見つけた',
    options: [
      { id: 'opt-1', text: '気合をつけるたびに、さらに一段上のギアに入って伸びてくれた', isCorrect: true },
      { id: 'opt-2', text: '鞭を入れるたびに、嫌がって外へ逃げようとしていた', isCorrect: false },
      { id: 'opt-3', text: '合図を出すたびに、スタミナを消費して脚色が鈍くなっていった', isCorrect: false },
      { id: 'opt-4', text: '追い出そうとしたが、他馬の影を気にして物見をしていた', isCorrect: false },
    ],
    explanation: '「ask him」は「騎手が合図を出す・追い出す」、「find more」は「さらに脚を使う・もうひと伸びする」ことを指す名フレーズです。',
    category: 'reaction',
    level: 'beginner',
  },
  {
    id: 'phrase-019',
    situation: '圧倒的な瞬発力で一瞬にして突き放した勝ち馬のレース後評',
    phrase: 'He put the race to bed in a matter of strides.',
    literalTranslation: 'ほんの数完歩でレースをベッドに寝かせた',
    options: [
      { id: 'opt-1', text: 'ほんの数完歩走ったところで、レースを諦めて走るのをやめた', isCorrect: false },
      { id: 'opt-2', text: 'わずか数完歩の爆発的な加速で、一瞬にして勝負を決めてしまった', isCorrect: true },
      { id: 'opt-3', text: '数完歩ごとに躓いて、馬が走るバランスを大きく崩していた', isCorrect: false },
      { id: 'opt-4', text: 'ゴール前の数完歩で脚が止まり、辛うじてハナ差で逃げ切った', isCorrect: false },
    ],
    explanation: '「put the race to bed（レースを寝かしつける）」は「勝負を完全に終わらせる・決着をつける」という非常に有名な英語慣用句です。',
    category: 'reaction',
    level: 'intermediate',
  },
  {
    id: 'phrase-020',
    situation: '若馬や従順な馬の初重賞制覇について',
    phrase: 'He responded generously to the whip.',
    literalTranslation: '鞭に対して寛大に応えた',
    options: [
      { id: 'opt-1', text: '鞭を入れられて驚き、過剰に反応して斜行した', isCorrect: false },
      { id: 'opt-2', text: '鞭に素直に、そして期待以上によく応えて力強く伸びてくれた', isCorrect: true },
      { id: 'opt-3', text: '鞭を何度も使ったが、最後まで無反応だった', isCorrect: false },
      { id: 'opt-4', text: '鞭を嫌がってハミを取らなくなってしまった', isCorrect: false },
    ],
    explanation: '「respond generously」は「（馬が）素直に、惜しみなく持てる力をすべて出し切って応える」という素晴らしい称賛表現です。',
    category: 'reaction',
    level: 'intermediate',
  },
  {
    id: 'phrase-021',
    situation: '苦しくなった馬の直線での癖・斜行について',
    phrase: 'He hung badly left under pressure in the closing stages.',
    literalTranslation: '終盤のプレッシャー下でひどく左にぶら下がった',
    options: [
      { id: 'opt-1', text: '直線で追い比べになった際、苦しくなってひどく左にモタれた（ササった）', isCorrect: true },
      { id: 'opt-2', text: '直線で隣の馬から激しいタックルを受けて、左へ弾き飛ばされた', isCorrect: false },
      { id: 'opt-3', text: '直線で左側から勢いよく他馬が強襲してきて、圧倒された', isCorrect: false },
      { id: 'opt-4', text: 'ゴール直前で急に左前脚を痛めてしまい、失速した', isCorrect: false },
    ],
    explanation: '「hung（hangの過去形）」は競馬で「モタれる／ササる（まっすぐ走れず左右どちらかに寄れる）」こと。疲労による悪癖を表します。',
    category: 'reaction',
    level: 'beginner',
  },
  {
    id: 'phrase-022',
    situation: '先頭に立ってフワッとして差された馬について',
    phrase: 'He hit the front too soon and pricked his ears.',
    literalTranslation: 'あまりに早く先頭を打ち、耳を立てた',
    options: [
      { id: 'opt-1', text: '先頭に立つのが早すぎて、物見をしてソラを使ってフワッとした', isCorrect: true },
      { id: 'opt-2', text: '先頭に立った瞬間に気合が入り、後続を一気に突き放した', isCorrect: false },
      { id: 'opt-3', text: '先頭争いが激しすぎて、興奮してコントロールを失った', isCorrect: false },
      { id: 'opt-4', text: '先頭に立ったところで急に耳を痛がり、減速してしまった', isCorrect: false },
    ],
    explanation: '「prick ears（耳をピンと立てる）」は競馬で「ソラを使う・遊ぶ・物見する」こと。誰も前にいなくなって気を抜いてしまった状態です。',
    category: 'reaction',
    level: 'intermediate',
  },
  {
    id: 'phrase-023',
    situation: '人気馬が直線で追われて全く伸びなかったとき',
    phrase: 'I went for him, but he found nothing.',
    literalTranslation: '彼のために行ったが、彼は何も見つけなかった',
    options: [
      { id: 'opt-1', text: '前が開くのを待っていたが、最後まで隙間が見つからなかった', isCorrect: false },
      { id: 'opt-2', text: '合図を出して追い出したが、全く反応がなく伸びなかった', isCorrect: true },
      { id: 'opt-3', text: '馬群を捌こうとしたが、進路を完全に塞がれてしまった', isCorrect: false },
      { id: 'opt-4', text: '馬はやる気満々だったが、騎手の判断ミスで脚を余した', isCorrect: false },
    ],
    explanation: '「go for him」は「スパートをかける・本気で追う」、「found nothing」は「何の反応・余力もない」こと。見せ場なく敗れた際の常套句です。',
    category: 'reaction',
    level: 'beginner',
  },

  // ==========================================
  // カテゴリ 4: コメント・総括 (comment) - 7問
  // ==========================================
  {
    id: 'phrase-024',
    situation: '敗戦後、重馬場やタフな芝が合わなかった馬の振り返り',
    phrase: 'He just didn’t handle the ground today.',
    literalTranslation: '彼は今日、地面をうまく扱えなかっただけだ',
    options: [
      { id: 'opt-1', text: '今日は単純に馬場（芝のコンディション）が合わなかった', isCorrect: true },
      { id: 'opt-2', text: 'パドックでテンションが上がりすぎて落ち着きを欠いていた', isCorrect: false },
      { id: 'opt-3', text: 'スタートで立ち遅れて、自分の競馬ができなかった', isCorrect: false },
      { id: 'opt-4', text: '距離が長すぎて、最後の直線でスタミナ切れしてしまった', isCorrect: false },
    ],
    explanation: '「ground」は競馬では「馬場状態（良馬場・重馬場など）」のこと。「handle the ground」で「その馬場をこなす」という意味になります。',
    category: 'comment',
    level: 'beginner',
  },
  {
    id: 'phrase-025',
    situation: '大差勝ちを収めた歴史的名馬に対する調教師の絶賛',
    phrase: 'He is an absolute freak, unlike any horse I’ve trained.',
    literalTranslation: '彼は私が調教してきたどんな馬とも違う、完全な化け物だ',
    options: [
      { id: 'opt-1', text: '気性が荒すぎて、これまで育てた馬の中でも一番手がかかる馬だ', isCorrect: false },
      { id: 'opt-2', text: '普通の馬の常識を超えた、文字通りの怪物・規格外の名馬だ', isCorrect: true },
      { id: 'opt-3', text: '走るフォームが独特で、他馬と比べても非常に不格好な馬だ', isCorrect: false },
      { id: 'opt-4', text: '体質が非常に弱く、毎回奇跡的にレースに出走できている馬だ', isCorrect: false },
    ],
    explanation: '「freak」は競馬界では「規格外の怪物・天才的な名馬（イクイノックスやフランケル級）」を称える最上級の賛辞です。',
    category: 'comment',
    level: 'intermediate',
  },
  {
    id: 'phrase-026',
    situation: '相手馬の圧倒的な強さに完敗した騎手のコメント',
    phrase: 'We were simply blown away by a superior horse.',
    literalTranslation: '私たちはより優れた馬によって単純に吹き飛ばされた',
    options: [
      { id: 'opt-1', text: '直線で強い向かい風を受けて、スピードが落ちてしまった', isCorrect: false },
      { id: 'opt-2', text: '相手が一枚も二枚も上手で、手も足も出ず完敗だった', isCorrect: true },
      { id: 'opt-3', text: '勝った馬に進路を塞がれて弾き飛ばされ、不完全燃焼だった', isCorrect: false },
      { id: 'opt-4', text: '勝ち馬のプレッシャーに怯んで、自分の競馬ができなかった', isCorrect: false },
    ],
    explanation: '「blown away」は「（圧倒的な力差に）吹き飛ばされた／完膚なきまでに負けた」という脱帽の念を表すコメントです。',
    category: 'comment',
    level: 'beginner',
  },
  {
    id: 'phrase-027',
    situation: '長期休養明けで4着に敗れた後の陣営コメント',
    phrase: 'He just needed the run, he will come on a lot for this.',
    literalTranslation: '彼は単に走りを必要としていた、これによって大いに来るだろう',
    options: [
      { id: 'opt-1', text: '休み明けでひと叩きが必要だっただけで、次はガラリと良くなる', isCorrect: true },
      { id: 'opt-2', text: '道中の走りに集中力を欠いていたので、次は馬具を工夫する', isCorrect: false },
      { id: 'opt-3', text: '距離が足りなかったので、次はもっと長い距離に使いたい', isCorrect: false },
      { id: 'opt-4', text: '年齢による衰えが見られるので、次走は慎重に判断したい', isCorrect: false },
    ],
    explanation: '「needed the run」は「叩きが必要だった（太め残りだった）」、「come on」は「（使われて）上積みがある・状態が良くなる」という意味の頻出句です。',
    category: 'comment',
    level: 'intermediate',
  },
  {
    id: 'phrase-028',
    situation: '距離延長の不安を囁かれていた馬が見事に勝ったとき',
    phrase: 'He stayed every yard of the trip.',
    literalTranslation: '彼はその旅のすべてのヤードを持ち堪えた',
    options: [
      { id: 'opt-1', text: '距離が長すぎて、最後の数ヤードでスタミナが尽きてしまった', isCorrect: false },
      { id: 'opt-2', text: '長距離輸送（旅）の疲れを全く見せず、元気に走りきった', isCorrect: false },
      { id: 'opt-3', text: '距離延長の不安を一蹴し、最後まで完全に距離を持ち保った', isCorrect: true },
      { id: 'opt-4', text: '道中で他馬からプレッシャーを受け続けながらも我慢した', isCorrect: false },
    ],
    explanation: '「trip」は「レースの距離」、「stay every yard」は「最後の1ヤードまで完全にスタミナが持った（距離を克服した）」という意味です。',
    category: 'comment',
    level: 'intermediate',
  },
  {
    id: 'phrase-029',
    situation: '直線で致命的な不利を受けて人気を裏切った騎手の弁明',
    phrase: 'She was very unlucky in running and never got a clear shot.',
    literalTranslation: '彼女は走りにおいて非常に不運で、クリアな射撃を一度も得られなかった',
    options: [
      { id: 'opt-1', text: '直線で不利を受けたり前が壁になったりで、全く力を出し切れなかった', isCorrect: true },
      { id: 'opt-2', text: 'スタートで立ち遅れた上に、終始大外を回されて運が悪かった', isCorrect: false },
      { id: 'opt-3', text: 'パドックからゲートまでの歩様が悪く、本来の調子ではなかった', isCorrect: false },
      { id: 'opt-4', text: '直線で他馬の鞭が顔に当たってしまい、怯んで走る気をなくした', isCorrect: false },
    ],
    explanation: '「unlucky in running」は「道中や直線で前が詰まる等の不利を受けて不完全燃焼だった（スムーズなら勝っていた）」という定番の弁明です。',
    category: 'comment',
    level: 'intermediate',
  },
  {
    id: 'phrase-030',
    situation: '前走惨敗から見事に巻き返して勝利したとき',
    phrase: 'She proved all the doubters wrong and bounced back brilliantly.',
    literalTranslation: '彼女はすべての疑い深き人々が間違っていると証明し、見事に跳ね返った',
    options: [
      { id: 'opt-1', text: '他馬に何度もぶつかられたが、弾き返して力強く伸びた', isCorrect: false },
      { id: 'opt-2', text: '前走の敗戦で疑っていた周囲を見返し、見事な復活・巻き返しを果たした', isCorrect: true },
      { id: 'opt-3', text: 'パドックでの落ち着きのなさが嘘のように、返し馬で見違えた', isCorrect: false },
      { id: 'opt-4', text: '作戦が完全に裏目に出たが、馬の底力だけでカバーした', isCorrect: false },
    ],
    explanation: '「bounce back」は「（大敗や不調から）見事に立ち直る・巻き返す」こと。復活勝利を称える際の感動的な定番フレーズです。',
    category: 'comment',
    level: 'beginner',
  },
];
