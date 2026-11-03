import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';

/**
 * GET /api/auth/google
 * Redirects to Google's consent screen.
 * Handled by passport.authenticate in the router — not here.
 */

/**
 * GET /api/auth/google/callback
 * Passport has already attached `req.user` (SafeUser shape from passport strategy — we
 * only carry id/email in the "user", so we re-fetch via AuthService.refresh? No — we
 * rely on the strategy returning the full Prisma user. In passport.ts we pass the full
 * Prisma `user` object to `done(null, user)`. So req.user has id + email here.)
 */
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as any;

  // Issue access + refresh, set cookie
  const { accessToken } = AuthService.issueTokensForUser(user, res);

  // Redirect to frontend callback page with token in query
  // (For a production app, replace this with a one-time auth code exchange.)
  const redirectUrl = `${env.frontendUrl}/auth/callback?token=${accessToken}`;
  res.redirect(redirectUrl);
});

/** POST /api/auth/refresh */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  try {
    const user = await AuthService.refresh(refreshToken);
    const { accessToken } = AuthService.issueTokensForUser(user, res);
    res.json({ accessToken });
  } catch {
    AuthService.clearRefreshCookie(res);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  AuthService.clearRefreshCookie(res);
  res.json({ success: true });
});