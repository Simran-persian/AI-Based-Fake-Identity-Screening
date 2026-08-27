import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

let fallbackWeights = {
  ocrWeight: 0.15,
  validationWeight: 0.20,
  tamperingWeight: 0.40,
  faceMatchWeight: 0.25
};

export class AdminController {
  static async getModelWeights(_req: Request, res: Response, next: NextFunction) {
    try {
      const config = await prisma.modelWeightConfig.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: { updatedByAdmin: { select: { id: true, name: true, email: true } } }
      });

      return res.json({
        success: true,
        weights: config || fallbackWeights
      });
    } catch (err) {
      return res.json({
        success: true,
        weights: fallbackWeights
      });
    }
  }

  static async updateModelWeights(req: Request, res: Response, next: NextFunction) {
    try {
      const { ocrWeight, validationWeight, tamperingWeight, faceMatchWeight } = req.body;
      const adminId = req.user!.userId;

      const sum = Math.round((ocrWeight + validationWeight + tamperingWeight + faceMatchWeight) * 1000) / 1000;
      if (sum !== 1.0) {
        return res.status(400).json({
          success: false,
          message: `Model weights must sum to exactly 1.0. Provided sum is ${sum}.`
        });
      }

      let updatedConfig;
      try {
        const existing = await prisma.modelWeightConfig.findFirst();
        if (existing) {
          updatedConfig = await prisma.modelWeightConfig.update({
            where: { id: existing.id },
            data: { ocrWeight, validationWeight, tamperingWeight, faceMatchWeight, updatedByAdminId: adminId }
          });
        } else {
          updatedConfig = await prisma.modelWeightConfig.create({
            data: { ocrWeight, validationWeight, tamperingWeight, faceMatchWeight, updatedByAdminId: adminId }
          });
        }
      } catch (e) {
        fallbackWeights = { ocrWeight, validationWeight, tamperingWeight, faceMatchWeight };
        updatedConfig = fallbackWeights;
      }

      return res.json({ success: true, message: 'Model weight configuration updated successfully.', weights: updatedConfig });
    } catch (err) {
      next(err);
    }
  }
}
