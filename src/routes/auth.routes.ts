import { Router } from 'express';
import passport from 'passport';
import * as authController from '../controllers/auth.controller';
import { env } from '../config/env';

const router = Router();

// 1. Start Google OAuth flow
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// 2. Google redirects back here after consent
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.frontendUrl}/login?error=google_auth_failed`,
  }),
  authController.googleCallback
);

// 3. Exchange one-time OAuth code for access token
router.post('/exchange-code', authController.exchangeCode);

// 4. Refresh access token
router.post('/refresh', authController.refresh);

// 5. Logout
router.post('/logout', authController.logout);

export default router;