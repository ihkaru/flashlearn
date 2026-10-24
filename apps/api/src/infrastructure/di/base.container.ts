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
import { DrizzleDiagnosticSessionRepository } from '../repositories/DrizzleDiagnosticSessionRepository';
import { DrizzleTaskAttemptReviewRepository } from '../repositories/DrizzleTaskAttemptReviewRepository';
import { DrizzleCredentialRepository } from '../repositories/DrizzleCredentialRepository';

import { JwtTokenService } from '../services/JwtTokenService';
import { GoogleAuthVerifier } from '../services/GoogleAuthVerifier';
import { AiGatewayService } from '../services/AiGatewayService';
import { CitationValidatorService } from '../services/CitationValidatorService';
import { CompetencyGraphEngine } from '../../domain/services/CompetencyGraphEngine';
import { DiagnosticPlacementEngine } from '../../application/engines/DiagnosticPlacementEngine';
import { MultiRaterConsensusEngine } from '../../domain/services/MultiRaterConsensusEngine';
import { CompetencyDriftEngine } from '../../domain/services/CompetencyDriftEngine';
import { W3cCredentialCryptoEngine } from '../../domain/services/W3cCredentialCryptoEngine';
import { OracleEvaluatorClassA } from '../../domain/services/OracleEvaluatorClassA';
import { OracleEvaluatorClassB } from '../../domain/services/OracleEvaluatorClassB';
import { OracleEvaluatorAdversarial } from '../../domain/services/OracleEvaluatorAdversarial';
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

export class BaseContainer {
  // Repositories
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
  public readonly diagnosticRepository = new DrizzleDiagnosticSessionRepository();
  public readonly reviewRepository = new DrizzleTaskAttemptReviewRepository();
  public readonly credentialRepository = new DrizzleCredentialRepository();

  // Services
  public readonly tokenService = new JwtTokenService();
  public readonly googleVerifier = new GoogleAuthVerifier();
  public readonly aiGateway = new AiGatewayService();
  public readonly citationValidator = new CitationValidatorService(this.sourceRepository);
  public readonly competencyGraphEngine = new CompetencyGraphEngine();
  public readonly diagnosticPlacementEngine = new DiagnosticPlacementEngine(this.taskRepository);
  public readonly multiRaterConsensusEngine = new MultiRaterConsensusEngine();
  public readonly competencyDriftEngine = new CompetencyDriftEngine();
  public readonly credentialCryptoEngine = new W3cCredentialCryptoEngine();
  public readonly oracleEvaluatorClassA = new OracleEvaluatorClassA();
  public readonly oracleEvaluatorClassB = new OracleEvaluatorClassB(this.aiGateway);
  public readonly oracleEvaluatorAdversarial = new OracleEvaluatorAdversarial(this.aiGateway);
  public readonly flashcardGenerator = new FlashcardGeneratorService();
  public readonly gateAuthorizationEngine = new GateAuthorizationEngine();
  public readonly spacedScheduler = new SpacedRepetitionScheduler();

  // Auth & Workspace Use Cases
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

  // Content & ApiKey Use Cases
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
}
