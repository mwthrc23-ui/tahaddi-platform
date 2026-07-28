type PublishableQuestion = {
  status: string;
  optionCount: number;
  correctOptionCount: number;
};

export function areQuizQuestionsPlayable(questions: readonly PublishableQuestion[]): boolean {
  return (
    questions.length > 0 &&
    questions.every(
      (question) =>
        question.status === 'PUBLISHED' &&
        question.optionCount >= 2 &&
        question.correctOptionCount === 1,
    )
  );
}
