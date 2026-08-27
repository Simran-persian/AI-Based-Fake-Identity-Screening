import { Router } from 'express';
import { ScreeningController } from '../controllers/screening.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { z } from 'zod';
import { Role, OfficerDecision } from '@prisma/client';

const decisionSchema = z.object({
  decision: z.nativeEnum(OfficerDecision),
  remark: z.string().optional()
});

const router = Router();

// Scanning endpoint (Officer role only)
router.post(
  '/scan',
  authenticateJWT,
  requireRoles([Role.OFFICER, Role.ADMIN]),
  uploadMiddleware,
  ScreeningController.scan
);

// Get single screening detail
router.get(
  '/:id',
  authenticateJWT,
  ScreeningController.getById
);

// Record officer decision
router.patch(
  '/:id/decision',
  authenticateJWT,
  requireRoles([Role.OFFICER, Role.SUPERVISOR, Role.ADMIN]),
  validateBody(decisionSchema),
  ScreeningController.recordDecision
);

// Screening history
router.get(
  '/history/list',
  authenticateJWT,
  ScreeningController.getHistory
);

export default router;
