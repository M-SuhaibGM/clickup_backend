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
const express_2 = require("uploadthing/express"); // ← Import UploadThing
const env_1 = require("./config/env");
require("./config/passport");
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const uploadthing_1 = require("./uploadthing"); // ← Import your FileRouter
const app = (0, express_1.default)();
// Logging middleware
app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)({
    origin: env_1.env.frontendUrl,
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Session ONLY for the Passport Google OAuth handshake.
app.use((0, express_session_1.default)({
    secret: env_1.env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: env_1.env.nodeEnv === 'production',
        httpOnly: true,
        maxAge: 10 * 60 * 1000, // 10 minutes
    },
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', service: 'clickup-clone-api', env: env_1.env.nodeEnv });
});
// ⚠️ UPLOADTHING: Mount this BEFORE your generic /api routes
app.use('/api/uploadthing', (0, express_2.createRouteHandler)({
    router: uploadthing_1.uploadRouter,
    config: {
    // Token is loaded from process.env.UPLOADTHING_TOKEN automatically
    // You can also explicitly pass it here if needed:
    // token: process.env.UPLOADTHING_TOKEN,
    },
}));
// Your existing API
app.use('/api', routes_1.default);
// 404 + errors
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
exports.default = app;
