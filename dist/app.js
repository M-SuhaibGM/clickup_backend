"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_2 = require("uploadthing/express");
const env_1 = require("./config/env");
require("./config/passport");
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const uploadthing_1 = require("./uploadthing");
const app = (0, express_1.default)();
// Trust the reverse proxy in front of the app (Render / Railway / Fly / Heroku / etc).
// Without this, Express sees the connection as HTTP (TLS is terminated at the proxy),
// so `req.secure` is false, `Secure: true` cookies refuse to set, and express-rate-limit
// cannot identify the real client IP. Required for cross-site cookies in production.
app.set('trust proxy', 1);
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)(env_1.env.nodeEnv === 'production' ? 'combined' : 'dev'));
// FRONTEND_URL may be a single origin or a comma-separated list — needed when
// there are preview deployments (e.g. Vercel preview URLs) or a staging URL.
const allowedOrigins = env_1.env.frontendUrl
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        // Allow same-origin / server-to-server requests (no Origin header) and
        // requests from any whitelisted frontend URL.
        if (!origin || allowedOrigins.includes(origin))
            return cb(null, true);
        return cb(new Error(`CORS: origin ${origin} is not allowed`));
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
const isProduction = env_1.env.nodeEnv === 'production';
// Session ONLY for the Passport Google OAuth handshake.
app.use((0, express_session_1.default)({
    secret: env_1.env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 10 * 60 * 1000, // 10 minutes
    },
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// General API rate limiter
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
// Health check — no env disclosure
app.get('/health', (_req, res) => {
    res.json({ status: 'OK' });
});
// UploadThing: mount before generic /api routes
app.use('/api/uploadthing', (0, express_2.createRouteHandler)({ router: uploadthing_1.uploadRouter, config: {} }));
// Apply general rate limit to all API routes
app.use('/api', apiLimiter);
app.use('/api', routes_1.default);
// 404 + errors
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
exports.default = app;
