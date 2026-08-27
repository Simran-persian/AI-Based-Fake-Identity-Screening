import { getIO } from '../config/socket';
import { logger } from '../utils/logger';

export function emitProgressEvent(sessionId: string, data: { step: string; status: string; progress: number; details?: any }) {
  try {
    const io = getIO();
    io.to(`session:${sessionId}`).emit(`progress:${sessionId}`, data);
    io.emit(`progress:${sessionId}`, data); // Also emit globally for officer UI listeners
    logger.info(`📡 Emitted progress:${sessionId} -> ${data.step} (${data.progress}%)`);
  } catch (err) {
    logger.warn(`Could not emit socket event progress:${sessionId}:`, err);
  }
}

export function emitQueueUpdateEvent(checkpointId: string, data: any) {
  try {
    const io = getIO();
    io.to('supervisors').emit('queue:update', { checkpointId, timestamp: new Date(), ...data });
    io.emit('queue:update', { checkpointId, timestamp: new Date(), ...data });
    logger.info(`📡 Emitted queue:update for checkpoint ${checkpointId}`);
  } catch (err) {
    logger.warn('Could not emit socket queue:update event:', err);
  }
}
