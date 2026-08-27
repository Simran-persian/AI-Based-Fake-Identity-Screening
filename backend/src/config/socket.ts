import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    socket.on('joinSession', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      logger.info(`Socket ${socket.id} joined session:${sessionId}`);
    });

    socket.on('joinSupervisor', () => {
      socket.join('supervisors');
      logger.info(`Socket ${socket.id} joined supervisors channel`);
    });

    socket.on('disconnect', () => {
      logger.info(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io server not initialized');
  }
  return io;
}
