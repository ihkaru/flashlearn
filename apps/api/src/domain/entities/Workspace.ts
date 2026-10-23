export interface WorkspaceProps {
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
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkspaceEntity {
  constructor(public readonly props: WorkspaceProps) {}

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  canBeAccessedBy(userId?: string | null, isSuperadmin = false): boolean {
    if (this.props.isPublic) return true;
    if (isSuperadmin) return true;
    return !!userId && this.props.creatorId === userId;
  }

  canBeModifiedBy(userId: string, isSuperadmin = false): boolean {
    if (isSuperadmin) return true;
    return this.props.creatorId === userId;
  }

  toJSON() {
    return {
      id: this.props.id,
      name: this.props.name,
      slug: this.props.slug,
      description: this.props.description,
      coverImage: this.props.coverImage,
      icon: this.props.icon,
      isPublic: this.props.isPublic,
      creatorId: this.props.creatorId,
      creatorName: this.props.creatorName,
      creatorEmail: this.props.creatorEmail,
      contentCount: this.props.contentCount ?? 0,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
