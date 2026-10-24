import { BaseContainer } from './base.container';

import { IngestSourceUseCase } from '../../application/use-cases/source/IngestSourceUseCase';
import { ValidateCitationsUseCase } from '../../application/use-cases/source/ValidateCitationsUseCase';
import { GenerateVerifiedLessonUseCase } from '../../application/use-cases/source/GenerateVerifiedLessonUseCase';

import { CreateCompetencyNodeUseCase } from '../../application/use-cases/competency/CreateCompetencyNodeUseCase';
import { LinkPrerequisiteUseCase } from '../../application/use-cases/competency/LinkPrerequisiteUseCase';
import { GetCompetencyGraphUseCase } from '../../application/use-cases/competency/GetCompetencyGraphUseCase';
import { ApproveCompetencyUseCase } from '../../application/use-cases/competency/ApproveCompetencyUseCase';

import { CreateTaskUseCase } from '../../application/use-cases/task/CreateTaskUseCase';
import { EvaluateAttemptUseCase } from '../../application/use-cases/task/EvaluateAttemptUseCase';
import { AskSocraticTutorUseCase } from '../../application/use-cases/task/AskSocraticTutorUseCase';

import { CreateGateUseCase } from '../../application/use-cases/gate/CreateGateUseCase';
import { EvaluateAndGrantGateUseCase } from '../../application/use-cases/gate/EvaluateAndGrantGateUseCase';
import { ReviewClassCAttemptUseCase } from '../../application/use-cases/gate/ReviewClassCAttemptUseCase';
import { ListPendingClassCReviewsUseCase } from '../../application/use-cases/gate/ListPendingClassCReviewsUseCase';
import { VerifyPublicPassportUseCase } from '../../application/use-cases/gate/VerifyPublicPassportUseCase';

import { SupersedeSourceUseCase } from '../../application/use-cases/staleness/SupersedeSourceUseCase';
import { PracticeSpacedCardUseCase } from '../../application/use-cases/spaced/PracticeSpacedCardUseCase';
import { GetDueSpacedCardsUseCase } from '../../application/use-cases/spaced/GetDueSpacedCardsUseCase';

import { ExportAuditBundleUseCase } from '../../application/use-cases/audit/ExportAuditBundleUseCase';

import { StartDiagnosticSessionUseCase } from '../../application/use-cases/diagnostic/StartDiagnosticSessionUseCase';
import { GetNextDiagnosticProbeUseCase } from '../../application/use-cases/diagnostic/GetNextDiagnosticProbeUseCase';
import { SubmitDiagnosticProbeUseCase } from '../../application/use-cases/diagnostic/SubmitDiagnosticProbeUseCase';

import { AssignBlindReviewersUseCase } from '../../application/use-cases/consensus/AssignBlindReviewersUseCase';
import { GetBlindReviewByTokenUseCase } from '../../application/use-cases/consensus/GetBlindReviewByTokenUseCase';
import { SubmitBlindReviewUseCase } from '../../application/use-cases/consensus/SubmitBlindReviewUseCase';
import { ResolveArbitrationUseCase } from '../../application/use-cases/consensus/ResolveArbitrationUseCase';

import { ProcessCompetencyDecayBatchUseCase } from '../../application/use-cases/drift/ProcessCompetencyDecayBatchUseCase';
import { AuditCompetencyDriftUseCase } from '../../application/use-cases/drift/AuditCompetencyDriftUseCase';
import { RevalidateCompetencyChallengeUseCase } from '../../application/use-cases/drift/RevalidateCompetencyChallengeUseCase';

import { IssueVerifiableCredentialUseCase } from '../../application/use-cases/credentials/IssueVerifiableCredentialUseCase';
import { VerifyVerifiableCredentialUseCase } from '../../application/use-cases/credentials/VerifyVerifiableCredentialUseCase';

export class Container extends BaseContainer {
  // Phase 01: Source & Citation
  public readonly ingestSourceUseCase = new IngestSourceUseCase(this.sourceRepository);
  public readonly validateCitationsUseCase = new ValidateCitationsUseCase(this.citationValidator);
  public readonly generateVerifiedLessonUseCase = new GenerateVerifiedLessonUseCase(
    this.sourceRepository,
    this.aiGateway,
    this.citationValidator
  );

  // Phase 02: Competency Graph & Mastery
  public readonly createCompetencyNodeUseCase = new CreateCompetencyNodeUseCase(
    this.competencyRepository,
    this.competencyGraphEngine
  );
  public readonly linkPrerequisiteUseCase = new LinkPrerequisiteUseCase(
    this.competencyRepository,
    this.competencyGraphEngine
  );
  public readonly getCompetencyGraphUseCase = new GetCompetencyGraphUseCase(
    this.competencyRepository,
    this.masteryRepository,
    this.competencyGraphEngine
  );
  public readonly approveCompetencyUseCase = new ApproveCompetencyUseCase(this.competencyRepository);

  // Phase 03 & 06: Task Bank, Evaluation & Socratic Tutor
  public readonly createTaskUseCase = new CreateTaskUseCase(
    this.taskRepository,
    this.competencyRepository
  );
  public readonly evaluateAttemptUseCase = new EvaluateAttemptUseCase(
    this.taskRepository,
    this.attemptRepository,
    this.competencyRepository,
    this.masteryRepository,
    this.oracleEvaluatorClassA,
    this.oracleEvaluatorClassB,
    this.flashcardGenerator,
    this.competencyGraphEngine,
    this.auditLogRepository,
    this.oracleEvaluatorAdversarial
  );
  public readonly askSocraticTutorUseCase = new AskSocraticTutorUseCase(
    this.taskRepository,
    this.competencyRepository,
    this.sourceRepository,
    this.contentRepository,
    this.aiGateway
  );

  // Phase 04 & 08: Progressive Gates & Passports
  public readonly createGateUseCase = new CreateGateUseCase(this.gateRepository);
  public readonly evaluateAndGrantGateUseCase = new EvaluateAndGrantGateUseCase(
    this.gateRepository,
    this.competencyRepository,
    this.masteryRepository,
    this.attemptRepository,
    this.auditLogRepository,
    this.gateAuthorizationEngine
  );
  public readonly reviewClassCAttemptUseCase = new ReviewClassCAttemptUseCase(
    this.attemptRepository,
    this.taskRepository,
    this.competencyRepository,
    this.masteryRepository,
    this.auditLogRepository
  );
  public readonly listPendingClassCReviewsUseCase = new ListPendingClassCReviewsUseCase(
    this.attemptRepository,
    this.taskRepository,
    this.competencyRepository,
    this.userRepository
  );
  public readonly verifyPublicPassportUseCase = new VerifyPublicPassportUseCase(
    this.gateRepository,
    this.userRepository,
    this.workspaceRepository
  );

  // Phase 05: Staleness & Spaced Repetition
  public readonly supersedeSourceUseCase = new SupersedeSourceUseCase(
    this.sourceRepository,
    this.competencyRepository,
    this.masteryRepository,
    this.gateRepository,
    this.auditLogRepository
  );
  public readonly practiceSpacedCardUseCase = new PracticeSpacedCardUseCase(
    this.spacedFlashcardRepository,
    this.spacedScheduler
  );
  public readonly getDueSpacedCardsUseCase = new GetDueSpacedCardsUseCase(
    this.spacedFlashcardRepository
  );

  // Phase 07: Regulatory Compliance Bundle Exporter
  public readonly exportAuditBundleUseCase = new ExportAuditBundleUseCase(
    this.workspaceRepository,
    this.auditLogRepository,
    this.sourceRepository,
    this.gateRepository
  );

  // Phase 12: Adaptive Topological Diagnostic Placement
  public readonly startDiagnosticSessionUseCase = new StartDiagnosticSessionUseCase(
    this.diagnosticRepository,
    this.competencyRepository,
    this.workspaceRepository,
    this.diagnosticPlacementEngine
  );
  public readonly getNextDiagnosticProbeUseCase = new GetNextDiagnosticProbeUseCase(
    this.diagnosticRepository,
    this.competencyRepository,
    this.diagnosticPlacementEngine
  );
  public readonly submitDiagnosticProbeUseCase = new SubmitDiagnosticProbeUseCase(
    this.diagnosticRepository,
    this.competencyRepository,
    this.masteryRepository,
    this.diagnosticPlacementEngine,
    this.evaluateAttemptUseCase
  );

  // Phase 13: Double-Blind Multi-Rater Consensus
  public readonly assignBlindReviewersUseCase = new AssignBlindReviewersUseCase(
    this.reviewRepository,
    this.attemptRepository
  );
  public readonly getBlindReviewByTokenUseCase = new GetBlindReviewByTokenUseCase(
    this.reviewRepository,
    this.attemptRepository,
    this.taskRepository
  );
  public readonly submitBlindReviewUseCase = new SubmitBlindReviewUseCase(
    this.reviewRepository,
    this.attemptRepository,
    this.taskRepository,
    this.masteryRepository,
    this.multiRaterConsensusEngine
  );
  public readonly resolveArbitrationUseCase = new ResolveArbitrationUseCase(
    this.reviewRepository,
    this.attemptRepository,
    this.taskRepository,
    this.masteryRepository,
    this.multiRaterConsensusEngine
  );

  // Phase 14: Predictive Competency Drift & Micro-Revalidation
  public readonly processCompetencyDecayBatchUseCase = new ProcessCompetencyDecayBatchUseCase(
    this.masteryRepository,
    this.gateRepository,
    this.auditLogRepository,
    this.competencyDriftEngine
  );
  public readonly auditCompetencyDriftUseCase = new AuditCompetencyDriftUseCase(
    this.competencyRepository,
    this.masteryRepository,
    this.competencyDriftEngine
  );
  public readonly revalidateCompetencyChallengeUseCase = new RevalidateCompetencyChallengeUseCase(
    this.masteryRepository,
    this.competencyDriftEngine
  );

  // Phase 16: Cryptographic Verifiable Credentials & OpenBadges 3.0
  public readonly issueVerifiableCredentialUseCase = new IssueVerifiableCredentialUseCase(
    this.gateRepository,
    this.competencyRepository,
    this.masteryRepository,
    this.userRepository,
    this.workspaceRepository,
    this.credentialRepository,
    this.credentialCryptoEngine,
    this.competencyDriftEngine
  );
  public readonly verifyVerifiableCredentialUseCase = new VerifyVerifiableCredentialUseCase(
    this.credentialRepository,
    this.credentialCryptoEngine
  );
}

// Singleton DI instance
export const container = new Container();
