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
    return {
      httpOnly: true,
      secure: false, // Keep false for localhost
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      // DO NOT SET DOMAIN. Let the browser/Next.js handle it.
    };
  }
}