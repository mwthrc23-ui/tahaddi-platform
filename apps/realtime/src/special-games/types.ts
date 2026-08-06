import type { ParallelWorldVariant, SpecialGameMode } from '@tahaddi/domain';

export type SpecialGamePhase =
  | 'lobby'
  | 'parallel-answering'
  | 'parallel-reveal'
  | 'reverse-writing'
  | 'reverse-voting'
  | 'reverse-results'
  | 'infiltrator-answering'
  | 'infiltrator-voting'
  | 'infiltrator-reveal'
  | 'finished';

export type SpecialGamePlayer = {
  id: string;
  name: string;
  score: number;
};

export type ReverseSubmission = {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  voterIds: string[];
};

export type InfiltratorAssignment = {
  bankIndex: number;
  variantIndex: number;
};

export type SpecialGameRoom = {
  pin: string;
  hostId: string;
  mode: SpecialGameMode;
  phase: SpecialGamePhase;
  roundIndex: number;
  players: SpecialGamePlayer[];
  readyPlayerIds: string[];
  parallelAssignments: Record<string, number>;
  parallelAnswers: Record<string, string>;
  reverseSubmissions: ReverseSubmission[];
  reverseVoterIds: string[];
  infiltratorId: string | null;
  infiltratorAssignments: Record<string, InfiltratorAssignment>;
  infiltratorAnswers: Record<string, string>;
  infiltratorVotes: Record<string, string>;
  infiltratorMajorityGuess: string | null;
  createdAt: number;
  gameStartedAt?: number;
};

export type SpecialRoomSnapshot = Pick<
  SpecialGameRoom,
  'pin' | 'hostId' | 'mode' | 'phase' | 'roundIndex' | 'players'
> & {
  roundCount: number;
  readyPlayerIds: string[];
};

export type ParallelRoundPayload = {
  roundId: string;
  roundNumber: number;
  roundCount: number;
  face: ParallelWorldVariant['face'];
  faceLabel: string;
  prompt: string;
  options: string[];
  startsAt: number;
  timeLimit: number;
};

export type InfiltratorRoundPayload = {
  roundId: string;
  roundNumber: number;
  roundCount: number;
  prompt: string;
  options: string[];
  isInfiltrator: boolean;
  startsAt: number;
  timeLimit: number;
};

export type ClientToServerSpecialEvents = {
  'special:room:create': (payload: { mode: SpecialGameMode }) => void;
  'special:room:join': (payload: { pin: string; playerName: string }) => void;
  'special:room:leave': (payload: { pin: string }) => void;
  'special:player:ready': (payload: { pin: string }) => void;
  'special:game:start': (payload: { pin: string }) => void;
  'special:round:next': (payload: { pin: string }) => void;
  'parallel:answer:submit': (payload: {
    pin: string;
    roundId: string;
    answer: string;
  }) => void;
  'parallel:reveal': (payload: { pin: string }) => void;
  'reverse:question:submit': (payload: {
    pin: string;
    roundId: string;
    question: string;
  }) => void;
  'reverse:voting:start': (payload: { pin: string }) => void;
  'reverse:vote': (payload: { pin: string; submissionId: string }) => void;
  'reverse:reveal': (payload: { pin: string }) => void;
  'infiltrator:answer:submit': (payload: {
    pin: string;
    roundId: string;
    answer: string;
  }) => void;
  'infiltrator:voting:start': (payload: { pin: string }) => void;
  'infiltrator:vote': (payload: { pin: string; playerId: string }) => void;
  'infiltrator:majority:guess': (payload: {
    pin: string;
    question: string;
  }) => void;
  'infiltrator:reveal': (payload: { pin: string }) => void;
};

export type ServerToClientSpecialEvents = {
  'special:room:state': (payload: SpecialRoomSnapshot) => void;
  'special:error': (payload: { code: string; message: string }) => void;
  'special:game:end': (payload: {
    players: SpecialGamePlayer[];
    mode: SpecialGameMode;
    durationMs: number;
  }) => void;
  'parallel:round': (payload: ParallelRoundPayload) => void;
  'parallel:answer:ack': (payload: {
    correct: boolean;
    earned: number;
    selectedAnswer: string;
  }) => void;
  'parallel:reveal': (payload: {
    answer: string;
    reveal: string;
    results: Array<{
      playerId: string;
      playerName: string;
      faceLabel: string;
      prompt: string;
      selectedAnswer: string | null;
      correct: boolean;
    }>;
  }) => void;
  'reverse:round': (payload: {
    roundId: string;
    roundNumber: number;
    roundCount: number;
    answer: string;
    category: string;
    hint: string;
    startsAt: number;
    timeLimit: number;
  }) => void;
  'reverse:question:ack': (payload: { question: string }) => void;
  'reverse:voting': (payload: {
    answer: string;
    submissions: Array<{ id: string; text: string; isOwn: boolean }>;
  }) => void;
  'reverse:vote:ack': (payload: { submissionId: string }) => void;
  'reverse:results': (payload: {
    answer: string;
    results: Array<{
      id: string;
      playerName: string;
      text: string;
      votes: number;
    }>;
  }) => void;
  'infiltrator:round': (payload: InfiltratorRoundPayload) => void;
  'infiltrator:answer:ack': (payload: { selectedAnswer: string }) => void;
  'infiltrator:voting': (payload: {
    answers: Array<{ playerId: string; answer: string; isOwn: boolean }>;
    isInfiltrator: boolean;
    majorityOptions: string[];
  }) => void;
  'infiltrator:vote:ack': (payload: { playerId: string }) => void;
  'infiltrator:majority:guess:ack': (payload: { question: string }) => void;
  'infiltrator:reveal': (payload: {
    infiltratorId: string;
    infiltratorName: string;
    caught: boolean;
    survived: boolean;
    guessedMajority: boolean;
    infiltratorWon: boolean;
    majorityQuestion: string;
    answers: Array<{ playerId: string; playerName: string; answer: string }>;
    voteCounts: Record<string, number>;
  }) => void;
};
