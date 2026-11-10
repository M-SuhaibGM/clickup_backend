"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const token_service_1 = require("../services/token.service");
const user_service_1 = require("../services/user.service");
const requireAuth = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing access token' });
        }
        const token = header.slice('Bearer '.length);
        const payload = token_service_1.TokenService.verifyAccessToken(token);
        const user = await user_service_1.UserService.getSafeUser(payload.userId);
        if (!user)
            return res.status(401).json({ error: 'User not found' });
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            provider: user.provider,
        };
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.requireAuth = requireAuth;
