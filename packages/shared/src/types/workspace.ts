export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  icon: string | null;
  isPublic: boolean;
  creatorId: string;
  creatorName?: string;
  creatorEmail?: string;
  contentCount?: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceVersion {
  id: string;
  workspaceId: string;
  versionNumber: number;
  action: 'create' | 'update' | 'rollback';
  snapshot: Record<string, any>;
  changedBy: string | null;
  createdAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface RollbackRequest {
  versionNumber?: number;
}
