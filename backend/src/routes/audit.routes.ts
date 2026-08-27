import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticateJWT, AuditController.getAuditLogs);
router.get('/verify', authenticateJWT, requireRoles([Role.AUDITOR, Role.ADMIN, Role.SUPERVISOR]), AuditController.verifyHashChain);

export default router;
