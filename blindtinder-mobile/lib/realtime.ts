import { io, type Socket } from 'socket.io-client/dist/socket.io.js';

import { getApiBaseUrl } from '@/lib/api';

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

type MatchCreatedEvent = {
  match: MatchSummary;
};

type MessageCreatedEvent = {
  matchId: string;
  message: MessageSummary;
};

type TypingChangedEvent = {
  matchId: string;
  userId: string;
  isTyping: boolean;
};

let socket: Socket | null = null;

export function connectRealtime(token: string) {
  if (socket) {
    socket.disconnect();
  }

  socket = io(getApiBaseUrl(), {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
  });

  return socket;
}

export function disconnectRealtime() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

export function joinMatchRoom(matchId: string) {
  socket?.emit('match:join', matchId);
}

export function leaveMatchRoom(matchId: string) {
  socket?.emit('match:leave', matchId);
}

export function onMatchCreated(handler: (event: MatchCreatedEvent) => void) {
  socket?.on('match:created', handler);
  return () => socket?.off('match:created', handler);
}

export function onMessageCreated(handler: (event: MessageCreatedEvent) => void) {
  socket?.on('message:created', handler);
  return () => socket?.off('message:created', handler);
}

export function setTyping(matchId: string, isTyping: boolean) {
  socket?.emit('match:typing', { matchId, isTyping });
}

export function onTypingChanged(handler: (event: TypingChangedEvent) => void) {
  socket?.on('match:typing', handler);
  return () => socket?.off('match:typing', handler);
}

export function getRealtimeSocket() {
  return socket;
}