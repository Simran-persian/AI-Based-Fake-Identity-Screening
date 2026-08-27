import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { z } from 'zod';
import { Role } from '@prisma/client';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 50,
  message: { success: false, message: 'Too many login attempts. Please try again later.' }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
  checkpointId: z.string().optional()
});

const router = Router();

router.post('/login', loginLimiter, validateBody(loginSchema), AuthController.login);
router.post('/register', authenticateJWT, requireRoles([Role.ADMIN]), validateBody(registerSchema), AuthController.register);
router.get('/me', authenticateJWT, AuthController.getMe);

export default router;
