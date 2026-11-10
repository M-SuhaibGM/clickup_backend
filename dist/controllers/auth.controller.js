"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.googleCallback = void 0;
const auth_service_1 = require("../services/auth.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const env_1 = require("../config/env");
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
exports.googleCallback = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    // Issue access + refresh, set cookie
    const { accessToken } = auth_service_1.AuthService.issueTokensForUser(user, res);
    // Redirect to frontend callback page with token in query
    // (For a production app, replace this with a one-time auth code exchange.)
    const redirectUrl = `${env_1.env.frontendUrl}/auth/callback?token=${accessToken}`;
    res.redirect(redirectUrl);
});
/** POST /api/auth/refresh */
exports.refresh = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken)
        return res.status(401).json({ error: 'No refresh token' });
    try {
        const user = await auth_service_1.AuthService.refresh(refreshToken);
        const { accessToken } = auth_service_1.AuthService.issueTokensForUser(user, res);
        res.json({ accessToken });
    }
    catch {
        auth_service_1.AuthService.clearRefreshCookie(res);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});
/** POST /api/auth/logout */
exports.logout = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    auth_service_1.AuthService.clearRefreshCookie(res);
    res.json({ success: true });
});
