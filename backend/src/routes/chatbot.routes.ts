import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller';

const router = Router();

router.post('/query', ChatbotController.query);

export default router;
