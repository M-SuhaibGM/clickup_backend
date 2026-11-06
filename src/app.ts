import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import morgan from 'morgan';
import { createRouteHandler } from 'uploadthing/express'; // ← Import UploadThing

import { env } from './config/env';
import './config/passport';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error.middleware';
import { uploadRouter } from './uploadthing'; // ← Import your FileRouter

const app = express();

// Logging middleware
app.use(morgan('dev'));

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Session ONLY for the Passport Google OAuth handshake.
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

// ⚠️ UPLOADTHING: Mount this BEFORE your generic /api routes
app.use(
  '/api/uploadthing',
  createRouteHandler({
    router: uploadRouter,
    config: {
      // Token is loaded from process.env.UPLOADTHING_TOKEN automatically
      // You can also explicitly pass it here if needed:
      // token: process.env.UPLOADTHING_TOKEN,
    },
  })
);

// Your existing API
app.use('/api', routes);

// 404 + errors
app.use(notFound);
app.use(errorHandler);

export default app;