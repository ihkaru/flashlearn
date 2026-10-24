import type { TaskType, OracleData, RubricCriterion, AdversarialDilemmaSpec } from '@flashlearn/shared';

export interface TaskProps {
  id: string;
  competencyId: string;
  title: string;
  scenario: string;
  taskType: TaskType;
  oracleData: OracleData;
  adversarialSpec?: AdversarialDilemmaSpec | null;
  rubricCriteria: RubricCriterion[];
  passingScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TaskEntity {
  constructor(public readonly props: TaskProps) {}

  get id(): string {
    return this.props.id;
  }

  get competencyId(): string {
    return this.props.competencyId;
  }

  get title(): string {
    return this.props.title;
  }

  get scenario(): string {
    return this.props.scenario;
  }

  get taskType(): TaskType {
    return this.props.taskType;
  }

  get oracleData(): OracleData {
    return this.props.oracleData;
  }

  get adversarialSpec(): AdversarialDilemmaSpec | null | undefined {
    return this.props.adversarialSpec;
  }

  get rubricCriteria(): RubricCriterion[] {
    return this.props.rubricCriteria;
  }

  get passingScore(): number {
    return this.props.passingScore;
  }

  isCalculation(): boolean {
    return this.props.taskType === 'calculation';
  }

  isCaseStudy(): boolean {
    return this.props.taskType === 'case_study';
  }

  isAdversarialDilemma(): boolean {
    return this.props.taskType === 'adversarial_dilemma';
  }

  toJSON(): TaskProps {
    return { ...this.props };
  }
}
