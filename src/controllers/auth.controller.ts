import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';

// In-memory one-time code store (single-instance; fine for Render free tier).
// Each entry lives for 60 seconds and is consumed on first use.
const pendingCodes = new Map<string, { token: string; expiresAt: number }>();

function issueCode(token: string): string {
  const code = randomBytes(32).toString('hex');
  pendingCodes.set(code, { token, expiresAt: Date.now() + 60_000 });
  // Prune expired codes on each issue to prevent unbounded growth
  for (const [k, v] of pendingCodes) {
    if (v.expiresAt < Date.now()) pendingCodes.delete(k);
  }
  return code;
}

/** GET /api/auth/google/callback */
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { accessToken } = AuthService.issueTokensForUser(user, res);

  // Store the token server-side; send only a short-lived opaque code in the URL.
  // The frontend exchanges the code for the token via POST /api/auth/exchange-code.
  const code = issueCode(accessToken);
  res.redirect(`${env.frontendUrl}/auth/callback?code=${code}`);
});

/** POST /api/auth/exchange-code — one-time code → access token */
export const exchangeCode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code' });
  }

  const entry = pendingCodes.get(code);
  pendingCodes.delete(code); // consume immediately (one-time use)

  if (!entry || entry.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Invalid or expired code' });
  }

  res.json({ accessToken: entry.token });
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