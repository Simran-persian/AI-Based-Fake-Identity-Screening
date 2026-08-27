import { prisma } from '../config/db';
import crypto from 'crypto';

const fallbackAuditLogs: any[] = [];
const GENESIS_HASH = 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000';

export class AuditService {
  private static computeHash(previousHash: string, payload: any): string {
    const dataString = `${previousHash}:${JSON.stringify(payload)}`;
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  static async logEvent(data: {
    actorId: string;
    action: string;
    screeningEventId?: string;
    payload: any;
  }) {
    try {
      const latestAudit = await prisma.auditLog.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      const previousHash = latestAudit ? latestAudit.currentHash : GENESIS_HASH;
      const currentHash = this.computeHash(previousHash, data.payload);

      const auditEntry = await prisma.auditLog.create({
        data: {
          actorId: data.actorId,
          action: data.action,
          screeningEventId: data.screeningEventId || null,
          previousHash,
          currentHash,
          payload: data.payload
        }
      });

      return auditEntry;
    } catch (e) {
      const previousHash = fallbackAuditLogs.length > 0
        ? fallbackAuditLogs[fallbackAuditLogs.length - 1].currentHash
        : GENESIS_HASH;

      const currentHash = this.computeHash(previousHash, data.payload);
      const auditEntry = {
        id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        actorId: data.actorId,
        action: data.action,
        screeningEventId: data.screeningEventId || null,
        previousHash,
        currentHash,
        payload: data.payload,
        createdAt: new Date(),
        actor: { id: data.actorId, name: 'Officer R. Sharma', role: 'OFFICER', email: 'officer@sentry.gov.in' }
      };

      fallbackAuditLogs.push(auditEntry);
      return auditEntry;
    }
  }

  static async getAuditLogs(screeningEventId?: string) {
    try {
      const where = screeningEventId ? { screeningEventId } : {};
      return await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, name: true, role: true, email: true } },
          screeningEvent: { select: { id: true, documentType: true, riskScore: true } }
        }
      });
    } catch (e) {
      if (screeningEventId) {
        return fallbackAuditLogs.filter(l => l.screeningEventId === screeningEventId);
      }
      return [...fallbackAuditLogs].reverse();
    }
  }

  static async verifyHashChain(): Promise<{ intact: boolean; totalLogsVerified: number; brokenAtId: string | null; message: string }> {
    let logs: any[] = [];
    try {
      logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'asc' }
      });
    } catch (e) {
      logs = fallbackAuditLogs;
    }

    if (logs.length === 0) {
      return { intact: true, totalLogsVerified: 0, brokenAtId: null, message: 'Audit chain empty.' };
    }

    let expectedPrevHash = GENESIS_HASH;

    for (const log of logs) {
      if (log.previousHash !== expectedPrevHash) {
        return {
          intact: false,
          totalLogsVerified: logs.indexOf(log),
          brokenAtId: log.id,
          message: `Previous hash mismatch at AuditLog ID ${log.id}. Stored previous hash does not match expected chain.`
        };
      }

      const calculatedHash = this.computeHash(log.previousHash, log.payload);
      if (calculatedHash !== log.currentHash) {
        return {
          intact: false,
          totalLogsVerified: logs.indexOf(log),
          brokenAtId: log.id,
          message: `Payload tamper detected at AuditLog ID ${log.id}. Computed hash ${calculatedHash} !== Stored hash ${log.currentHash}.`
        };
      }

      expectedPrevHash = log.currentHash;
    }

    return {
      intact: true,
      totalLogsVerified: logs.length,
      brokenAtId: null,
      message: `Cryptographic hash chain intact. Verified ${logs.length} audit log entries with zero tampering.`
    };
  }
}
