import type { SourceStatus } from '@flashlearn/shared';

export interface SourceProps {
  id: string;
  workspaceId: string;
  title: string;
  code: string;
  version: string;
  status: SourceStatus;
  owner: string;
  effectiveDate: Date;
  chunkCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SourceEntity {
  constructor(public readonly props: SourceProps) {}

  get id(): string {
    return this.props.id;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get title(): string {
    return this.props.title;
  }

  get code(): string {
    return this.props.code;
  }

  get version(): string {
    return this.props.version;
  }

  get status(): SourceStatus {
    return this.props.status;
  }

  get owner(): string {
    return this.props.owner;
  }

  get effectiveDate(): Date {
    return this.props.effectiveDate;
  }

  get chunkCount(): number {
    return this.props.chunkCount ?? 0;
  }

  isActive(): boolean {
    return this.props.status === 'active';
  }

  isSuperseded(): boolean {
    return this.props.status === 'superseded';
  }
}
