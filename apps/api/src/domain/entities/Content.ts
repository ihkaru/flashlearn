import type { ContentType, QuizQuestion } from '@flashlearn/shared';

export interface ContentProps {
  id: string;
  workspaceId: string;
  domainId?: string | null;
  competencyId?: string | null;
  title: string;
  slug: string;
  type: ContentType;
  summary: string | null;
  readingTimeMinutes: number | null;
  body: string | null;
  questions: QuizQuestion[] | null;
  isPublished: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ContentEntity {
  constructor(public readonly props: ContentProps) {}

  get id(): string {
    return this.props.id;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get domainId(): string | null | undefined {
    return this.props.domainId;
  }

  get competencyId(): string | null | undefined {
    return this.props.competencyId;
  }

  get title(): string {
    return this.props.title;
  }

  get type(): ContentType {
    return this.props.type;
  }

  get body(): string | null {
    return this.props.body;
  }

  get questions(): QuizQuestion[] | null {
    return this.props.questions;
  }

  get isPublished(): boolean {
    return this.props.isPublished;
  }

  hasMateri(): boolean {
    return this.props.type === 'materi' || this.props.type === 'combined';
  }

  hasQuiz(): boolean {
    return this.props.type === 'quiz' || this.props.type === 'combined';
  }

  // Learner-facing questions strip the `isCorrect` property so answers are not exposed in client network inspection!
  getLearnerQuestions(): QuizQuestion[] {
    if (!this.props.questions) return [];
    return this.props.questions.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
      })),
      explanation: '', // Hidden until submitted
    }));
  }

  toJSON(includeAnswers = true) {
    return {
      id: this.props.id,
      workspaceId: this.props.workspaceId,
      domainId: this.props.domainId || null,
      competencyId: this.props.competencyId || null,
      title: this.props.title,
      slug: this.props.slug,
      type: this.props.type,
      summary: this.props.summary,
      readingTimeMinutes: this.props.readingTimeMinutes,
      body: this.props.body,
      questions: includeAnswers ? this.props.questions : this.getLearnerQuestions(),
      isPublished: this.props.isPublished,
      deletedAt: this.props.deletedAt ? this.props.deletedAt.toISOString() : null,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
