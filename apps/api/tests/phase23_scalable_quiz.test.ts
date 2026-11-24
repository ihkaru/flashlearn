import { describe, expect, it } from 'bun:test';
import {
  SubmitQuizUseCase,
  checkSingleQuizQuestion,
} from '../src/application/use-cases/content/SubmitQuizUseCase';
import { GenerateFlashcardsUseCase } from '../src/application/use-cases/content/GenerateFlashcardsUseCase';
import { ContentEntity } from '../src/domain/entities/Content';
import type { IContentRepository } from '../src/domain/ports/IContentRepository';
import type { QuizQuestion } from '@flashlearn/shared';

function buildQuestionBank(count: number): QuizQuestion[] {
  const topics = ['Statistika Deskriptif', 'Probabilitas', 'Inferensia', 'Regresi Linear', 'Sampling'];
  return Array.from({ length: count }, (_, idx) => {
    const num = idx + 1;
    const topic = topics[idx % topics.length];
    return {
      id: `q-${num}`,
      question: `Pertanyaan latihan #${num} pada topik ${topic}`,
      options: [
        { id: `q-${num}-a`, text: `Opsi A #${num}`, isCorrect: false },
        { id: `q-${num}-b`, text: `Opsi B (Benar) #${num}`, isCorrect: true },
        { id: `q-${num}-c`, text: `Opsi C #${num}`, isCorrect: false },
        { id: `q-${num}-d`, text: `Opsi D #${num}`, isCorrect: false },
      ],
      explanation: `Penjelasan kausal untuk soal #${num}.`,
      hint: `Petunjuk ringkas untuk soal #${num}.`,
      difficulty: num % 3 === 0 ? 'hard' : num % 2 === 0 ? 'medium' : 'easy',
      topic,
      sourceRef: `Bab ${(idx % 10) + 1} hal. ${10 + num}`,
    };
  });
}

function createInMemoryContentRepo(content: ContentEntity): IContentRepository {
  return {
    findById: async (id: string) => (id === content.id ? content : null),
  } as unknown as IContentRepository;
}

describe('Phase 23: Scalable Quiz & Flashcard Drill Backend', () => {
  const bank600 = buildQuestionBank(600);
  const quizContent = new ContentEntity({
    id: 'quiz-600-id',
    workspaceId: 'ws-test-id',
    domainId: 'dom-test-id',
    title: 'Bank Soal 600 Item',
    slug: 'bank-soal-600-item',
    type: 'quiz',
    summary: 'Latihan intensif 600 soal lintas topik.',
    readingTimeMinutes: 120,
    body: null,
    questions: bank600,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('scores a 20-question micro-session from a 600-question bank out of 20 (100%) in <50ms', async () => {
    const useCase = new SubmitQuizUseCase(createInMemoryContentRepo(quizContent));
    const subsetAnswers = bank600.slice(100, 120).map((q) => ({
      questionId: q.id,
      selectedOptionId: `${q.id}-b`,
    }));

    const start = performance.now();
    const result = await useCase.execute(quizContent.id, {
      guestName: 'Rina Mahasiswa',
      sessionMode: 'subset',
      answers: subsetAnswers,
    });
    const elapsedMs = performance.now() - start;

    expect(result.totalQuestions).toBe(20);
    expect(result.score).toBe(20);
    expect(result.correctAnswers).toBe(20);
    expect(result.percentage).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.reviews).toHaveLength(20);
    expect(result.reviews[0].questionId).toBe('q-101');
    expect(elapsedMs).toBeLessThan(50);
  });

  it('preserves full-bank scoring when sessionMode is omitted or full', async () => {
    const useCase = new SubmitQuizUseCase(createInMemoryContentRepo(quizContent));
    const partialAnswers = bank600.slice(0, 20).map((q) => ({
      questionId: q.id,
      selectedOptionId: `${q.id}-b`,
    }));

    const result = await useCase.execute(quizContent.id, {
      guestName: 'Budi Peserta',
      answers: partialAnswers,
    });

    expect(result.totalQuestions).toBe(600);
    expect(result.score).toBe(20);
    expect(result.percentage).toBe(3);
    expect(result.passed).toBe(false);
    expect(result.reviews).toHaveLength(600);
  });

  it('propagates topic and sourceRef onto every generated FlashcardItem', async () => {
    const useCase = new GenerateFlashcardsUseCase(createInMemoryContentRepo(quizContent));
    const cards = await useCase.execute(quizContent.id);

    expect(cards).toHaveLength(600);
    expect(cards[0].topic).toBe('Statistika Deskriptif');
    expect(cards[0].sourceRef).toBe('Bab 1 hal. 11');
    expect(cards[0].back).toBe('Opsi B (Benar) #1');
    expect(cards[599].topic).toBe('Sampling');
    expect(cards[599].sourceRef).toBe('Bab 10 hal. 610');
  });

  it('checks a single question server-side without leaking other questions', () => {
    const correctRes = checkSingleQuizQuestion(bank600, 'q-42', 'q-42-b');
    expect(correctRes).toEqual({
      questionId: 'q-42',
      isCorrect: true,
      correctOptionId: 'q-42-b',
      explanation: 'Penjelasan kausal untuk soal #42.',
      hint: 'Petunjuk ringkas untuk soal #42.',
    });

    const wrongRes = checkSingleQuizQuestion(bank600, 'q-42', 'q-42-a');
    expect(wrongRes.isCorrect).toBe(false);
    expect(wrongRes.correctOptionId).toBe('q-42-b');

    expect(() => checkSingleQuizQuestion(bank600, 'q-does-not-exist', 'a')).toThrow('not found');
  });
});
