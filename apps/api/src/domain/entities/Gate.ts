import type { Gate, GateLevel, GateRequirement } from '@flashlearn/shared';

export interface GateProps {
  id: string;
  workspaceId: string;
  level: GateLevel;
  title: string;
  description: string;
  requirements?: GateRequirement[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class GateEntity implements Gate {
  readonly id: string;
  readonly workspaceId: string;
  readonly level: GateLevel;
  readonly title: string;
  readonly description: string;
  readonly requirements: GateRequirement[];
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(props: GateProps) {
    this.id = props.id;
    this.workspaceId = props.workspaceId;
    this.level = props.level;
    this.title = props.title;
    this.description = props.description;
    this.requirements = props.requirements || [];
    this.createdAt = (props.createdAt || new Date()).toISOString();
    this.updatedAt = (props.updatedAt || new Date()).toISOString();
  }

  isHighRisk(): boolean {
    return this.level === 3;
  }
}
