import { NextFunction, Request, Response } from 'express';

import { verifyToken } from '../utils/jwt.js';

export type AuthedRequest = Request & {
  userId?: string;
};

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing bearer token' });
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    req.userId = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}