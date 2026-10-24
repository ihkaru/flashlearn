import type { OracleClass, RiskLevel } from '@flashlearn/shared';

export interface CompetencyProps {
  id: string;
  workspaceId: string;
  sourceId?: string | null;
  code: string;
  title: string;
  description: string;
  oracleClass: OracleClass;
  riskLevel: RiskLevel;
  isExpertApproved: boolean;
  approvedBy?: string | null;
  prerequisiteIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class CompetencyEntity {
  constructor(public readonly props: CompetencyProps) {}

  get id(): string {
    return this.props.id;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get sourceId(): string | null {
    return this.props.sourceId ?? null;
  }

  get code(): string {
    return this.props.code;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get oracleClass(): OracleClass {
    return this.props.oracleClass;
  }

  get riskLevel(): RiskLevel {
    return this.props.riskLevel;
  }

  get isExpertApproved(): boolean {
    return this.props.isExpertApproved;
  }

  get approvedBy(): string | null {
    return this.props.approvedBy ?? null;
  }

  get prerequisiteIds(): string[] {
    return this.props.prerequisiteIds ?? [];
  }

  isClassA(): boolean {
    return this.props.oracleClass === 'A';
  }

  isClassB(): boolean {
    return this.props.oracleClass === 'B';
  }

  isClassC(): boolean {
    return this.props.oracleClass === 'C';
  }

  isHighRisk(): boolean {
    return this.props.riskLevel === 'high';
  }
}
