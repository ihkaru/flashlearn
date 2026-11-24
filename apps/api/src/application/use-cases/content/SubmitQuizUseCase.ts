import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type {
  CheckQuestionResponse,
  QuizQuestion,
  QuizSubmissionRequest,
  QuizResultResponse,
  QuestionReviewItem,
} from '@flashlearn/shared';

export function checkSingleQuizQuestion(
  questions: QuizQuestion[],
  questionId: string,
  selectedOptionId: string
): CheckQuestionResponse {
  const target = questions.find((q) => q.id === questionId);
  if (!target) {
    throw new Error(`Question '${questionId}' not found in this quiz`);
  }
  const correctOption = target.options.find((opt) => opt.isCorrect);
  const correctOptionId = correctOption ? correctOption.id : '';
  return {
    questionId: target.id,
    isCorrect: selectedOptionId === correctOptionId,
    correctOptionId,
    explanation: target.explanation || 'No explanation provided.',
    hint: target.hint,
  };
}

export class SubmitQuizUseCase {
  constructor(private readonly contentRepository: IContentRepository) {}

  async execute(contentId: string, submission: QuizSubmissionRequest): Promise<QuizResultResponse> {
    const content = await this.contentRepository.findById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    if (!content.hasQuiz() || !content.questions || content.questions.length === 0) {
      throw new Error('This content does not contain a quiz');
    }

    const trimmedName = submission.guestName?.trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Nama peserta wajib diisi minimal 2 karakter sebelum mengerjakan kuis');
    }

    const answerMap = new Map<string, string>();
    for (const ans of submission.answers) {
      answerMap.set(ans.questionId, ans.selectedOptionId);
    }

    let targetQuestions: QuizQuestion[];
    if (submission.sessionMode === 'subset' && submission.answers.length > 0) {
      const questionById = new Map<string, QuizQuestion>();
      for (const q of content.questions) {
        questionById.set(q.id, q);
      }
      targetQuestions = [];
      for (const questionId of answerMap.keys()) {
        const matched = questionById.get(questionId);
        if (matched) targetQuestions.push(matched);
      }
      if (targetQuestions.length === 0) {
        throw new Error('No valid questions matched the submitted subset');
      }
    } else {
      targetQuestions = content.questions;
    }

    let correctCount = 0;
    const reviews: QuestionReviewItem[] = [];

    for (const q of targetQuestions) {
      const selectedOptionId = answerMap.get(q.id) || '';
      const correctOption = q.options.find((opt) => opt.isCorrect);
      const correctOptionId = correctOption ? correctOption.id : '';
      const isCorrect = selectedOptionId === correctOptionId;

      if (isCorrect) {
        correctCount++;
      }

      reviews.push({
        questionId: q.id,
        question: q.question,
        selectedOptionId,
        correctOptionId,
        isCorrect,
        explanation: q.explanation || 'No explanation provided.',
      });
    }

    const totalQuestions = targetQuestions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // Persist submission for leaderboard / creator insights
    import('../../../infrastructure/database/db')
      .then(async ({ db }) => {
        const { quizSubmissions } = await import('../../../infrastructure/database/schema');
        db.insert(quizSubmissions)
          .values({
            contentId,
            guestName: trimmedName,
            score: correctCount,
            totalQuestions,
            percentage,
            answers: submission.answers,
          })
          .catch(() => {});
      })
      .catch(() => {});

    return {
      guestName: trimmedName,
      score: correctCount,
      totalQuestions,
      correctAnswers: correctCount,
      percentage,
      passed: percentage >= 70,
      reviews,
    };
  }
}
