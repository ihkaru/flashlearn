import { OAuth2Client } from 'google-auth-library';
import type { IGoogleVerifier, GoogleUserProfile } from '../../domain/ports/IGoogleVerifier';

export class GoogleAuthVerifier implements IGoogleVerifier {
  private client: OAuth2Client;
  private clientId: string;

  constructor(
    clientId = process.env.GOOGLE_CLIENT_ID ||
      'your-google-client-id.apps.googleusercontent.com'
  ) {
    this.clientId = clientId;
    this.client = new OAuth2Client(clientId);
  }

  async verifyIdToken(idToken: string): Promise<GoogleUserProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid token payload: Email missing');
      }
      if (payload.email_verified !== true) {
        throw new Error('Google account email is not verified');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatar: payload.picture || null,
      };
    } catch (err: any) {
      throw new Error(`Google token verification failed: ${err.message}`);
    }
  }
}
