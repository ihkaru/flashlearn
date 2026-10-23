import type { ISourceRepository } from '../../domain/ports/ISourceRepository';
import type {
  VerifiedClaim,
  CitationValidationResult,
  CitationValidationDetail,
} from '@flashlearn/shared';

export class CitationValidatorService {
  constructor(private readonly sourceRepo: ISourceRepository) {}

  async validateClaim(claim: VerifiedClaim): Promise<CitationValidationDetail> {
    if (!claim.sourceCode || !claim.locationTag) {
      return {
        ...claim,
        isValid: false,
        error: 'Missing required sourceCode or locationTag',
      };
    }

    if (!claim.directQuote || claim.directQuote.trim().length === 0) {
      return {
        ...claim,
        isValid: false,
        error: 'Missing required verbatim directQuote',
      };
    }

    const chunk = await this.sourceRepo.findChunk(claim.sourceCode, claim.locationTag);
    if (!chunk) {
      return {
        ...claim,
        isValid: false,
        error: `Unverifiable reference: [${claim.sourceCode}] ${claim.locationTag} not found in Corpus of Record`,
      };
    }

    const isMatch = chunk.containsNormalizedQuote(claim.directQuote);
    if (!isMatch) {
      return {
        ...claim,
        isValid: false,
        error: `Citation hallucination: quote was not found in registered text for ${claim.locationTag}`,
      };
    }

    return {
      ...claim,
      isValid: true,
    };
  }

  async validateClaims(claims: VerifiedClaim[]): Promise<CitationValidationResult> {
    if (!claims || claims.length === 0) {
      return {
        isValid: false,
        totalClaims: 0,
        validClaims: 0,
        invalidClaims: 0,
        details: [],
      };
    }

    const details: CitationValidationDetail[] = [];
    let validCount = 0;

    for (const claim of claims) {
      const detail = await this.validateClaim(claim);
      details.push(detail);
      if (detail.isValid) {
        validCount++;
      }
    }

    const invalidCount = claims.length - validCount;

    return {
      isValid: invalidCount === 0,
      totalClaims: claims.length,
      validClaims: validCount,
      invalidClaims: invalidCount,
      details,
    };
  }
}
