import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/query', authenticateJWT, ChatbotController.query);

export default router;
