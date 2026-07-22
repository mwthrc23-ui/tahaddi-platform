import { describe, expect, it } from 'vitest';
import { isSessionUserCurrent } from './session';

const sessionUser = { id: 'user-1', tokenVersion: 3 };

describe('active session validation', () => {
  it('allows an active user with the current token version', () => {
    expect(
      isSessionUserCurrent(sessionUser, {
        id: 'user-1',
        role: 'USER',
        status: 'ACTIVE',
        tokenVersion: 3,
      }),
    ).toBe(true);
  });

  it('rejects a user suspended after the token was issued', () => {
    expect(
      isSessionUserCurrent(sessionUser, {
        id: 'user-1',
        role: 'USER',
        status: 'SUSPENDED',
        tokenVersion: 4,
      }),
    ).toBe(false);
  });

  it('rejects a stale token even when the account is active again', () => {
    expect(
      isSessionUserCurrent(sessionUser, {
        id: 'user-1',
        role: 'USER',
        status: 'ACTIVE',
        tokenVersion: 4,
      }),
    ).toBe(false);
  });
});
