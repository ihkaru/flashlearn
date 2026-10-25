import type { ContentEntity } from '../entities/Content';
import type { ContentType, QuizQuestion } from '@flashlearn/shared';

export interface CreateContentData {
  workspaceId: string;
  domainId?: string | null;
  competencyId?: string | null;
  title: string;
  slug: string;
  type: ContentType;
  summary?: string | null;
  readingTimeMinutes?: number | null;
  body?: string | null;
  questions?: QuizQuestion[] | null;
  isPublished: boolean;
}

export interface UpdateContentData {
  domainId?: string | null;
  competencyId?: string | null;
  title?: string;
  slug?: string;
  type?: ContentType;
  summary?: string | null;
  readingTimeMinutes?: number | null;
  body?: string | null;
  questions?: QuizQuestion[] | null;
  isPublished?: boolean;
}

export interface IContentRepository {
  findById(id: string, includeDeleted?: boolean): Promise<ContentEntity | null>;
  findBySlug(workspaceId: string, slug: string): Promise<ContentEntity | null>;
  listByWorkspace(workspaceId: string, onlyPublished?: boolean, includeDeleted?: boolean): Promise<ContentEntity[]>;
  listByCompetency(competencyId: string): Promise<ContentEntity[]>;
  create(data: CreateContentData): Promise<ContentEntity>;
  update(id: string, data: UpdateContentData): Promise<ContentEntity | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<ContentEntity | null>;
  createVersion(contentId: string, versionNumber: number, action: string, snapshot: any, changedBy?: string | null): Promise<void>;
  getLatestVersionNumber(contentId: string): Promise<number>;
  getVersion(contentId: string, versionNumber: number): Promise<any | null>;
  listVersions(contentId: string): Promise<any[]>;
  listSubmissions(contentId: string): Promise<any[]>;
  checkGuestNameExists(contentId: string, name: string): Promise<boolean>;
}
