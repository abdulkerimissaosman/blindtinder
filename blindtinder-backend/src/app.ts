import cors from 'cors';
import express from 'express';

import { authRouter } from './routes/auth.js';
import { discoveryRouter } from './routes/discovery.js';
import { matchesRouter } from './routes/matches.js';
import { profileRouter } from './routes/profile.js';
import { swipesRouter } from './routes/swipes.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/auth', authRouter);
  app.use('/profile', profileRouter);
  app.use('/discovery', discoveryRouter);
  app.use('/swipes', swipesRouter);
  app.use('/matches', matchesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}