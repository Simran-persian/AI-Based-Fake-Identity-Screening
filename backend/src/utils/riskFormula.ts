import { RecommendedAction } from '@prisma/client';

export interface RiskInput {
  ocrConfidence: number;      // 0.0 - 1.0
  validationFailureRate: number; // 0.0 - 1.0
  tamperingScore: number;     // 0.0 - 100.0
  faceMatchScore: number;     // 0.0 - 100.0
}

export interface ModelWeights {
  ocrWeight: number;
  validationWeight: number;
  tamperingWeight: number;
  faceMatchWeight: number;
}

export interface RiskOutput {
  riskScore: number;
  recommendedAction: RecommendedAction;
  topFactors: Array<{ factor: string; weight: number; explanation: string }>;
}

export function calculateRiskScore(input: RiskInput, weights: ModelWeights): RiskOutput {
  const ocrComponent = (1 - input.ocrConfidence) * weights.ocrWeight * 100;
  const valComponent = input.validationFailureRate * weights.validationWeight * 100;
  const tampComponent = input.tamperingScore * weights.tamperingWeight;
  const faceComponent = (100 - input.faceMatchScore) * weights.faceMatchWeight;

  const rawScore = ocrComponent + valComponent + tampComponent + faceComponent;
  const riskScore = Math.min(Math.max(Math.round(rawScore * 10) / 10, 0), 100);

  let recommendedAction: RecommendedAction = RecommendedAction.CLEAR;
  if (riskScore >= 75) {
    recommendedAction = RecommendedAction.REJECT;
  } else if (riskScore >= 50) {
    recommendedAction = RecommendedAction.ESCALATE;
  } else if (riskScore >= 25) {
    recommendedAction = RecommendedAction.REVIEW;
  }

  const topFactors: Array<{ factor: string; weight: number; explanation: string }> = [];

  if (input.tamperingScore > 30) {
    topFactors.push({
      factor: 'Digital Tampering Anomaly',
      weight: weights.tamperingWeight,
      explanation: `Tampering detection score of ${input.tamperingScore}% detected by ELA & photo analysis.`
    });
  }

  if (input.faceMatchScore < 80) {
    topFactors.push({
      factor: 'Biometric Face Mismatch',
      weight: weights.faceMatchWeight,
      explanation: `Facial similarity match score is low (${input.faceMatchScore}% confidence).`
    });
  }

  if (input.validationFailureRate > 0) {
    topFactors.push({
      factor: 'ICAO Standard / Rule Failure',
      weight: weights.validationWeight,
      explanation: `Validation failed on ${Math.round(input.validationFailureRate * 100)}% of document rules & watchlist lookup.`
    });
  }

  if (input.ocrConfidence < 0.85) {
    topFactors.push({
      factor: 'Low OCR Character Confidence',
      weight: weights.ocrWeight,
      explanation: `OCR extraction confidence was ${Math.round(input.ocrConfidence * 100)}%, indicating blurry or degraded text.`
    });
  }

  if (topFactors.length === 0) {
    topFactors.push({
      factor: 'All Verification Checks Passed',
      weight: 1.0,
      explanation: 'Document MRZ, text OCR, pixel ELA forensics, and face biometrics were successfully verified.'
    });
  }

  return { riskScore, recommendedAction, topFactors };
}
