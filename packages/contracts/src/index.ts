// ─── REST API response envelopes ────────────────────────────────────────────

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    requestId: string;
  };
};

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
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options: { id: string; text: string }[];
  timeLimit: number;
  basePoints: number;
  startsAt: number; // Unix ms — authoritative server timestamp
};

export type RevealPayload = {
  questionId: string;
  correctOptionId: string;
  explanation: string | null;
  leaderboard: PlayerInfo[];
};

// ─── Socket.IO event contracts ────────────────────────────────────────────────
// Naming: <namespace>:<action>
// Client → Server events (emitted by browser, handled by gateway)

export type ClientToServerEvents = {
  /** Join an existing game room using a 6-digit PIN */
  'room:join': (payload: { pin: string; playerName: string }) => void;
  /** Host starts the game */
  'room:start': (payload: { pin: string }) => void;
  /** Player submits an answer */
  'answer:submit': (payload: {
    pin: string;
    questionId: string;
    optionId: string;
    /** Client timestamp in Unix ms — used for RTT diagnostics only, not for scoring */
    clientTs: number;
  }) => void;
  /** Host advances to the next question */
  'question:next': (payload: { pin: string }) => void;
};

// Server → Client events (emitted by gateway, handled by browser)

export type ServerToClientEvents = {
  /** Acknowledged after room:join — carries initial room snapshot */
  'room:state': (payload: {
    pin: string;
    phase: GamePhase;
    players: PlayerInfo[];
    hostId: string;
  }) => void;
  /** A new player joined the lobby */
  'room:player_joined': (payload: { player: PlayerInfo }) => void;
  /** A player left or disconnected */
  'room:player_left': (payload: { playerId: string }) => void;
  /** Countdown before first question */
  'room:starting': (payload: { countdownSeconds: number }) => void;
  /** Question intro phase — show category/difficulty, no options yet */
  'question:intro': (payload: Pick<QuestionPayload, 'index' | 'total' | 'category' | 'difficulty' | 'basePoints' | 'timeLimit'>) => void;
  /** Question live — show full question + options + server timer reference */
  'question:show': (payload: QuestionPayload) => void;
  /** Answer acknowledged for the submitting player */
  'answer:ack': (payload: { questionId: string; earned: number; correct: boolean; streak: number }) => void;
  /** Reveal correct answer + leaderboard snapshot */
  'question:reveal': (payload: RevealPayload) => void;
  /** Interim leaderboard between questions */
  'game:leaderboard': (payload: { leaderboard: PlayerInfo[] }) => void;
  /** Game over — final results */
  'game:end': (payload: { leaderboard: PlayerInfo[]; gameId: string }) => void;
  /** Generic error from server */
  'game:error': (payload: { code: string; message: string }) => void;
};
