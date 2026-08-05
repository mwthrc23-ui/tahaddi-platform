import { describe, expect, it } from 'vitest';
import {
  formatNightKillMessage,
  formatNightNoVictimMessage,
  formatNightSavedMessage,
  formatVoteOutMessage,
  formatVoteTieMessage,
  getLatestMafiaPublicOutcome,
  getMafiaMission,
  getMafiaPhaseEveryoneHint,
  getMafiaTeam,
  mafiaBeginnerTips,
  mafiaDisplayInitial,
  mafiaHowToPlaySteps,
  mafiaNightActionLabels,
  mafiaPhaseGuides,
  mafiaRoleCatalog,
  mafiaRoleGuides,
  mafiaWinConditions,
  parseMafiaSystemOutcome,
} from './guidance';
import type { MafiaRoleName } from './rules';

const roles: MafiaRoleName[] = ['KILLER', 'DETECTIVE', 'DOCTOR', 'GUARD', 'WITNESS', 'CITIZEN'];

describe('mafia guidance', () => {
  it('defines an objective and an actionable mission for every role and active phase', () => {
    for (const role of roles) {
      expect(mafiaRoleGuides[role].objective.length).toBeGreaterThan(20);
      for (const phase of ['NIGHT', 'DAY', 'VOTING'] as const) {
        const mission = getMafiaMission(role, phase);
        expect(mission.title).not.toBe('');
        expect(mission.summary).not.toBe('');
        expect(mission.steps).toHaveLength(3);
      }
    }
  });

  it('gives eliminated players a non-interactive mission', () => {
    expect(getMafiaMission('KILLER', 'NIGHT', true).title).toContain('المستبعدين');
  });

  it('describes the automatic destination after every phase', () => {
    expect(mafiaPhaseGuides.NIGHT.next).toContain('النهار');
    expect(mafiaPhaseGuides.DAY.next).toBe('التصويت');
    expect(mafiaPhaseGuides.VOTING.next).toContain('الليل');
  });

  it('exposes beginner-friendly how-to, roles catalog, and win conditions', () => {
    expect(mafiaHowToPlaySteps).toHaveLength(4);
    expect(mafiaRoleCatalog).toHaveLength(6);
    expect(mafiaBeginnerTips.length).toBeGreaterThanOrEqual(4);
    expect(mafiaWinConditions.citizens.detail.length).toBeGreaterThan(10);
    expect(mafiaWinConditions.killers.detail.length).toBeGreaterThan(10);
    expect(getMafiaTeam('KILLER')).toBe('KILLERS');
    expect(getMafiaTeam('CITIZEN')).toBe('CITIZENS');
    expect(getMafiaPhaseEveryoneHint('NIGHT')).toContain('الأدوار السرية');
    expect(mafiaNightActionLabels.KILLER?.confirm).toContain('القتل');
  });

  it('formats and parses public night/vote outcomes with clear victim names', () => {
    const kill = formatNightKillMessage('سارة');
    expect(kill).toContain('تم قتل الضحية');
    expect(kill).toContain('«سارة»');
    expect(parseMafiaSystemOutcome(kill)).toMatchObject({
      kind: 'night-kill',
      victimName: 'سارة',
      title: 'تم قتل الضحية: سارة',
    });

    expect(parseMafiaSystemOutcome(formatNightSavedMessage())?.kind).toBe('night-safe');
    expect(parseMafiaSystemOutcome(formatNightNoVictimMessage())?.kind).toBe('night-no-victim');
    expect(parseMafiaSystemOutcome(formatVoteOutMessage('ماجد'))).toMatchObject({
      kind: 'vote-out',
      victimName: 'ماجد',
    });
    expect(parseMafiaSystemOutcome(formatVoteTieMessage())?.kind).toBe('vote-tie');
    expect(mafiaDisplayInitial(' أحمد')).toBe('أ');

    const latest = getLatestMafiaPublicOutcome([
      { channel: 'PUBLIC', body: 'مرحبا' },
      { channel: 'SYSTEM', body: formatNightKillMessage('ليان') },
      { channel: 'SYSTEM', body: 'بدأت اللعبة.' },
    ]);
    expect(latest?.victimName).toBe('ليان');
  });
});
