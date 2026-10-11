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
    id: 'phrase-003',
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
    id: 'phrase-004',
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
    id: 'phrase-005',
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
];
