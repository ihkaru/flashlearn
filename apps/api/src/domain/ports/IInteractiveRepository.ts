import type {
  ContentArtifact,
  ContentArtifactKind,
  ContentArtifactMetadata,
  LearnerContentProgress,
  SaveLearnerProgressRequest,
} from '@flashlearn/shared';

export interface LearnerIdentity {
  userId?: string;
  sessionKey?: string;
}

export interface UpsertArtifactData {
  contentId: string;
  kind: ContentArtifactKind;
  mimeType: string;
  htmlContent: string;
  sha256Hash: string;
  byteSize: number;
  metadata?: ContentArtifactMetadata | null;
}

export interface RecentResumableSession extends LearnerContentProgress {
  contentTitle: string;
  contentType: string;
  workspaceId: string;
  workspaceName: string;
}

export interface IInteractiveRepository {
  upsertArtifact(data: UpsertArtifactData): Promise<ContentArtifact>;
  getArtifact(contentId: string, kind: ContentArtifactKind): Promise<ContentArtifact | null>;
  listArtifactKindsByContentIds(contentIds: string[]): Promise<Map<string, ContentArtifactKind[]>>;
  deleteArtifact(contentId: string, kind: ContentArtifactKind): Promise<boolean>;
  getProgress(contentId: string, identity: LearnerIdentity): Promise<LearnerContentProgress | null>;
  listProgressByWorkspace(workspaceId: string, identity: LearnerIdentity): Promise<LearnerContentProgress[]>;
  listRecentProgress(identity: LearnerIdentity, limit?: number): Promise<RecentResumableSession[]>;
  saveProgress(
    contentId: string,
    identity: LearnerIdentity,
    input: SaveLearnerProgressRequest
  ): Promise<LearnerContentProgress>;
}
