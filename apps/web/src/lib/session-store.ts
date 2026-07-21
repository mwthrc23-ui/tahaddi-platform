const SESSION_KEY = 'tahaddi-demo-session';

export type DemoAnswer = {
  questionIndex: number;
  optionIndex: number;
  correct: boolean;
  earned: number;
};

export type DemoSession = {
  score: number;
  currentIndex: number;
  currentStreak: number;
  longestStreak: number;
  answers: DemoAnswer[];
  finished: boolean;
};

export function initSession(): DemoSession {
  return { score: 0, currentIndex: 0, currentStreak: 0, longestStreak: 0, answers: [], finished: false };
}

export function loadSession(): DemoSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as DemoSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: DemoSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function streakMultiplier(streak: number): number {
  if (streak >= 5) return 1.5;
  if (streak >= 3) return 1.35;
  if (streak >= 2) return 1.2;
  if (streak >= 1) return 1.1;
  return 1.0;
}

export function calcEarned(basePoints: number, timeLimit: number, remaining: number, streak: number): number {
  const elapsed = timeLimit - remaining;
  const base = Math.round((1 - elapsed / (2 * timeLimit)) * basePoints);
  return Math.round(base * streakMultiplier(streak));
}
