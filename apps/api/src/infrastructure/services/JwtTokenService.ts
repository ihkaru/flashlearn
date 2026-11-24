import jwt from 'jsonwebtoken';
import type { ITokenService, TokenPayload } from '../../domain/ports/ITokenService';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;

  constructor(secret?: string) {
    const isTest = process.env.NODE_ENV === 'test';
    const resolved = secret !== undefined ? secret : process.env.JWT_SECRET;

    if (!resolved || resolved.length < 32) {
      if (isTest && secret === undefined) {
        this.secret = 'flashlearn-deterministic-test-jwt-secret-32b!';
      } else {
        throw new Error(
          'FATAL: JWT_SECRET must be set to at least 32 characters in non-test environments'
        );
      }
    } else {
      this.secret = resolved;
    }
  }

  signToken(payload: TokenPayload, expiresIn = '7d'): string {
    return jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
      expiresIn: expiresIn as any,
    });
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
      }) as TokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }
}
