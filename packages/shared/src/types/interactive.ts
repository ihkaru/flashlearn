export type GroundingMode =
  | 'experiential_anchor_bridge'
  | 'direct_analogy'
  | 'thought_experiment'
  | 'direct_formalism';

export interface GroundingDecision {
  mode: GroundingMode;
  priorKnowledgeAssumed: 'none' | 'partial' | 'familiar';
  setupCostSeconds: number;
  rationale: string;
}

export type NativeMicroLabKind =
  | 'mechanism_manipulator'
  | 'state_machine_sandbox'
  | 'wave_field_tapper'
  | 'bridge_morph_slider';

export interface MechanismSliderDef {
  id: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  initial: number;
}

export interface MechanismManipulatorConfig {
  kind: 'mechanism_manipulator';
  sliders: MechanismSliderDef[];
  /** Simple linear/ratio rule evaluated safely without eval */
  outputLabel: string;
  outputUnit?: string;
  relation: 'ratio' | 'product' | 'inverse_sum' | 'difference';
  targetHint: string;
  ahaThreshold?: { min?: number; max?: number };
}

export interface StateMachineActorAction {
  id: string;
  label: string;
  actor: string;
  fromStates: string[];
  toState: string;
  resultMessage: string;
  triggersAha?: boolean;
}

export interface StateMachineStateDef {
  id: string;
  label: string;
  description: string;
  tone?: 'neutral' | 'locked' | 'open' | 'warning';
}

export interface StateMachineSandboxConfig {
  kind: 'state_machine_sandbox';
  initialStateId: string;
  states: StateMachineStateDef[];
  actions: StateMachineActorAction[];
  requiredActionIdsForAha?: string[];
}

export interface WaveFieldTapperConfig {
  kind: 'wave_field_tapper';
  surfaceLabel: string;
  minTapsForAha: number;
  constructiveLabel: string;
  destructiveLabel: string;
  wavelengthPx?: number;
}

export interface BridgeMorphStage {
  label: string;
  description: string;
  preservedInvariant: string;
  isBreakpoint?: boolean;
}

export interface BridgeMorphSliderConfig {
  kind: 'bridge_morph_slider';
  stages: BridgeMorphStage[];
}

export type NativeMicroLabConfig =
  | MechanismManipulatorConfig
  | StateMachineSandboxConfig
  | WaveFieldTapperConfig
  | BridgeMorphSliderConfig;

export interface AnchoringLabSpec {
  labId: string;
  title: string;
  instructionPrompt: string;
  ahaObservation: string;
  timeToAhaSeconds: number;
  tier: 'native_primitive' | 'sandboxed_html';
  nativeKind?: NativeMicroLabKind;
  nativeConfig?: NativeMicroLabConfig;
  artifactKind?: 'anchoring_sim_html';
}

export interface StructuralMappingRow {
  anchorElement: string;
  targetConcept: string;
  whyItMatches: string;
}

export interface BridgingChainStep {
  stepTitle: string;
  bridgeScenario: string;
  invariantPreserved: string;
  structuralMapping: StructuralMappingRow[];
}

export interface AnalogyBreakpoint {
  whereItBreaks: string;
  realMechanismInstead: string;
}

export interface ContrastingCaseItem {
  beginnerMisconception: string;
  physicalReality: string;
}

export interface NotationTermItem {
  symbol: string;
  calloutLabel?: string;
  physicalMeaning: string;
}

export type DiagnosticAxis =
  | 'conceptGap'
  | 'missingPrerequisite'
  | 'notationBreakdown'
  | 'methodChoice'
  | 'reasoningBug';

export interface DiagnosticOption {
  optionId: string;
  text: string;
  isCorrect: boolean;
  diagnosticAxis?: DiagnosticAxis;
  causalRationale: string;
  specificRemediation?: string;
}

export interface HintLadder {
  level0Reflective: string;
  level1Directional: string;
  level2Constraint: string;
  level3WorkedExample: string;
}

export interface UilaStressTestBlock {
  probeType: 'prediction_what_if' | 'counterfactual' | 'boundary_limit' | 'transfer_bridge';
  prompt: string;
  options: DiagnosticOption[];
  hintLadder: HintLadder;
  groundTruth: string;
}

export interface UilaV2BlockSet {
  groundingDecision: GroundingDecision;
  block1_anomaly: {
    groundState: string;
    oldWay: string;
    breakdownPoint: string;
    slideIndex?: number;
  };
  block2_grounding: {
    anchoringLab?: AnchoringLabSpec;
    physicalObject?: string;
    isomorphicMapping?: string;
    thoughtExperimentSteps?: string[];
    bridgingChain?: BridgingChainStep[];
    analogyBreakpoint?: AnalogyBreakpoint;
    mermaidDiagram?: string;
    slideIndex?: number;
  };
  block3_coreMechanics: {
    invariantProperty: string;
    variableComponents: string[];
    contrastingCases: ContrastingCaseItem[];
    mermaidDiagram?: string;
    slideIndex?: number;
  };
  block4_notationContract: {
    formulaOrCode: string;
    minimalFormalization: string;
    termsDeconstruction: NotationTermItem[];
    workedExampleSummary?: string;
    slideIndex?: number;
  };
  block5_stressTest: UilaStressTestBlock;
}

export interface SlideNoteItem {
  id: string;
  index: number;
  title: string;
  section?: string;
  purpose?: string;
  talk: string[];
  transition?: string;
  linkedStepId?: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  highSchoolAnchor?: string;
}

export interface InteractiveModulePayload {
  schemaVersion: 'uila-v2';
  estimatedMinutes: number;
  learningObjective: string;
  uila: UilaV2BlockSet;
  slideNotes?: SlideNoteItem[];
  glossary?: GlossaryTerm[];
  sourceCitations?: Array<{
    sourceRef: string;
    locationTag: string;
    verbatimQuote?: string;
  }>;
}

export type ContentArtifactKind = 'slide_deck_html' | 'anchoring_sim_html';

export interface ContentArtifactMetadata {
  slideCount?: number;
  lang?: string;
  style?: string;
  mediaUrls?: string[];
  extractedNotesCount?: number;
}

export interface ContentArtifact {
  id: string;
  contentId: string;
  kind: ContentArtifactKind;
  mimeType: string;
  htmlContent: string;
  sha256Hash: string;
  byteSize: number;
  metadata?: ContentArtifactMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export type GuidedStepKind =
  | 'anomaly'
  | 'anchoring_lab'
  | 'bridging'
  | 'thought_experiment'
  | 'mechanics'
  | 'notation'
  | 'stress_test'
  | 'summary';

export interface GuidedLearningStep {
  id: string;
  kind: GuidedStepKind;
  stepNumber: number;
  totalSteps: number;
  title: string;
  actionPrompt: string;
  requiresInteraction: boolean;
  slideIndex?: number;
}

export interface LossVector {
  conceptGap: number;
  missingPrerequisite: number;
  notationBreakdown: number;
  methodChoice: number;
  reasoningBug: number;
}

export interface DiagnosticEvaluationResult {
  isCorrect: boolean;
  lossScore: number;
  lossVector: LossVector;
  selectedOption: DiagnosticOption;
  nextTheta: number;
  mastered: boolean;
}

export interface LearnerContentProgress {
  id?: string;
  contentId: string;
  userId?: string | null;
  sessionKey?: string | null;
  currentStepIndex: number;
  totalSteps: number;
  currentSlideIndex: number;
  completedStepIds: string[];
  anchoringCompleted: boolean;
  diagnosticAttempts: number;
  lastLossScore: number | null;
  lossVector: LossVector | null;
  thetaMastery: number;
  isCompleted: boolean;
  dailyActivityLog: Record<string, { stepsCompleted: number; probesSolved: number }>;
  updatedAt: string;
}

export interface SaveLearnerProgressRequest {
  sessionKey?: string;
  currentStepIndex: number;
  totalSteps: number;
  currentSlideIndex: number;
  completedStepIds: string[];
  anchoringCompleted: boolean;
  diagnosticAttempts: number;
  lastLossScore?: number | null;
  lossVector?: LossVector | null;
  thetaMastery: number;
  isCompleted: boolean;
  incrementStepsToday?: number;
  incrementProbesToday?: number;
}
