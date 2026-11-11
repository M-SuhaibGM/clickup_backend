"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const user_model_1 = require("../models/user.model");
const token_service_1 = require("./token.service");
const env_1 = require("../config/env");
exports.AuthService = {
    /** Issue tokens for a given user and set refresh cookie. */
    issueTokensForUser(user, res) {
        const accessToken = token_service_1.TokenService.signAccessToken({
            userId: user.id,
            email: user.email,
        });
        const refreshToken = token_service_1.TokenService.signRefreshToken({ userId: user.id });
        res.cookie('refreshToken', refreshToken, token_service_1.TokenService.refreshCookieOptions());
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
    /** Handle Google login: find or create the user. Returns {user, isNew}. */
    async handleGoogleLogin(profile) {
        return user_model_1.UserModel.upsertFromGoogle(profile);
    },
    /** Refresh an access token from a valid refresh token. */
    async refresh(refreshToken) {
        const { userId } = token_service_1.TokenService.verifyRefreshToken(refreshToken);
        const user = await user_model_1.UserModel.findById(userId);
        if (!user)
            throw new Error('User not found');
        return user;
    },
    /** Clear the refresh cookie.
     *  Browsers require the attributes on Set-Cookie to match the original cookie,
     *  otherwise the clear is ignored and the cookie sticks around until it expires. */
    clearRefreshCookie(res) {
        const isProduction = env_1.env.nodeEnv === 'production';
        res.clearCookie('refreshToken', {
            path: '/',
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
        });
    },
};
