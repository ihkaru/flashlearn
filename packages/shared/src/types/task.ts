import type { OracleClass } from './competency';
import type { LumisTranscriptBundle } from './lumis-audit';

export type TaskType = 'calculation' | 'case_study' | 'document_draft' | 'checklist' | 'adversarial_dilemma';

export type AdversarialTrapType =
  | 'OMISSION_DATA'
  | 'CONFIDENCE_DECEPTION'
  | 'AUTHORITY_PRESSURE'
  | 'ETHICAL_CONFLICT';

export type AdversarialCorrectDisposition =
  | 'REJECT_AND_DEMAND_DATA'
  | 'FLAG_IRREGULARITY'
  | 'ENFORCE_BOUNDARY'
  | 'ESCALATE_AUDIT';

export interface TrapCue {
  cue: string;
  weight: number;
}

export interface AdversarialDilemmaSpec {
  trapType: AdversarialTrapType;
  correctDisposition: AdversarialCorrectDisposition;
  trapCues: TrapCue[];
  statutoryPolicy: string;
  vetoThreshold?: number; // default: 0.70
}

export interface AdversarialEvaluationResult {
  tsi: number; // Trap Sensitivity Index [0, 1]
  bds: number; // Boundary Defense Score [0, 1]
  rss: number; // Rationale Soundness Score [0, 1]
  compositeScore: number; // [0, 100]
  disqualifiedByTrap: boolean;
  triggeredTraps: string[];
  missedTraps: string[];
  feedback: string;
}

export interface RubricCriterion {
  id: string;
  title: string;
  weight: number;
  description: string;
}

export interface NegativeAnchor {
  id: string;
  trapDescription: string;
  penaltyPoints: number;
  fatal: boolean;
}

export interface OracleDataClassA {
  expectedFormulas?: Record<string, { expectedValue: number; tolerance?: number }>;
  requiredChecklistItems?: string[];
  targetFields?: Record<string, { label: string; unit?: string; expectedValue: number; tolerance?: number }>;
  inputLabel?: string;
  unit?: string;
  placeholder?: string;
  checklist?: string[];
  checklistLabel?: string;
}

export interface OracleDataClassB {
  goldSolution: string;
  negativeAnchors: NegativeAnchor[];
  keyTakeaways: string[];
  submissionLabel?: string;
  submissionPlaceholder?: string;
}

export interface OracleDataClassC {
  rubric?: Array<{ id: string; name: string; maxScore: number; description?: string }>;
  expertGuidance?: string;
  checklist?: string[];
  submissionLabel?: string;
  submissionPlaceholder?: string;
}

export interface RoleBehaviorConfig {
  rolePersona?: string;
  guidingStyle?: string;
  dos?: string[];
  donts?: string[];
  focusAreas?: string[];
}

export interface OracleBehaviorConfig extends RoleBehaviorConfig {
  strictnessLevel?: 'moderate' | 'strict' | 'uncompromising';
  disqualificationKeywords?: string[];
}

export interface SocraticBehaviorConfig extends RoleBehaviorConfig {
  pedagogicalStyle?: 'dialectic' | 'first_principles' | 'regulatory_socratic' | 'scaffolded';
  antiSpoilerLevel?: 'standard' | 'strict' | 'absolute';
}

export interface OracleBehaviorExtension {
  oracleConfig?: OracleBehaviorConfig;
  socraticConfig?: SocraticBehaviorConfig;
}

export type OracleData = OracleDataClassA &
  Partial<OracleDataClassB> &
  Partial<OracleDataClassC> &
  Partial<OracleBehaviorExtension> &
  Record<string, any>;

export interface Task {
  id: string;
  competencyId: string;
  title: string;
  scenario: string;
  taskType: TaskType;
  scenarioVariantCode?: string;
  isIsomorphicVariant?: boolean;
  oracleData: OracleData;
  adversarialSpec?: AdversarialDilemmaSpec;
  rubricCriteria: RubricCriterion[];
  passingScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptDetail {
  criterionId: string;
  criterionTitle: string;
  passed: boolean;
  scoreAwarded: number;
  maxScore: number;
  reason: string;
}

export interface Attempt {
  id: string;
  taskId: string;
  userId: string;
  submission: Record<string, any>;
  score: number;
  feedback: string;
  assessedBy: string;
  oracleClassUsed: OracleClass;
  passed: boolean;
  isUnaided?: boolean;
  aiHintsUsedCount?: number;
  isPractice?: boolean;
  adversarialResult?: AdversarialEvaluationResult;
  conversationAudit?: LumisTranscriptBundle;
  conversationHash?: string;
  details?: {
    breakdown?: AttemptDetail[];
    detectedTraps?: string[];
    calculationDiscrepancies?: Array<{ field: string; expected: number; received: number }>;
    adversarialResult?: AdversarialEvaluationResult;
  };
  createdAt: string;
}

export interface CreateTaskDto {
  competencyId: string;
  title: string;
  scenario: string;
  taskType: TaskType;
  scenarioVariantCode?: string;
  isIsomorphicVariant?: boolean;
  oracleData: OracleData;
  adversarialSpec?: AdversarialDilemmaSpec;
  rubricCriteria: RubricCriterion[];
  passingScore?: number;
}

export interface EvaluateAttemptRequest {
  taskId: string;
  submission: Record<string, any>;
  isUnaided?: boolean;
  aiHintsUsedCount?: number;
  isPractice?: boolean;
  conversationAudit?: LumisTranscriptBundle;
}

export interface PostTaskFlashcard {
  front: string;
  back: string;
  category: string;
  remedyHint?: string;
}

export interface EvaluateAttemptResponse {
  attempt: Attempt;
  passed: boolean;
  unlockedCompetencyId?: string | null;
  generatedFlashcards: PostTaskFlashcard[];
}

export interface SocraticHintRequest {
  question: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>;
}

export interface SocraticCitationRef {
  sourceCode: string;
  locationTag: string;
  relevantPrinciple: string;
}

export interface SocraticTutorResponse {
  socraticGuidance: string;
  reflectiveQuestion: string;
  citationReferences: SocraticCitationRef[];
  suggestedAction: string;
}
