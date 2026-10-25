import type { OracleClass, RiskLevel, CognitiveArchetype } from '@flashlearn/shared';

export interface CompetencyProps {
  id: string;
  workspaceId: string;
  domainId?: string | null;
  sourceId?: string | null;
  code: string;
  title: string;
  description: string;
  oracleClass: OracleClass;
  cognitiveArchetype?: CognitiveArchetype;
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

  get domainId(): string | null {
    return this.props.domainId ?? null;
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

  get cognitiveArchetype(): CognitiveArchetype {
    return this.props.cognitiveArchetype || 'ill_structured_case';
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

  toNode() {
    return {
      id: this.props.id,
      workspaceId: this.props.workspaceId,
      domainId: this.props.domainId ?? null,
      sourceId: this.props.sourceId ?? null,
      code: this.props.code,
      title: this.props.title,
      description: this.props.description,
      oracleClass: this.props.oracleClass,
      cognitiveArchetype: this.cognitiveArchetype,
      riskLevel: this.props.riskLevel,
      isExpertApproved: this.props.isExpertApproved,
      approvedBy: this.props.approvedBy ?? null,
      prerequisiteIds: this.props.prerequisiteIds ?? [],
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
