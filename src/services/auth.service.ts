import { Response } from 'express';
import { UserModel } from '../models/user.model';
import { TokenService } from './token.service';

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: string;
}

export const AuthService = {
  /** Issue tokens for a given user and set refresh cookie. */
  issueTokensForUser(
    user: { id: string; email: string; name: string; avatar: string | null; provider: string },
    res: Response
  ): { accessToken: string; user: SafeUser } {
    const accessToken = TokenService.signAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = TokenService.signRefreshToken({ userId: user.id });

    res.cookie('refreshToken', refreshToken, TokenService.refreshCookieOptions());

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
      },
    };
  },

  /** Handle Google login: find or create the user. */
  async handleGoogleLogin(profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    return UserModel.upsertFromGoogle(profile);
  },

  /** Refresh an access token from a valid refresh token. */
  async refresh(refreshToken: string) {
    const { userId } = TokenService.verifyRefreshToken(refreshToken);
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  /** Clear the refresh cookie. */
  clearRefreshCookie(res: Response) {
    res.clearCookie('refreshToken', { path: '/' });
  },
};