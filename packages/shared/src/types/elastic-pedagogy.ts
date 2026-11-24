export type KnowledgeProfile =
  | 'micro_know'
  | 'bridging_understand'
  | 'procedural_do'
  | 'ill_structured_case';

export type ConfidenceLevel = 'sure' | 'unsure' | 'guessing';

export type CalibrationOutcome =
  | 'calibrated_mastery'
  | 'cautious_correct'
  | 'lucky_guess'
  | 'overconfident_misconception'
  | 'aware_gap';

/** Productive Failure (10-second micro-guess before seeing the breakdown) */
export interface QuickPredictionSpec {
  prompt: string;
  options: Array<{ id: string; text: string }>;
  revealsMisconception: string;
}

/** Mid-module Hinge Question (~20s comprehension checkpoint before complex formalization) */
export interface HingeCheckSpec {
  prompt: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
  }>;
  remediationCard: string;
  slideIndex?: number;
  slideEndIndex?: number;
}

/** Erroneous Example (McLaren & Mayer): find & fix the deliberate mistake */
export interface ErroneousExampleStep {
  stepNumber: number;
  label: string;
  content: string;
  isFlawed?: boolean;
}

export interface ErroneousExampleSpec {
  title: string;
  scenarioPrompt: string;
  steps: ErroneousExampleStep[];
  flawedStepNumber: number;
  fixOptions: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    rationale: string;
  }>;
  takeaway: string;
  slideIndex?: number;
  slideEndIndex?: number;
}

/** Ill-Structured / Horizontal Knowledge (Humanities, Law, Strategy, Ethics) */
export interface PerspectiveView {
  actorOrSchool: string;
  claim: string;
  supportingEvidence: string;
  blindSpot: string;
}

export interface CaseRubricCriterion {
  criterion: string;
  strongIndicator: string;
  weakIndicator: string;
}

export interface IllStructuredCaseSpec {
  dilemmaTitle: string;
  contextBrief: string;
  perspectives: PerspectiveView[];
  corroborationQuestion: string;
  rubricCriteria: CaseRubricCriterion[];
  slideIndex?: number;
  slideEndIndex?: number;
}

/** Explain-Back / Self-Explanation reflection at module closing */
export interface ExplainBackSpec {
  prompt: string;
  mode: 'select_causal_explanation' | 'short_self_explanation';
  referenceKeyPoints: string[];
  choices?: Array<{
    id: string;
    text: string;
    isStrong: boolean;
    feedback: string;
  }>;
  slideIndex?: number;
  slideEndIndex?: number;
}

/** Lightweight 3-step payload for simple / factual topics (2-3 min, zero forced overhead) */
export interface MicroKnowBlockSet {
  coreIdea: string;
  whyItMatters: string;
  concreteExamples: Array<{
    label: string;
    detail: string;
  }>;
  keyTakeaways: string[];
  slideIndex?: number;
  slideEndIndex?: number;
}

/** University lecture-style unit metadata (lossless slicing, max <= 120 min per unit) */
export interface UnitLectureMetadata {
  unitCode: string;
  unitTitle: string;
  unitOrder: number;
  moduleOrder: number;
  targetLectureMinutes?: number;
  sourceSliceIds?: string[];
}

export interface ConfidenceCalibrationStats {
  calibratedMastery: number;
  cautiousCorrect: number;
  luckyGuess: number;
  overconfidentMisconception: number;
  awareGap: number;
}

export type CurriculumScaleClass = 'S' | 'M' | 'L';

export type PlanModuleState =
  | 'planned'
  | 'sliced'
  | 'designed'
  | 'uila_ready'
  | 'deck_ready'
  | 'audited'
  | 'published';

export interface CorpusSourceEntry {
  sourceId: string;
  fileName: string;
  format: 'pdf' | 'epub' | 'pptx' | 'markdown' | 'text';
  title: string;
  sha256: string;
  totalUnits: number; // pages for PDF, spine chapters for EPUB, slides for PPTX
  estimatedTokens: number;
  visualTriagePages?: number[];
}

export interface CorpusSliceEntry {
  sliceId: string;
  sourceId: string;
  order: number;
  heading: string;
  locationTag: string;
  filePath: string;
  charCount: number;
  estimatedTokens: number;
  estimatedStudyMinutes: number;
  needsVlmTriage?: boolean;
  overlapHints?: string[];
}

export interface CorpusIndexDocument {
  schemaVersion: 'corpus-index-v1';
  createdAt: string;
  totalSources: number;
  totalSlices: number;
  totalEstimatedTokens: number;
  totalEstimatedStudyMinutes: number;
  recommendedScale: CurriculumScaleClass;
  sources: CorpusSourceEntry[];
  slices: CorpusSliceEntry[];
}

export interface PlanModuleEntry {
  slug: string;
  title: string;
  unitCode: string;
  moduleOrder: number;
  contentType?: 'interactive_module' | 'quiz';
  knowledgeProfile: KnowledgeProfile;
  estimatedMinutes: number;
  needsSlideDeck: boolean;
  sourceSliceIds: string[];
  prerequisites: string[];
  state: PlanModuleState;
  manifestPath?: string;
  deckPath?: string;
  simPath?: string;
  remoteContentId?: string;
  contentSha256?: string;
  lastUpdatedAt?: string;
  notes?: string;
}

export interface PlanUnitEntry {
  unitCode: string;
  unitTitle: string;
  unitOrder: number;
  summary: string;
  estimatedLectureMinutes: number; // enforced <= 120 minutes per lecture unit
  remoteDomainId?: string;
  moduleSlugs: string[];
}

export interface CurriculumPlanDocument {
  schemaVersion: 'curriculum-plan-v1';
  projectSlug: string;
  workspaceName: string;
  workspaceSlug: string;
  workspaceId?: string;
  scaleClass: CurriculumScaleClass;
  maxUnitMinutes: number;
  corpusIndexPath: string;
  createdAt: string;
  updatedAt: string;
  coverage: {
    totalSlices: number;
    mappedSlices: number;
    unmappedSliceIds: string[];
  };
  units: PlanUnitEntry[];
  modules: PlanModuleEntry[];
}
