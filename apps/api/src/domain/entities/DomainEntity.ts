import type { Domain } from '@flashlearn/shared';

export interface DomainEntityProps {
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
  createdAt: Date;
  updatedAt: Date;
}

export class DomainEntity {
  constructor(private readonly props: DomainEntityProps) {}

  get id(): string { return this.props.id; }
  get workspaceId(): string { return this.props.workspaceId; }
  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get slug(): string { return this.props.slug; }
  get description(): string | null { return this.props.description; }
  get targetRole(): string { return this.props.targetRole; }
  get responsibilityScope(): string { return this.props.responsibilityScope; }
  get legalAuthorityLevel(): number { return this.props.legalAuthorityLevel; }
  get minPassingScore(): number { return this.props.minPassingScore; }
  get icon(): string | null { return this.props.icon; }
  get coverImage(): string | null { return this.props.coverImage; }
  get status(): 'draft' | 'active' | 'archived' { return this.props.status; }
  get competencyCount(): number | undefined { return this.props.competencyCount; }
  get gateCount(): number | undefined { return this.props.gateCount; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toJSON(): Domain {
    return {
      id: this.props.id,
      workspaceId: this.props.workspaceId,
      code: this.props.code,
      name: this.props.name,
      slug: this.props.slug,
      description: this.props.description,
      targetRole: this.props.targetRole,
      responsibilityScope: this.props.responsibilityScope,
      legalAuthorityLevel: this.props.legalAuthorityLevel,
      minPassingScore: this.props.minPassingScore,
      icon: this.props.icon,
      coverImage: this.props.coverImage,
      status: this.props.status,
      competencyCount: this.props.competencyCount,
      gateCount: this.props.gateCount,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
