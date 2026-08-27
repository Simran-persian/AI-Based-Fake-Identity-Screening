import { Request, Response, NextFunction } from 'express';
import { ChatbotService } from '../services/chatbot.service';

export class ChatbotController {
  static async query(req: Request, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;
      const userId = req.user ? req.user.userId : undefined;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ success: false, message: 'Field "message" string is required.' });
      }

      const response = await ChatbotService.queryAI(message, userId);
      return res.json({ success: true, ...response });
    } catch (err) {
      next(err);
    }
  }
}
