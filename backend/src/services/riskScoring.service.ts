import { prisma } from '../config/db';
import { calculateRiskScore, RiskInput, RiskOutput } from '../utils/riskFormula';

export class RiskScoringService {
  static async computeRiskScore(input: RiskInput): Promise<RiskOutput> {
    let config: any = null;
    try {
      config = await prisma.modelWeightConfig.findFirst({
        orderBy: { updatedAt: 'desc' }
      });
    } catch (e) {}

    const weights = config ? {
      ocrWeight: config.ocrWeight,
      validationWeight: config.validationWeight,
      tamperingWeight: config.tamperingWeight,
      faceMatchWeight: config.faceMatchWeight
    } : {
      ocrWeight: 0.15,
      validationWeight: 0.20,
      tamperingWeight: 0.40,
      faceMatchWeight: 0.25
    };

    return calculateRiskScore(input, weights);
  }
}
