import type { ParallelWorldVariant, SpecialGameMode } from '@tahaddi/domain';

export type SpecialGamePhase =
  | 'lobby'
  | 'parallel-answering'
  | 'parallel-reveal'
  | 'reverse-writing'
  | 'reverse-voting'
  | 'reverse-results'
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

export type SpecialGameRoom = {
  pin: string;
  hostId: string;
  mode: SpecialGameMode;
  phase: SpecialGamePhase;
  roundIndex: number;
  players: SpecialGamePlayer[];
  parallelAssignments: Record<string, number>;
  parallelAnswers: Record<string, string>;
  reverseSubmissions: ReverseSubmission[];
  reverseVoterIds: string[];
  createdAt: number;
};

export type SpecialRoomSnapshot = Pick<
  SpecialGameRoom,
  'pin' | 'hostId' | 'mode' | 'phase' | 'roundIndex' | 'players'
> & {
  roundCount: number;
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

export type ClientToServerSpecialEvents = {
  'special:room:create': (payload: { mode: SpecialGameMode }) => void;
  'special:room:join': (payload: { pin: string; playerName: string }) => void;
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
};

export type ServerToClientSpecialEvents = {
  'special:room:state': (payload: SpecialRoomSnapshot) => void;
  'special:error': (payload: { code: string; message: string }) => void;
  'special:game:end': (payload: {
    players: SpecialGamePlayer[];
    mode: SpecialGameMode;
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
};
