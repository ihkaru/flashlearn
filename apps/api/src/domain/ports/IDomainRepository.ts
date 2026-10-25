import type { DomainEntity } from '../entities/DomainEntity';

export interface CreateDomainProps {
  workspaceId: string;
  code: string;
  name: string;
  slug: string;
  description?: string | null;
  targetRole: string;
  responsibilityScope: string;
  legalAuthorityLevel?: number;
  minPassingScore?: number;
  icon?: string | null;
  coverImage?: string | null;
  status?: 'draft' | 'active' | 'archived';
}

export interface IDomainRepository {
  findById(id: string): Promise<DomainEntity | null>;
  findBySlug(workspaceId: string, slug: string): Promise<DomainEntity | null>;
  listByWorkspace(workspaceId: string): Promise<DomainEntity[]>;
  create(data: CreateDomainProps): Promise<DomainEntity>;
  update(id: string, data: Partial<CreateDomainProps>): Promise<DomainEntity>;
  delete(id: string): Promise<void>;
}
