import type { SpacedFlashcard, FlashcardType } from '@flashlearn/shared';

export interface SpacedFlashcardProps {
  id: string;
  userId: string;
  competencyId: string;
  sourceChunkId?: string | null;
  cardType?: FlashcardType;
  front: string;
  back: string;
  predictionOptions?: string[];
  causalRationale?: string;
  category?: string;
  repetitionIntervalDays?: number;
  easeFactor?: number;
  repetitionCount?: number;
  nextReviewDue?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SpacedFlashcardEntity implements SpacedFlashcard {
  readonly id: string;
  readonly userId: string;
  readonly competencyId: string;
  readonly sourceChunkId?: string | null;
  readonly cardType?: FlashcardType;
  readonly front: string;
  readonly back: string;
  readonly predictionOptions?: string[];
  readonly causalRationale?: string;
  readonly category: string;
  readonly repetitionIntervalDays: number;
  readonly easeFactor: number;
  readonly repetitionCount: number;
  readonly nextReviewDue: string;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(props: SpacedFlashcardProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.competencyId = props.competencyId;
    this.sourceChunkId = props.sourceChunkId || null;
    this.cardType = props.cardType ?? 'definition';
    this.front = props.front;
    this.back = props.back;
    this.predictionOptions = props.predictionOptions;
    this.causalRationale = props.causalRationale;
    this.category = props.category || 'general';
    this.repetitionIntervalDays = props.repetitionIntervalDays ?? 1;
    this.easeFactor = props.easeFactor ?? 250;
    this.repetitionCount = props.repetitionCount ?? 0;
    this.nextReviewDue = (props.nextReviewDue || new Date()).toISOString();
    this.createdAt = (props.createdAt || new Date()).toISOString();
    this.updatedAt = (props.updatedAt || new Date()).toISOString();
  }

  isDue(): boolean {
    return new Date(this.nextReviewDue) <= new Date();
  }
}
