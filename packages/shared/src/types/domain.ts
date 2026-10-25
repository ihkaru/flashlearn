export interface Domain {
  id: string;
  workspaceId: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  targetRole: string;
  responsibilityScope: string;
  legalAuthorityLevel: number;
  minPassingScore: number;
  icon: string | null;
  coverImage: string | null;
  status: 'draft' | 'active' | 'archived';
  competencyCount?: number;
  gateCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDomainRequest {
  workspaceId: string;
  code: string;
  name: string;
  slug?: string;
  description?: string;
  targetRole: string;
  responsibilityScope: string;
  legalAuthorityLevel?: number;
  minPassingScore?: number;
  icon?: string;
  coverImage?: string;
  status?: 'draft' | 'active' | 'archived';
}

export interface UpdateDomainRequest {
  code?: string;
  name?: string;
  slug?: string;
  description?: string;
  targetRole?: string;
  responsibilityScope?: string;
  legalAuthorityLevel?: number;
  minPassingScore?: number;
  icon?: string;
  coverImage?: string;
  status?: 'draft' | 'active' | 'archived';
}
