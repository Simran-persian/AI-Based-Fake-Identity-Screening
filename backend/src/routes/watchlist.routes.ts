import { Router } from 'express';
import { WatchlistController } from '../controllers/watchlist.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { z } from 'zod';
import { Role } from '@prisma/client';

const watchlistSchema = z.object({
  fullName: z.string().min(2),
  documentNumber: z.string().min(3),
  nationality: z.string().length(3),
  reason: z.string().min(3)
});

const router = Router();

router.get('/', authenticateJWT, WatchlistController.getWatchlist);
router.post('/', authenticateJWT, requireRoles([Role.ADMIN]), validateBody(watchlistSchema), WatchlistController.addEntry);
router.delete('/:id', authenticateJWT, requireRoles([Role.ADMIN]), WatchlistController.deleteEntry);

export default router;
