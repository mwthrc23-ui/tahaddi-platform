// ─── Game session state machine ──────────────────────────────────────────────

export type GamePhase =
  | 'lobby'
  | 'starting'
  | 'question_intro'
  | 'question_live'
  | 'question_reveal'
  | 'interim_leaderboard'
  | 'final_results'
  | 'ended';

export type PlayerInfo = {
  id: string;
  name: string;
  score: number;
  streak: number;
  rank: number;
};

export type QuestionPayload = {
  questionId: string;
  index: number;
  total: number;
  prompt: string;
  imageUrl: string | null;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options: { id: string; text: string }[];
  timeLimit: number;
  basePoints: number;
  startsAt: number;
};

export type RevealPayload = {
  questionId: string;
  correctOptionId: string;
  explanation: string | null;
  leaderboard: PlayerInfo[];
};

// ─── Socket.IO event contracts ────────────────────────────────────────────────

export type ClientToServerEvents = {
  'room:join': (payload: { pin: string; playerName: string }) => void;
  'room:start': (payload: { pin: string }) => void;
  'answer:submit': (payload: {
    pin: string;
    questionId: string;
    optionId: string;
    clientTs: number;
  }) => void;
  'question:next': (payload: { pin: string }) => void;
};

export type ServerToClientEvents = {
  'room:state': (payload: {
    pin: string;
    phase: GamePhase;
    players: PlayerInfo[];
    hostId: string;
  }) => void;
  'room:player_joined': (payload: { player: PlayerInfo }) => void;
  'room:player_left': (payload: { playerId: string }) => void;
  'room:starting': (payload: { countdownSeconds: number }) => void;
  'question:intro': (
    payload: Pick<
      QuestionPayload,
      'index' | 'total' | 'category' | 'difficulty' | 'basePoints' | 'timeLimit'
    >,
  ) => void;
  'question:show': (payload: QuestionPayload) => void;
  'answer:ack': (payload: {
    questionId: string;
    earned: number;
    correct: boolean;
    streak: number;
  }) => void;
  'question:reveal': (payload: RevealPayload) => void;
  'game:leaderboard': (payload: { leaderboard: PlayerInfo[] }) => void;
  'game:end': (payload: { leaderboard: PlayerInfo[]; gameId: string }) => void;
  'game:error': (payload: { code: string; message: string }) => void;
};

// ─── Internal game state types ────────────────────────────────────────────────

export type GameQuestion = {
  id: string;
  prompt: string;
  imageUrl?: string | null;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  timeLimit: number;
  basePoints: number;
  explanation: string | null;
  options: { id: string; text: string; isCorrect: boolean }[];
};

export type PlayerState = {
  id: string;
  name: string;
  score: number;
  streak: number;
  rank: number;
  answeredCurrentQuestion: boolean;
};

export type GameSession = {
  pin: string;
  hostId: string;
  phase: GamePhase;
  questionIds: string[];
  currentIndex: number;
  currentQuestionId: string | null;
  questionStartedAt: number | null;
  gameId: string;
};
