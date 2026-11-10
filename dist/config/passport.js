"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const env_1 = require("./env");
const auth_service_1 = require("../services/auth.service");
const workspace_service_1 = require("../services/workspace.service"); // ← Import
const email_service_1 = require("../services/email.service"); // ← Import
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: env_1.env.googleClientId,
    clientSecret: env_1.env.googleClientSecret,
    callbackURL: env_1.env.googleCallbackUrl,
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email)
            return done(new Error('Google account has no email'));
        const user = await auth_service_1.AuthService.handleGoogleLogin({
            googleId: profile.id,
            email,
            name: profile.displayName || email.split('@')[0],
            avatar: profile.photos?.[0]?.value,
        });
        // Check if the user was created within the last 10 seconds (new signup)
        const isNewUser = new Date().getTime() - new Date(user.createdAt).getTime() < 10000;
        if (isNewUser) {
            // Create a default workspace using their first name
            const firstName = user.name.split(' ')[0];
            await workspace_service_1.WorkspaceService.create(user.id, `${firstName}'s Workspace`);
            // Fire the welcome email
            email_service_1.EmailService.sendWelcomeEmail(user.email, user.name);
        }
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
}));
// These are only for the OAuth handshake (session), not for API auth.
passport_1.default.serializeUser((user, done) => done(null, user.id));
passport_1.default.deserializeUser((id, done) => done(null, { id }));
exports.default = passport_1.default;
