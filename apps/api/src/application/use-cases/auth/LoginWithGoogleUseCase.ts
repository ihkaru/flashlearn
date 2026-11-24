import type { IUserRepository } from '../../../domain/ports/IUserRepository';
import type { IGoogleVerifier } from '../../../domain/ports/IGoogleVerifier';
import type { ITokenService } from '../../../domain/ports/ITokenService';
import type { UserRole, AuthSessionResponse } from '@flashlearn/shared';

export interface LoginWithGoogleInput {
  credential: string;
}

export class LoginWithGoogleUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly googleVerifier: IGoogleVerifier,
    private readonly tokenService: ITokenService
  ) {}

  private getSuperadminEmails(): string[] {
    const raw = process.env.SUPERADMIN_EMAILS || '';
    return raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }

  async execute(input: LoginWithGoogleInput): Promise<AuthSessionResponse> {
    const profile = await this.googleVerifier.verifyIdToken(input.credential);

    let user = await this.userRepository.findByEmail(profile.email);

    const superadminEmails = this.getSuperadminEmails();
    const isSuper = superadminEmails.includes(profile.email.toLowerCase().trim());
    const role: UserRole = isSuper ? 'superadmin' : 'creator';

    if (!user) {
      user = await this.userRepository.create({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        role,
        googleId: profile.googleId,
      });
    } else if (isSuper && user.role !== 'superadmin') {
      await this.userRepository.updateRole(user.id, 'superadmin');
      user = await this.userRepository.findById(user.id);
    }

    if (!user) {
      throw new Error('Failed to retrieve or create user');
    }

    const token = this.tokenService.signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: user.toJSON(),
    };
  }
}
