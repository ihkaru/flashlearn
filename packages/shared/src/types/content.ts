export type ContentType = 'materi' | 'quiz' | 'combined';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean; // Hidden for learners before submission
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Content {
  id: string;
  workspaceId: string;
  title: string;
  slug: string;
  type: ContentType;
  summary: string | null;
  readingTimeMinutes: number | null;
  body: string | null; // Markdown for 'materi' and 'combined'
  questions: QuizQuestion[] | null; // Questions for 'quiz' and 'combined'
  isPublished: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAnswerSubmission {
  questionId: string;
  selectedOptionId: string;
}

export interface QuizSubmissionRequest {
  guestName: string;
  answers: QuizAnswerSubmission[];
}

export interface QuestionReviewItem {
  questionId: string;
  question: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResultResponse {
  guestName?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
  reviews: QuestionReviewItem[];
}

export interface FlashcardItem {
  id: string;
  questionId: string;
  front: string; // The Question prompt
  back: string;  // The Correct answer text
  explanation: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface CreateContentRequest {
  workspaceId: string;
  title: string;
  slug?: string;
  type: ContentType;
  summary?: string;
  readingTimeMinutes?: number;
  body?: string;
  questions?: QuizQuestion[];
  isPublished?: boolean;
}

export interface UpdateContentRequest {
  title?: string;
  slug?: string;
  type?: ContentType;
  summary?: string;
  readingTimeMinutes?: number;
  body?: string;
  questions?: QuizQuestion[];
  isPublished?: boolean;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  action: 'create' | 'update' | 'rollback';
  snapshot: Record<string, any>;
  changedBy: string | null;
  createdAt: string;
}

export interface QuizSubmissionRecord {
  id: string;
  contentId: string;
  guestName: string | null;
  userName?: string | null;
  userEmail?: string | null;
  score: number;
  totalQuestions: number;
  percentage: number;
  answers?: Record<string, any>;
  createdAt: string;
}
