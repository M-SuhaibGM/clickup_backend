"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
exports.TokenService = {
    signAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, env_1.env.accessTokenSecret, {
            expiresIn: env_1.env.accessTokenExpires,
        });
    },
    signRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, env_1.env.refreshTokenSecret, {
            expiresIn: env_1.env.refreshTokenExpires,
        });
    },
    verifyAccessToken(token) {
        return jsonwebtoken_1.default.verify(token, env_1.env.accessTokenSecret);
    },
    verifyRefreshToken(token) {
        return jsonwebtoken_1.default.verify(token, env_1.env.refreshTokenSecret);
    },
    refreshCookieOptions() {
        return {
            httpOnly: true,
            secure: false, // Keep false for localhost
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
            // DO NOT SET DOMAIN. Let the browser/Next.js handle it.
        };
    }
};
