import { describe, expect, it } from 'vitest';
import { areQuizQuestionsPlayable } from './content-policy';

describe('quiz publishing policy', () => {
  it('accepts only complete published questions', () => {
    expect(
      areQuizQuestionsPlayable([
        { status: 'PUBLISHED', optionCount: 4, correctOptionCount: 1 },
        { status: 'PUBLISHED', optionCount: 2, correctOptionCount: 1 },
      ]),
    ).toBe(true);
  });

  it.each([
    [[]],
    [[{ status: 'DRAFT', optionCount: 4, correctOptionCount: 1 }]],
    [[{ status: 'ARCHIVED', optionCount: 4, correctOptionCount: 1 }]],
    [[{ status: 'PUBLISHED', optionCount: 1, correctOptionCount: 1 }]],
    [[{ status: 'PUBLISHED', optionCount: 4, correctOptionCount: 0 }]],
    [[{ status: 'PUBLISHED', optionCount: 4, correctOptionCount: 2 }]],
  ])('rejects incomplete question sets', (questions) => {
    expect(areQuizQuestionsPlayable(questions)).toBe(false);
  });
});
