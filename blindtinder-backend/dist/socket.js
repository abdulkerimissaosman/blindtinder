import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from './utils/jwt.js';
let io = null;
export function initRealtime(httpServer) {
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
        }
        catch {
            return next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const userId = String(socket.data.userId ?? '');
        if (userId) {
            socket.join(`user:${userId}`);
        }
        socket.on('match:join', (matchId) => {
            if (matchId) {
                socket.join(`match:${matchId}`);
            }
        });
        socket.on('match:leave', (matchId) => {
            if (matchId) {
                socket.leave(`match:${matchId}`);
            }
        });
    });
    return io;
}
export function emitMatchCreated(match) {
    if (!io)
        return;
    io.to(`user:${match.userIds[0]}`).emit('match:created', { match });
    io.to(`user:${match.userIds[1]}`).emit('match:created', { match });
    io.to(`match:${match.id}`).emit('match:created', { match });
}
export function emitMessageCreated(matchId, message) {
    if (!io)
        return;
    io.to(`match:${matchId}`).emit('message:created', { matchId, message });
}
