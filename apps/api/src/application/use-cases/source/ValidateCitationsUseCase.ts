import type { CitationValidatorService } from '../../../infrastructure/services/CitationValidatorService';
import type { VerifiedClaim, CitationValidationResult } from '@flashlearn/shared';

export class ValidateCitationsUseCase {
  constructor(private readonly validator: CitationValidatorService) {}

  async execute(claims: VerifiedClaim[]): Promise<CitationValidationResult> {
    return this.validator.validateClaims(claims);
  }
}
