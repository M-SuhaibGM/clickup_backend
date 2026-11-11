import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createRouteHandler } from 'uploadthing/express';

import { env } from './config/env';
import './config/passport';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import { uploadRouter } from './uploadthing';

const app = express();

app.use(helmet());

app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const isProduction = env.nodeEnv === 'production';

// Session ONLY for the Passport Google OAuth handshake.
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// General API rate limiter
const apiLimiter = rateLimit({
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
app.use(
  '/api/uploadthing',
  createRouteHandler({ router: uploadRouter, config: {} })
);

// Apply general rate limit to all API routes
app.use('/api', apiLimiter);

app.use('/api', routes);

// 404 + errors
app.use(notFound);
app.use(errorHandler);

export default app;