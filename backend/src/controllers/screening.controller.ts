import { Request, Response, NextFunction } from 'express';
import { ScreeningService } from '../services/screening.service';
import { DocumentType, OfficerDecision, ScreeningStatus } from '@prisma/client';

export class ScreeningController {
  static async scan(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!files || !files['document'] || !files['document'][0]) {
        return res.status(400).json({ success: false, message: 'Document image file is required.' });
      }

      const documentFile = files['document'][0];
      const selfieFile = files['selfie'] ? files['selfie'][0] : documentFile; // fallback to document file if selfie missing

      const documentType = (req.body.documentType as DocumentType) || DocumentType.PASSPORT;
      const sessionId = req.body.sessionId || `session-${Date.now()}`;
      const officerId = req.user!.userId;
      const checkpointId = req.user!.checkpointId || 'ck-attari-wagah-01';

      const screeningResult = await ScreeningService.executeScanPipeline({
        officerId,
        checkpointId,
        documentType,
        rawDocumentUrl: `/uploads/${documentFile.filename}`,
        rawSelfieUrl: `/uploads/${selfieFile.filename}`,
        sessionId
      });

      return res.status(201).json({ success: true, screening: screeningResult });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const screening = await ScreeningService.getScreeningById(id);
      return res.json({ success: true, screening });
    } catch (err) {
      next(err);
    }
  }

  static async recordDecision(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { decision, remark } = req.body;
      const officerId = req.user!.userId;

      const updated = await ScreeningService.recordOfficerDecision({
        screeningId: id,
        officerId,
        decision: decision as OfficerDecision,
        remark
      });

      return res.json({ success: true, message: 'Officer decision recorded successfully.', screening: updated });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { checkpointId, status, from, to, page, limit } = req.query;

      const history = await ScreeningService.getScreeningHistory({
        checkpointId: checkpointId as string,
        status: status as ScreeningStatus,
        from: from as string,
        to: to as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10
      });

      return res.json({ success: true, ...history });
    } catch (err) {
      next(err);
    }
  }

  static async getLiveQueue(_req: Request, res: Response, next: NextFunction) {
    try {
      const queueData = await ScreeningService.getLiveProcessingQueue();
      return res.json({ success: true, queue: queueData });
    } catch (err) {
      next(err);
    }
  }
}
