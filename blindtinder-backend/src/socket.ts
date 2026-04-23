import { createServer, type Server as HttpServer } from 'node:http';

import { Server as SocketIOServer, type Socket } from 'socket.io';

import { verifyToken } from './utils/jwt.js';

type MatchSummary = {
  id: string;
  userIds: [string, string];
  createdAt: string;
};

type MessageSummary = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

type TypingSummary = {
  matchId: string;
  userId: string;
  isTyping: boolean;
};

let io: SocketIOServer | null = null;

export function initRealtime(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
  });

  io.use((socket, next) => {
    try {
      const token = String(socket.handshake.auth?.token || '').trim();
      if (!token) {
        return next(new Error('Missing token'));
      }

      const userId = verifyToken(token);
      socket.data.userId = userId;
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = String(socket.data.userId ?? '');
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('match:join', (matchId: string) => {
      if (matchId) {
        socket.join(`match:${matchId}`);
      }
    });

    socket.on('match:leave', (matchId: string) => {
      if (matchId) {
        socket.leave(`match:${matchId}`);
      }
    });

    socket.on('match:typing', ({ matchId, isTyping }: { matchId?: string; isTyping?: boolean }) => {
      if (!matchId) {
        return;
      }

      const typing: TypingSummary = {
        matchId,
        userId,
        isTyping: Boolean(isTyping),
      };

      io?.to(`match:${matchId}`).emit('match:typing', typing);
    });
  });

  return io;
}

export function emitMatchCreated(match: MatchSummary) {
  if (!io) return;

  io.to(`user:${match.userIds[0]}`).emit('match:created', { match });
  io.to(`user:${match.userIds[1]}`).emit('match:created', { match });
  io.to(`match:${match.id}`).emit('match:created', { match });
}

export function emitMessageCreated(matchId: string, message: MessageSummary) {
  if (!io) return;

  io.to(`match:${matchId}`).emit('message:created', { matchId, message });
}
