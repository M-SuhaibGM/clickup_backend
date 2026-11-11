import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
}

export const TokenService = {
  signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.accessTokenSecret, {
      expiresIn: env.accessTokenExpires as any,
    });
  },

  signRefreshToken(payload: { userId: string }): string {
    return jwt.sign(payload, env.refreshTokenSecret, {
      expiresIn: env.refreshTokenExpires as any,
    });
  },

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.accessTokenSecret) as JwtPayload;
  },

  verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, env.refreshTokenSecret) as { userId: string };
  },

  refreshCookieOptions() {
    const isProduction = env.nodeEnv === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      // SameSite=None required for cross-origin XHR (Vercel frontend → Render backend).
      // SameSite=None also requires Secure=true, so use Lax in development.
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };
  }
}