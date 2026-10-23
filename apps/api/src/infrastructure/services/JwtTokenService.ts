import jwt from 'jsonwebtoken';
import type { ITokenService, TokenPayload } from '../../domain/ports/ITokenService';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;

  constructor(secret = process.env.JWT_SECRET || 'flashlearn-super-secret-jwt-key-2026-secure') {
    this.secret = secret;
  }

  signToken(payload: TokenPayload, expiresIn = '7d'): string {
    return jwt.sign(payload, this.secret, { expiresIn: expiresIn as any });
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }
}
