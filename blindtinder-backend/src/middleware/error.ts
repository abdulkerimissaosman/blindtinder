import { NextFunction, Request, Response } from 'express';

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const message = error instanceof Error ? error.message : 'Internal server error';
  return res.status(500).json({ message });
}