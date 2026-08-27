import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { z } from 'zod';
import { Role } from '@prisma/client';

const weightsSchema = z.object({
  ocrWeight: z.number().min(0).max(1),
  validationWeight: z.number().min(0).max(1),
  tamperingWeight: z.number().min(0).max(1),
  faceMatchWeight: z.number().min(0).max(1)
});

const router = Router();

router.get('/model-weights', authenticateJWT, AdminController.getModelWeights);
router.put('/model-weights', authenticateJWT, requireRoles([Role.ADMIN]), validateBody(weightsSchema), AdminController.updateModelWeights);

export default router;
