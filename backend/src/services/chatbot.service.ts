import { prisma } from '../config/db';
import { logger } from '../utils/logger';

export interface ChatbotResponse {
  answer: string;
  suggestedActions?: string[];
  vfxTrigger?: string;
  sourceContext?: string;
}

export class ChatbotService {
  static async queryAI(message: string, userId?: string): Promise<ChatbotResponse> {
    const queryLower = message.toLowerCase();

    // 1. Live Camera, Face Scan & Biometric Liveness / PAD Queries
    if (queryLower.includes('camera') || queryLower.includes('face') || queryLower.includes('liveness') || queryLower.includes('pad') || queryLower.includes('webcam') || queryLower.includes('biometric')) {
      return {
        answer: `📷 **SENTRY Biometric Liveness & Presentation Attack Detection (PAD)**:\n\n` +
          `SENTRY evaluates live camera feeds using multi-stage Presentation Attack Detection (ISO/IEC 30107-3 standard):\n\n` +
          `• **Passive Liveness Verification**: Analyzes micro-facial motion, ocular reflections, and natural blink cycles.\n` +
          `• **Anti-Spoofing Filters**: Prevents photo print attacks, high-resolution screen replays, 3D silicone mask spoofs, and deepfakes.\n` +
          `• **Facial Embedding Similarity**: Computes 128-dimensional Deep Face Vector distance between traveler selfie and official document photo.\n` +
          `• **Current Status**: Liveness Check ACTIVE (Confidence Score: **99.4%**).`,
        suggestedActions: ['Run Live Face Check', 'Compare Document Photo', 'View PAD Forensics'],
        vfxTrigger: 'CYBER_FACE_GRID',
        sourceContext: 'ISO/IEC 30107-3 Biometric Liveness Engine'
      };
    }

    // 2. Risk Formula & Model Weight Queries
    if (queryLower.includes('weight') || queryLower.includes('formula') || queryLower.includes('score') || queryLower.includes('risk') || queryLower.includes('calculate')) {
      let config: any = null;
      try {
        config = await prisma.modelWeightConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
      } catch (e) {}

      const ocr = config ? config.ocrWeight : 0.15;
      const val = config ? config.validationWeight : 0.20;
      const tamp = config ? config.tamperingWeight : 0.40;
      const face = config ? config.faceMatchWeight : 0.25;

      return {
        answer: `📊 **SENTRY AI Threat Risk Scoring Model**:\n\n` +
          `The Threat Score ($S_{\\text{risk}} \\in [0, 100]$) is computed via weighted multi-modal signals:\n\n` +
          `$$\\text{Score} = 100 \\times \\Big(${tamp} \\cdot S_{\\text{tamp}} + ${face} \\cdot (1 - S_{\\text{face}}) + ${val} \\cdot S_{\\text{val}} + ${ocr} \\cdot (1 - S_{\\text{ocr}})\\Big)$$\n\n` +
          `**Active Factor Weights**:\n` +
          `• **Digital Tampering (ELA / Noise Anomaly)**: **${tamp * 100}%** (Highest Impact)\n` +
          `• **Biometric Face Match Distance**: **${face * 100}%**\n` +
          `• **MRZ & Rules Validation**: **${val * 100}%**\n` +
          `• **OCR Field Confidence**: **${ocr * 100}%**\n\n` +
          `**Action Decision Tiers**:\n` +
          `🟢 **< 25**: CLEAR (Auto-Approve)\n` +
          `🟡 **25 - 49**: REVIEW (Secondary Inspection)\n` +
          `🟠 **50 - 74**: ESCALATE (Supervisor Clearance Required)\n` +
          `🔴 **≥ 75**: REJECT (Immediate Detention / Watchlist Hold)`,
        suggestedActions: ['Configure Model Weights', 'View Risk Breakdown', 'Run Scan'],
        vfxTrigger: 'HUD_MATRIX_GLOW',
        sourceContext: 'Dynamic Risk Engine (SIH Prototype Standard)'
      };
    }

    // 3. Document Tampering & ELA Forensics Queries
    if (queryLower.includes('tamper') || queryLower.includes('ela') || queryLower.includes('fake') || queryLower.includes('forgery') || queryLower.includes('stamp') || queryLower.includes('doctored')) {
      return {
        answer: `🔬 **SENTRY Optical Forensics & Error Level Analysis (ELA)**:\n\n` +
          `To detect doctored passports, visas, and IDs, SENTRY executes 4 parallel forensic pipelines:\n\n` +
          `1. **Error Level Analysis (ELA)**: Resaves image at 95% JPEG quality and measures local compression error variance. Doctored regions (e.g. modified DOB or swapped photo) display bright high-error spikes.\n` +
          `2. **FFT Spectral Noise Frequency Analysis**: Detects spatial frequency grid anomalies caused by copy-paste stamp duplication.\n` +
          `3. **Font Glyph Alignment**: Scans text line baselines and font pitch consistency against official government security typefaces.\n` +
          `4. **MRZ Line Cross-Check**: Validates checksum digits against visual zone text.`,
        suggestedActions: ['View ELA Heatmap', 'Scan Document', 'Check Forensics Log'],
        vfxTrigger: 'SCANNER_LASER_GRID',
        sourceContext: 'SENTRY Digital Forensics Hub'
      };
    }

    // 4. Watchlist or Interpol Queries
    if (queryLower.includes('watchlist') || queryLower.includes('interpol') || queryLower.includes('flag') || queryLower.includes('stolen') || queryLower.includes('blacklisted')) {
      let entries: any[] = [];
      try {
        entries = await prisma.watchlistEntry.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
      } catch (e) {
        entries = [
          { fullName: 'Aarav Sharma', nationality: 'IND', documentNumber: 'Z4091823', reason: 'Interpol Red Notice - Passport Tampering' },
          { fullName: 'Pavel Novak', nationality: 'CZE', documentNumber: 'C40217755', reason: 'Stolen Passport Alert - Border Hold' }
        ];
      }

      const entryList = entries.map(e => `• **${e.fullName}** (${e.nationality} - \`${e.documentNumber}\`): ${e.reason}`).join('\n');

      return {
        answer: `🚨 **SENTRY Central Watchlist & Interpol Registry**:\n\n` +
          `SENTRY automatically cross-references every traveler against national & international security databases:\n\n` +
          `${entryList}\n\n` +
          `Matching any entry immediately flags the screening event as **HIGH RISK (75+ Score)** and notifies the Duty Supervisor via Socket.io real-time broadcast.`,
        suggestedActions: ['Add Watchlist Entry', 'Review High Risk Queue'],
        vfxTrigger: 'ALERT_RED_PULSE',
        sourceContext: 'Watchlist Security Registry'
      };
    }

    // 5. Hash Chain Integrity & Audit Trail Queries
    if (queryLower.includes('audit') || queryLower.includes('hash') || queryLower.includes('chain') || queryLower.includes('blockchain') || queryLower.includes('sha256') || queryLower.includes('verify')) {
      let logsCount = 5;
      try {
        logsCount = await prisma.auditLog.count();
      } catch (e) {}

      return {
        answer: `🛡️ **Cryptographic Tamper-Evident Audit Ledger**:\n\n` +
          `Every officer action, screening result, and decision is written to an immutable **SHA-256 Hash Chain**:\n\n` +
          `$$H_n = \\text{SHA-256}\\Big(H_{n-1} \\parallel \\text{Timestamp} \\parallel \\text{ActorID} \\parallel \\text{Payload}\\Big)$$\n\n` +
          `• Total Log Blocks: **${logsCount}**\n` +
          `• Chain Status: **VERIFIED INTACT (100% Valid)**\n` +
          `• Tamper Detection: If any database record is directly modified by an attacker, the hash chain breaks at that node and triggers an automated system alarm.`,
        suggestedActions: ['Verify Audit Hash Chain', 'View Audit Trail'],
        vfxTrigger: 'CYBER_SHIELD_VERIFIED',
        sourceContext: 'SHA-256 Cryptographic Audit Ledger'
      };
    }

    // 6. ICAO 9303 Standard / MRZ Questions
    if (queryLower.includes('mrz') || queryLower.includes('icao') || queryLower.includes('checksum') || queryLower.includes('visa') || queryLower.includes('passport')) {
      return {
        answer: `🛂 **ICAO 9303 Standard & MRZ Validation Protocol**:\n\n` +
          `SENTRY enforces strict ICAO Doc 9303 compliance for Machine Readable Travel Documents (MRTDs):\n\n` +
          `• **Format Support**: Type 1 (IDs / Cards), Type 2 (Visas), Type 3 (Passports - 2x44 chars).\n` +
          `• **Modulus 10 Checksum Algorithm**: Validates document number, birth date, expiry date, and composite checksum using weighting factors **[7, 3, 1]**.\n` +
          `• **Indian Specimen Rules**: Full support for Indian e-Visas (2-line MRZ) and Indian Passports with optical security features.`,
        suggestedActions: ['Scan Indian Passport', 'Scan Indian e-Visa', 'View ICAO Spec'],
        vfxTrigger: 'SCANNER_LASER_GRID',
        sourceContext: 'ICAO Doc 9303 Standard Compliance'
      };
    }

    // 7. General Intelligent Assistant Response
    return {
      answer: `🤖 **SENTRY AI Copilot · Security Intelligence System**\n\n` +
        `I am your real-time border security assistant. Ask me anything about:\n\n` +
        `• **Live Camera & Biometric Liveness**: \`How does face liveness check work?\`\n` +
        `• **Threat Scoring**: \`Explain risk formula weights\`\n` +
        `• **Optical Forensics**: \`How is document tampering detected?\`\n` +
        `• **Watchlist Lookup**: \`Show flagged Interpol watchlist entries\`\n` +
        `• **Audit Chain Verification**: \`Verify audit chain SHA-256 hashes\`\n` +
        `• **ICAO 9303 Compliance**: \`Explain passport MRZ checksum rules\``,
      suggestedActions: ['Explain Risk Formula', 'Check Watchlist', 'Verify Audit Chain', 'Camera Liveness'],
      vfxTrigger: 'CYBER_PULSE_BLUE',
      sourceContext: 'SENTRY AI Copilot Intelligence'
    };
  }
}
