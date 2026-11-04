import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import morgan from 'morgan'; // ← Import Morgan

import { env } from './config/env';
import './config/passport';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error.middleware';

const app = express();

// Logging middleware
// 'dev' gives you colored logs (GET /api/users 200 15ms)
app.use(morgan('dev')); // ← Add this here

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Session ONLY for the Passport Google OAuth handshake.
// Once the token is issued, we no longer rely on it.
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.nodeEnv === 'production',
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 minutes
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'clickup-clone-api', env: env.nodeEnv });
});

// API
app.use('/api', routes);

// 404 + errors
app.use(notFound);
app.use(errorHandler);

export default app;