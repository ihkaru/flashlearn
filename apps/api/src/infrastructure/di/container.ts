import { DrizzleUserRepository } from '../repositories/DrizzleUserRepository';
import { DrizzleWorkspaceRepository } from '../repositories/DrizzleWorkspaceRepository';
import { DrizzleContentRepository } from '../repositories/DrizzleContentRepository';
import { DrizzleApiKeyRepository } from '../repositories/DrizzleApiKeyRepository';
import { DrizzleSourceRepository } from '../repositories/DrizzleSourceRepository';
import { DrizzleCompetencyRepository } from '../repositories/DrizzleCompetencyRepository';
import { DrizzleMasteryRepository } from '../repositories/DrizzleMasteryRepository';
import { DrizzleTaskRepository } from '../repositories/DrizzleTaskRepository';
import { DrizzleAttemptRepository } from '../repositories/DrizzleAttemptRepository';
import { DrizzleGateRepository } from '../repositories/DrizzleGateRepository';
import { DrizzleAuditLogRepository } from '../repositories/DrizzleAuditLogRepository';
import { DrizzleSpacedFlashcardRepository } from '../repositories/DrizzleSpacedFlashcardRepository';

import { JwtTokenService } from '../services/JwtTokenService';
import { GoogleAuthVerifier } from '../services/GoogleAuthVerifier';
import { AiGatewayService } from '../services/AiGatewayService';
import { CitationValidatorService } from '../services/CitationValidatorService';
import { CompetencyGraphEngine } from '../../domain/services/CompetencyGraphEngine';
import { OracleEvaluatorClassA } from '../../domain/services/OracleEvaluatorClassA';
import { OracleEvaluatorClassB } from '../../domain/services/OracleEvaluatorClassB';
import { FlashcardGeneratorService } from '../../domain/services/FlashcardGeneratorService';
import { GateAuthorizationEngine } from '../../domain/services/GateAuthorizationEngine';
import { SpacedRepetitionScheduler } from '../../domain/services/SpacedRepetitionScheduler';

import { LoginWithGoogleUseCase } from '../../application/use-cases/auth/LoginWithGoogleUseCase';
import { GetCurrentUserUseCase } from '../../application/use-cases/auth/GetCurrentUserUseCase';

import { CreateWorkspaceUseCase } from '../../application/use-cases/workspace/CreateWorkspaceUseCase';
import { ListWorkspacesUseCase } from '../../application/use-cases/workspace/ListWorkspacesUseCase';
import { GetWorkspaceByIdUseCase } from '../../application/use-cases/workspace/GetWorkspaceByIdUseCase';
import { UpdateWorkspaceUseCase } from '../../application/use-cases/workspace/UpdateWorkspaceUseCase';
import { DeleteWorkspaceUseCase } from '../../application/use-cases/workspace/DeleteWorkspaceUseCase';
import { RollbackWorkspaceUseCase } from '../../application/use-cases/workspace/RollbackWorkspaceUseCase';
import { RestoreWorkspaceUseCase } from '../../application/use-cases/workspace/RestoreWorkspaceUseCase';
import { ImportDomainBlueprintUseCase } from '../../application/use-cases/workspace/ImportDomainBlueprintUseCase';
import { DescribeDomainReadinessUseCase } from '../../application/use-cases/workspace/DescribeDomainReadinessUseCase';

import { CreateContentUseCase } from '../../application/use-cases/content/CreateContentUseCase';
import { ListContentsUseCase } from '../../application/use-cases/content/ListContentsUseCase';
import { GetContentByIdUseCase } from '../../application/use-cases/content/GetContentByIdUseCase';
import { UpdateContentUseCase } from '../../application/use-cases/content/UpdateContentUseCase';
import { DeleteContentUseCase } from '../../application/use-cases/content/DeleteContentUseCase';
import { SubmitQuizUseCase } from '../../application/use-cases/content/SubmitQuizUseCase';
import { GenerateFlashcardsUseCase } from '../../application/use-cases/content/GenerateFlashcardsUseCase';
import { CheckGuestNameUseCase } from '../../application/use-cases/content/CheckGuestNameUseCase';
import { RollbackContentUseCase } from '../../application/use-cases/content/RollbackContentUseCase';
import { RestoreContentUseCase } from '../../application/use-cases/content/RestoreContentUseCase';
import { ListContentVersionsUseCase } from '../../application/use-cases/content/ListContentVersionsUseCase';
import { GetSubmissionsUseCase } from '../../application/use-cases/content/GetSubmissionsUseCase';
import { ExportSubmissionsUseCase } from '../../application/use-cases/content/ExportSubmissionsUseCase';

import { CreateApiKeyUseCase } from '../../application/use-cases/apikey/CreateApiKeyUseCase';
import { ListApiKeysUseCase } from '../../application/use-cases/apikey/ListApiKeysUseCase';
import { RevokeApiKeyUseCase } from '../../application/use-cases/apikey/RevokeApiKeyUseCase';
import { VerifyApiKeyUseCase } from '../../application/use-cases/apikey/VerifyApiKeyUseCase';

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
import { ExportAuditBundleUseCase } from '../../application/use-cases/audit/ExportAuditBundleUseCase';

import { SupersedeSourceUseCase } from '../../application/use-cases/staleness/SupersedeSourceUseCase';
import { PracticeSpacedCardUseCase } from '../../application/use-cases/spaced/PracticeSpacedCardUseCase';
import { GetDueSpacedCardsUseCase } from '../../application/use-cases/spaced/GetDueSpacedCardsUseCase';

export class Container {
  // Repositories (Ports -> Driven Adapters)
  public readonly userRepository = new DrizzleUserRepository();
  public readonly workspaceRepository = new DrizzleWorkspaceRepository();
  public readonly contentRepository = new DrizzleContentRepository();
  public readonly apiKeyRepository = new DrizzleApiKeyRepository();
  public readonly sourceRepository = new DrizzleSourceRepository();
  public readonly competencyRepository = new DrizzleCompetencyRepository();
  public readonly masteryRepository = new DrizzleMasteryRepository();
  public readonly taskRepository = new DrizzleTaskRepository();
  public readonly attemptRepository = new DrizzleAttemptRepository();
  public readonly gateRepository = new DrizzleGateRepository();
  public readonly auditLogRepository = new DrizzleAuditLogRepository();
  public readonly spacedFlashcardRepository = new DrizzleSpacedFlashcardRepository();

  // Services
  public readonly tokenService = new JwtTokenService();
  public readonly googleVerifier = new GoogleAuthVerifier();
  public readonly aiGateway = new AiGatewayService();
  public readonly citationValidator = new CitationValidatorService(this.sourceRepository);
  public readonly competencyGraphEngine = new CompetencyGraphEngine();
  public readonly oracleEvaluatorClassA = new OracleEvaluatorClassA();
  public readonly oracleEvaluatorClassB = new OracleEvaluatorClassB(this.aiGateway);
  public readonly flashcardGenerator = new FlashcardGeneratorService();
  public readonly gateAuthorizationEngine = new GateAuthorizationEngine();
  public readonly spacedScheduler = new SpacedRepetitionScheduler();

  // Use Cases (Application Layer)
  public readonly loginWithGoogleUseCase = new LoginWithGoogleUseCase(
    this.userRepository,
    this.googleVerifier,
    this.tokenService
  );

  public readonly getCurrentUserUseCase = new GetCurrentUserUseCase(this.userRepository);

  public readonly createWorkspaceUseCase = new CreateWorkspaceUseCase(this.workspaceRepository);
  public readonly listWorkspacesUseCase = new ListWorkspacesUseCase(this.workspaceRepository);
  public readonly getWorkspaceByIdUseCase = new GetWorkspaceByIdUseCase(this.workspaceRepository);
  public readonly updateWorkspaceUseCase = new UpdateWorkspaceUseCase(this.workspaceRepository);
  public readonly deleteWorkspaceUseCase = new DeleteWorkspaceUseCase(this.workspaceRepository);
  public readonly rollbackWorkspaceUseCase = new RollbackWorkspaceUseCase(this.workspaceRepository);
  public readonly restoreWorkspaceUseCase = new RestoreWorkspaceUseCase(this.workspaceRepository);
  public readonly importDomainBlueprintUseCase = new ImportDomainBlueprintUseCase(
    this.workspaceRepository,
    this.sourceRepository,
    this.competencyRepository,
    this.gateRepository,
    this.taskRepository,
    this.competencyGraphEngine,
    this.auditLogRepository
  );
  public readonly describeDomainReadinessUseCase = new DescribeDomainReadinessUseCase(
    this.workspaceRepository,
    this.sourceRepository,
    this.competencyRepository,
    this.taskRepository,
    this.gateRepository,
    this.contentRepository,
    this.competencyGraphEngine
  );

  public readonly createContentUseCase = new CreateContentUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly listContentsUseCase = new ListContentsUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly getContentByIdUseCase = new GetContentByIdUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly updateContentUseCase = new UpdateContentUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly deleteContentUseCase = new DeleteContentUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly submitQuizUseCase = new SubmitQuizUseCase(this.contentRepository);
  public readonly generateFlashcardsUseCase = new GenerateFlashcardsUseCase(this.contentRepository);
  public readonly checkGuestNameUseCase = new CheckGuestNameUseCase();

  public readonly rollbackContentUseCase = new RollbackContentUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly restoreContentUseCase = new RestoreContentUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly listContentVersionsUseCase = new ListContentVersionsUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly getSubmissionsUseCase = new GetSubmissionsUseCase(
    this.contentRepository,
    this.workspaceRepository
  );
  public readonly exportSubmissionsUseCase = new ExportSubmissionsUseCase(
    this.contentRepository,
    this.workspaceRepository
  );

  public readonly createApiKeyUseCase = new CreateApiKeyUseCase(this.apiKeyRepository);
  public readonly listApiKeysUseCase = new ListApiKeysUseCase(this.apiKeyRepository);
  public readonly revokeApiKeyUseCase = new RevokeApiKeyUseCase(this.apiKeyRepository);
  public readonly verifyApiKeyUseCase = new VerifyApiKeyUseCase(
    this.apiKeyRepository,
    this.userRepository
  );

  // Phase 01: Source & Citation Use Cases
  public readonly ingestSourceUseCase = new IngestSourceUseCase(this.sourceRepository);
  public readonly validateCitationsUseCase = new ValidateCitationsUseCase(this.citationValidator);
  public readonly generateVerifiedLessonUseCase = new GenerateVerifiedLessonUseCase(
    this.sourceRepository,
    this.aiGateway,
    this.citationValidator
  );

  // Phase 02: Competency Graph & Mastery Use Cases
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

  // Phase 03: Task Bank & Multi-Tier Oracle Use Cases
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
    this.auditLogRepository
  );
  public readonly askSocraticTutorUseCase = new AskSocraticTutorUseCase(
    this.taskRepository,
    this.competencyRepository,
    this.sourceRepository,
    this.aiGateway,
    this.contentRepository
  );

  // Phase 04: Progressive Authorization Gates & Human Expert Use Cases
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

  // Phase 05: Staleness Engine & Spaced Repetition Use Cases
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
}

// Singleton DI instance
export const container = new Container();
