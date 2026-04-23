import { Router } from 'express';

import { authRequired, AuthedRequest } from '../middleware/auth.js';
import { addMessageToMatch, getMatchById, getMatchesForUser, getMessagesForMatch, userIsInMatch } from '../repository.js';
import { emitMessageCreated } from '../socket.js';

const router = Router();

function getMatchIdParam(value: string | string[] | undefined) {
  const matchId = Array.isArray(value) ? value[0] : value;
  if (!matchId) {
    throw new Error('matchId is required');
  }
  return matchId;
}

router.get('/', authRequired, async (req, res, next) => {
  try {
    const authReq = req as AuthedRequest;
    if (!authReq.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const matches = await getMatchesForUser(authReq.userId);
    return res.json(matches);
  } catch (error) {
    return next(error);
  }
});

router.get('/:matchId/messages', authRequired, async (req, res, next) => {
  try {
    const authReq = req as AuthedRequest;
    if (!authReq.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const matchId = getMatchIdParam(req.params.matchId);
    const allowed = await userIsInMatch(authReq.userId, matchId);
    if (!allowed) {
      return res.status(403).json({ message: 'You are not part of this match' });
    }

    const messages = await getMessagesForMatch(matchId);
    return res.json(messages);
  } catch (error) {
    return next(error);
  }
});

router.post('/:matchId/messages', authRequired, async (req, res, next) => {
  try {
    const authReq = req as AuthedRequest;
    if (!authReq.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const matchId = getMatchIdParam(req.params.matchId);
    const { text } = req.body ?? {};
    if (!text?.trim()) {
      return res.status(400).json({ message: 'text is required' });
    }

    const allowed = await userIsInMatch(authReq.userId, matchId);
    if (!allowed) {
      return res.status(403).json({ message: 'You are not part of this match' });
    }

    const message = await addMessageToMatch(matchId, authReq.userId, text.trim());
    emitMessageCreated(matchId, message);
    return res.status(201).json(message);
  } catch (error) {
    return next(error);
  }
});

export { router as matchesRouter };