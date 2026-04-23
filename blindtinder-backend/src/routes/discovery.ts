import { Router } from 'express';

import { authRequired, AuthedRequest } from '../middleware/auth.js';
import { getDiscoveryUsers } from '../repository.js';

const router = Router();

router.get('/', authRequired, async (req, res, next) => {
  try {
    const authReq = req as AuthedRequest;
    if (!authReq.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const users = await getDiscoveryUsers(authReq.userId);
    return res.json(users);
  } catch (error) {
    return next(error);
  }
});

export { router as discoveryRouter };