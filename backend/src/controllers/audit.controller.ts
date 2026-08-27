import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';

export class AuditController {
  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { screeningEventId } = req.query;
      const logs = await AuditService.getAuditLogs(screeningEventId as string);
      return res.json({ success: true, count: logs.length, logs });
    } catch (err) {
      next(err);
    }
  }

  static async verifyHashChain(_req: Request, res: Response, next: NextFunction) {
    try {
      const verification = await AuditService.verifyHashChain();
      return res.json({ success: true, verification });
    } catch (err) {
      next(err);
    }
  }
}
