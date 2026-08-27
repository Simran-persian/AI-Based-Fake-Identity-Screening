import { Request, Response, NextFunction } from 'express';
import { WatchlistService } from '../services/watchlist.service';

export class WatchlistController {
  static async getWatchlist(_req: Request, res: Response, next: NextFunction) {
    try {
      const watchlist = await WatchlistService.getWatchlist();
      return res.json({ success: true, watchlist });
    } catch (err) {
      next(err);
    }
  }

  static async addEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const addedByAdminId = req.user!.userId;
      const entry = await WatchlistService.addWatchlistEntry({
        ...req.body,
        addedByAdminId
      });
      return res.status(201).json({ success: true, entry });
    } catch (err) {
      next(err);
    }
  }

  static async deleteEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await WatchlistService.deleteWatchlistEntry(id);
      return res.json({ success: true, message: 'Watchlist entry removed successfully.' });
    } catch (err) {
      next(err);
    }
  }
}
