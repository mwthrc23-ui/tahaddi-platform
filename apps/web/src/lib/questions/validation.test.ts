import { describe, expect, it } from 'vitest';
import { questionSchema } from './validation';

const validQuestion = {
  type: 'MULTIPLE_CHOICE',
  prompt: 'ما هي عاصمة المملكة العربية السعودية؟',
  options: ['الرياض', 'جدة'],
  correctOption: 0,
  difficulty: 'EASY',
  timeLimit: 20,
  basePoints: 1000,
};

describe('questionSchema', () => {
  it('accepts a valid multiple-choice question', () =>
    expect(questionSchema.safeParse(validQuestion).success).toBe(true));
  it('rejects a correct answer outside the supplied options', () =>
    expect(questionSchema.safeParse({ ...validQuestion, correctOption: 2 }).success).toBe(false));
  it('requires exactly two options for true or false', () =>
    expect(
      questionSchema.safeParse({
        ...validQuestion,
        type: 'TRUE_FALSE',
        options: ['صح', 'خطأ', 'ربما'],
      }).success,
    ).toBe(false));
});
