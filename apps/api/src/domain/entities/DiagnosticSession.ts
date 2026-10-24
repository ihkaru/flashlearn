export interface ProbedItem {
  competencyId: string;
  taskId: string;
  passed: boolean;
  score: number;
  timestamp: Date;
}

export interface DiagnosticSessionProps {
  id: string;
  workspaceId: string;
  userId: string;
  status: 'in_progress' | 'completed';
  probedItems: ProbedItem[];
  inferredMasteries: string[];
  stateDistribution?: Record<string, number>;
  currentFringe?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class DiagnosticSessionEntity {
  constructor(public readonly props: DiagnosticSessionProps) {}

  get id(): string {
    return this.props.id;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get status(): 'in_progress' | 'completed' {
    return this.props.status;
  }

  get probedItems(): ProbedItem[] {
    return this.props.probedItems;
  }

  get inferredMasteries(): string[] {
    return this.props.inferredMasteries;
  }

  get currentFringe(): string[] {
    return this.props.currentFringe || [];
  }

  get probedCompetencyIds(): string[] {
    return this.props.probedItems.map((p) => p.competencyId);
  }

  isCompleted(): boolean {
    return this.props.status === 'completed';
  }

  recordProbe(item: ProbedItem, updatedMasteries: string[], nextFringe: string[]): void {
    this.props.probedItems.push(item);
    this.props.inferredMasteries = updatedMasteries;
    this.props.currentFringe = nextFringe;
    this.props.updatedAt = new Date();
  }

  markCompleted(): void {
    this.props.status = 'completed';
    this.props.updatedAt = new Date();
  }
}
