"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.exchangeCode = exports.googleCallback = void 0;
const crypto_1 = require("crypto");
const auth_service_1 = require("../services/auth.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const env_1 = require("../config/env");
// In-memory one-time code store (single-instance; fine for Render free tier).
// Each entry lives for 60 seconds and is consumed on first use.
const pendingCodes = new Map();
function issueCode(token) {
    const code = (0, crypto_1.randomBytes)(32).toString('hex');
    pendingCodes.set(code, { token, expiresAt: Date.now() + 60000 });
    // Prune expired codes on each issue to prevent unbounded growth
    for (const [k, v] of pendingCodes) {
        if (v.expiresAt < Date.now())
            pendingCodes.delete(k);
    }
    return code;
}
/** GET /api/auth/google/callback */
exports.googleCallback = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const { accessToken } = auth_service_1.AuthService.issueTokensForUser(user, res);
    // Store the token server-side; send only a short-lived opaque code in the URL.
    // The frontend exchanges the code for the token via POST /api/auth/exchange-code.
    const code = issueCode(accessToken);
    res.redirect(`${env_1.env.frontendUrl}/auth/callback?code=${code}`);
});
/** POST /api/auth/exchange-code — one-time code → access token */
exports.exchangeCode = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
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
