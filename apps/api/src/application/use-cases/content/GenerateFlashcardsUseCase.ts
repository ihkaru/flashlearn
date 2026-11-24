import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { FlashcardItem } from '@flashlearn/shared';

export class GenerateFlashcardsUseCase {
  constructor(private readonly contentRepository: IContentRepository) {}

  async execute(contentId: string): Promise<FlashcardItem[]> {
    const content = await this.contentRepository.findById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    if (!content.hasQuiz() || !content.questions || content.questions.length === 0) {
      throw new Error('This content does not contain quiz questions to convert into flashcards');
    }

    const flashcards: FlashcardItem[] = content.questions.map((q) => {
      const correctOption = q.options.find((opt) => opt.isCorrect);
      const answerText = correctOption ? correctOption.text : 'Answer not specified';

      return {
        id: `fc-${q.id}`,
        questionId: q.id,
        front: q.question,
        back: answerText,
        explanation: q.explanation || '',
        hint: q.hint,
        difficulty: q.difficulty || 'medium',
        topic: q.topic,
        sourceRef: q.sourceRef,
      };
    });

    return flashcards;
  }
}
