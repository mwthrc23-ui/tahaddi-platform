import { randomInt } from 'node:crypto';

const ROOM_CODE_ALPHABET = '34679ACDEFGHJKMNPQRTUVWXY';
const DEFAULT_ROOM_CODE_LENGTH = 6;
const DEFAULT_MAX_ATTEMPTS = 10;

interface QuizLookupClient {
  quiz: {
    findUnique(args: {
      where: { roomCode: string };
      select: { id: true };
    }): Promise<{ id: string } | null>;
  };
}

interface ActivityLookupClient extends QuizLookupClient {
  mafiaGame: {
    findUnique(args: {
      where: { roomCode: string };
      select: { id: true };
    }): Promise<{ id: string } | null>;
  };
}

interface GenerateUniqueRoomCodeOptions {
  length?: number;
  maxAttempts?: number;
}

export function generateRoomCode(length = DEFAULT_ROOM_CODE_LENGTH) {
  if (!Number.isInteger(length) || length < 6 || length > 8) {
    throw new RangeError('Room code length must be an integer between 6 and 8.');
  }

  return Array.from(
    { length },
    () => ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)],
  ).join('');
}

export async function generateUniqueRoomCode(
  prisma: QuizLookupClient,
  {
    length = DEFAULT_ROOM_CODE_LENGTH,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
  }: GenerateUniqueRoomCodeOptions = {},
) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError('Maximum attempts must be a positive integer.');
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const roomCode = generateRoomCode(length);
    const existingQuiz = await prisma.quiz.findUnique({
      where: { roomCode },
      select: { id: true },
    });

    if (!existingQuiz) {
      return roomCode;
    }
  }

  throw new Error(`Unable to allocate a unique room code after ${maxAttempts} attempts.`);
}

export async function generateUniqueActivityRoomCode(
  prisma: ActivityLookupClient,
  {
    length = DEFAULT_ROOM_CODE_LENGTH,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
  }: GenerateUniqueRoomCodeOptions = {},
) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError('Maximum attempts must be a positive integer.');
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const roomCode = generateRoomCode(length);
    const [existingQuiz, existingMafiaGame] = await Promise.all([
      prisma.quiz.findUnique({ where: { roomCode }, select: { id: true } }),
      prisma.mafiaGame.findUnique({ where: { roomCode }, select: { id: true } }),
    ]);

    if (!existingQuiz && !existingMafiaGame) {
      return roomCode;
    }
  }

  throw new Error(`Unable to allocate a unique room code after ${maxAttempts} attempts.`);
}
