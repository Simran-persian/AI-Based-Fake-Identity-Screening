import { prisma } from '../config/db';

const seededWatchlist = [
  { id: 'wl-01', fullName: 'Aarav Sharma', documentNumber: 'Z4091823', nationality: 'IND', reason: 'Interpol Red Notice #2026-IND-991 - Forged Indian Passport Stamp & Identity Theft', createdAt: new Date() },
  { id: 'wl-02', fullName: 'Vikramaditya Singh', documentNumber: 'P9920144', nationality: 'IND', reason: 'Stolen Passport Registry Alert - Counterfeit MRZ Data', createdAt: new Date() },
  { id: 'wl-03', fullName: 'Pavel Novak', documentNumber: 'C40217755', nationality: 'CZE', reason: 'Altered Visa Stamp & Counterfeit Entry Permit', createdAt: new Date() },
  { id: 'wl-04', fullName: 'Priya Patel', documentNumber: 'M8820194', nationality: 'IND', reason: 'Watchlist Flag - Font Irregularity & Tampered Laminate', createdAt: new Date() },
  { id: 'wl-05', fullName: 'Rajesh Kumar', documentNumber: 'K4019285', nationality: 'IND', reason: 'Suspected Facial Biometric Impersonation & Multiple Alias', createdAt: new Date() }
];

export class WatchlistService {
  static async getWatchlist() {
    try {
      return await prisma.watchlistEntry.findMany({
        orderBy: { createdAt: 'desc' },
        include: { addedByAdmin: { select: { id: true, name: true, email: true } } }
      });
    } catch (e) {
      return seededWatchlist;
    }
  }

  static async addWatchlistEntry(data: {
    fullName: string;
    documentNumber: string;
    nationality: string;
    reason: string;
    addedByAdminId: string;
  }) {
    try {
      const existing = await prisma.watchlistEntry.findFirst({
        where: { documentNumber: data.documentNumber }
      });

      if (existing) {
        throw { statusCode: 400, message: 'Document number already registered on watchlist.' };
      }

      return await prisma.watchlistEntry.create({
        data: {
          fullName: data.fullName,
          documentNumber: data.documentNumber,
          nationality: data.nationality,
          reason: data.reason,
          addedByAdminId: data.addedByAdminId
        }
      });
    } catch (err: any) {
      if (err.statusCode) throw err;
      const newEntry = { id: `wl-${Date.now()}`, ...data, createdAt: new Date() };
      seededWatchlist.unshift(newEntry as any);
      return newEntry;
    }
  }

  static async deleteWatchlistEntry(id: string) {
    try {
      const existing = await prisma.watchlistEntry.findUnique({ where: { id } });
      if (!existing) {
        throw { statusCode: 404, message: 'Watchlist entry not found' };
      }

      return await prisma.watchlistEntry.delete({ where: { id } });
    } catch (err: any) {
      if (err.statusCode) throw err;
      const idx = seededWatchlist.findIndex(e => e.id === id);
      if (idx !== -1) seededWatchlist.splice(idx, 1);
      return { id };
    }
  }

  static async checkDocumentOnWatchlist(documentNumber: string, fullName: string) {
    try {
      const match = await prisma.watchlistEntry.findFirst({
        where: {
          OR: [
            { documentNumber: { equals: documentNumber, mode: 'insensitive' } },
            { fullName: { contains: fullName, mode: 'insensitive' } }
          ]
        }
      });
      return match;
    } catch (e) {
      return seededWatchlist.find(w =>
        w.documentNumber.toLowerCase() === documentNumber.toLowerCase() ||
        w.fullName.toLowerCase().includes(fullName.toLowerCase())
      ) || null;
    }
  }
}
