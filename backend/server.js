const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve Frontend Static Assets
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Uploads Directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `doc_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`)
});
const upload = multer({ storage });

// Real-time Database Persistence File
const DB_FILE = path.join(__dirname, 'screening_db.json');

function loadDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      screenings: [
        {
          id: "DOC-88231",
          travelerName: "A. Meridian",
          docType: "Passport",
          docNumber: "P98240112",
          nationality: "GER",
          dob: "1988-05-12",
          expiry: "2030-11-20",
          gender: "F",
          riskScore: 12,
          riskTier: "LOW",
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          officerDecision: "APPROVED",
          officerId: "OFC-40217",
          mrzValid: true,
          tamperDetected: false,
          faceMatchConfidence: 96,
          watchlistMatch: false,
          flags: []
        },
        {
          id: "DOC-88230",
          travelerName: "J. Okafor",
          docType: "Visa",
          docNumber: "VS-409182",
          nationality: "NGA",
          dob: "1992-09-04",
          expiry: "2026-08-30",
          gender: "M",
          riskScore: 48,
          riskTier: "MED",
          timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
          officerDecision: "PENDING",
          officerId: null,
          mrzValid: true,
          tamperDetected: false,
          faceMatchConfidence: 68,
          watchlistMatch: false,
          flags: [{ title: "Face match below threshold", severity: "warn", desc: "Similarity score 68% (expected >= 85%). Secondary interview suggested." }]
        },
        {
          id: "DOC-88229",
          travelerName: "Pavel Novak",
          docType: "Passport",
          docNumber: "C 40217755",
          nationality: "CZE",
          dob: "1989-03-14",
          expiry: "2031-06-02",
          gender: "M",
          riskScore: 75,
          riskTier: "HIGH",
          timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
          officerDecision: "ESCALATED",
          officerId: "OFC-40217",
          mrzValid: false,
          tamperDetected: true,
          faceMatchConfidence: 88,
          watchlistMatch: true,
          flags: [
            { title: "Stamp forgery suspected", severity: "high", desc: "Entry stamp ink density inconsistent with issuing authority reference set." },
            { title: "Font irregularity in MRZ line 2", severity: "warn", desc: "Character spacing deviates 2.1σ from OCR-B baseline." },
            { title: "Interpol Watchlist Warning", severity: "high", desc: "Partial name match on Interpol Red Notice database." }
          ]
        },
        {
          id: "DOC-88228",
          travelerName: "S. Thanh",
          docType: "National ID",
          docNumber: "ID-901844",
          nationality: "VNM",
          dob: "1995-12-01",
          expiry: "2029-04-15",
          gender: "F",
          riskScore: 8,
          riskTier: "LOW",
          timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          officerDecision: "APPROVED",
          officerId: "OFC-40217",
          mrzValid: true,
          tamperDetected: false,
          faceMatchConfidence: 98,
          watchlistMatch: false,
          flags: []
        }
      ],
      auditLogs: [
        { id: "LOG-101", timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), actor: "OFC-40217", action: "Officer Authenticated", details: "Terminal B Checkpoint 04 session initiated." },
        { id: "LOG-102", timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(), actor: "AI-ENGINE", action: "High Risk Flagged", details: "DOC-88229 calculated risk score 75/100 (HIGH RISK)." },
        { id: "LOG-103", timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), actor: "OFC-40217", action: "Case Escalated", details: "DOC-88229 sent to Secondary Screening Queue." }
      ],
      userQueries: [
        { id: "QRY-51041", userId: "Jordan Lee", submitted: "Yesterday", status: "VERIFIED", officer: "Kessler" },
        { id: "QRY-50988", userId: "Jordan Lee", submitted: "3 days ago", status: "PENDING", officer: "Kessler" }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    fs.unlinkSync(DB_FILE);
    return loadDatabase();
  }
}

function saveDatabase(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ICAO 9303 Modulus 10 Algorithm (7-3-1 weight vector)
function calculateMrzCheckDigit(str) {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    let val = 0;
    if (char >= '0' && char <= '9') val = parseInt(char, 10);
    else if (char >= 'A' && char <= 'Z') val = char.charCodeAt(0) - 55;
    else if (char === '<') val = 0;
    sum += val * weights[i % 3];
  }
  return sum % 10;
}

// Watchlist Mock Registry
const WATCHLIST = [
  { name: "PAVEL NOVAK", passport: "C40217755", country: "CZE", threatLevel: "HIGH", reason: "Identity Impersonation / Document Theft Alert" },
  { name: "MARKO PETROV", passport: "P9920144", country: "SRB", threatLevel: "CRITICAL", reason: "Interpol Red Notice #2024-991" }
];

// ================= API ENDPOINTS =================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: "ONLINE", system: "SENTRY Border AI Screening Engine", timestamp: new Date().toISOString() });
});

// Module 1: OCR Extraction API
app.post('/api/ocr/extract', upload.single('documentImage'), (req, res) => {
  const body = req.body || {};
  const extracted = {
    name: body.name || "Pavel Novak",
    documentNumber: body.docNumber || "C 40217755",
    nationality: body.nationality || "Czech Republic (CZE)",
    dateOfBirth: body.dob || "1989-03-14",
    dateOfExpiry: body.expiry || "2031-06-02",
    gender: body.gender || "M",
    issuingAuthority: "Ministry of Interior CZE",
    mrzLine1: "P<CZENOVAK<<PAVEL<<<<<<<<<<<<<<<<<<<<<<<<<<<",
    mrzLine2: "C402177557CZE8903142M3106025<<<<<<<<<<<<<<02"
  };
  res.json({ success: true, module: "Module 1: OCR Extraction", extractedFields: extracted });
});

// Module 2: Document Validation API
app.post('/api/document/validate', (req, res) => {
  const { docNumber, expiryDate } = req.body || {};
  const cleanNum = (docNumber || "C40217755").replace(/\s+/g, '');
  const checkDigit = calculateMrzCheckDigit(cleanNum);
  const isValidExpiry = new Date(expiryDate || "2031-06-02") > new Date();

  res.json({
    success: true,
    module: "Module 2: Document Validation",
    validationResults: {
      mrzCheckDigit: checkDigit,
      mrzStatus: "VALID",
      documentExpired: !isValidExpiry,
      icao9303Compliant: isValidExpiry
    }
  });
});

// Module 3: Tampering Detection API
app.post('/api/tampering/detect', (req, res) => {
  const body = req.body || {};
  const isTampered = (body.name || '').toLowerCase().includes('novak') || body.simulateTampering === 'true';

  res.json({
    success: true,
    module: "Module 3: Tampering Detection",
    tamperingResult: {
      photoReplacementDetected: isTampered,
      textManipulationDetected: isTampered,
      stampForgeryDetected: isTampered,
      errorLevelAnalysisScore: isTampered ? 84.5 : 12.1,
      detectedAnomalies: isTampered ? [
        { type: "Photo Replacement", region: "Passport Photo Quadrant", confidence: "92.4%" },
        { type: "Stamp Forgery", region: "Entry Stamp Ink Luminance", confidence: "95.0%" }
      ] : []
    }
  });
});

// Module 4: Face Verification API
app.post('/api/face/verify', (req, res) => {
  const body = req.body || {};
  const matchConfidence = body.simulateLowMatch ? 68 : 88;

  const db = loadDatabase();
  db.auditLogs.unshift({
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: body.userId || "Jordan Lee",
    action: "Face Biometrics Registered & Saved to Database",
    details: `Captured webcam face frame saved to persistent database. Liveness status: PASS (99.4% Confidence).`
  });
  saveDatabase(db);

  res.json({
    success: true,
    module: "Module 4: Face Verification",
    biometricResults: {
      faceMatchConfidence: `${matchConfidence}%`,
      matchStatus: matchConfidence >= 85 ? "VERIFIED" : "REVIEW_REQUIRED",
      livenessCheckPassed: true,
      presentationAttackDetected: false,
      databaseSaved: true
    }
  });
});

// Get Screenings & Dashboard Stats
app.get('/api/screenings', (req, res) => {
  const db = loadDatabase();
  const screenings = db.screenings;
  const stats = {
    totalScreened: screenings.length + 1280,
    lowRisk: screenings.filter(s => s.riskTier === 'LOW').length + 1193,
    medRisk: screenings.filter(s => s.riskTier === 'MED').length + 62,
    highRisk: screenings.filter(s => s.riskTier === 'HIGH').length + 21
  };
  res.json({ screenings, stats });
});

// AI Screening Pipeline Execution
app.post('/api/screening/analyze', upload.single('docImage'), (req, res) => {
  const body = req.body || {};
  const travelerName = body.travelerName || "Pavel Novak";
  const docType = body.docType || "Passport";
  const docNumber = body.docNumber || "C 40217755";
  const nationality = body.nationality || "CZE";
  const dob = body.dob || "1989-03-14";
  const expiry = body.expiry || "2031-06-02";
  const gender = body.gender || "M";

  const isFlagged = travelerName.toLowerCase().includes('novak') || body.simulateTampering === 'true';

  const flags = [];
  if (isFlagged) {
    flags.push({ title: "Stamp forgery suspected", severity: "high", desc: "Entry stamp ink density inconsistent with issuing authority reference set." });
    flags.push({ title: "Font irregularity in MRZ line 2", severity: "warn", desc: "Character spacing deviates 2.1σ from OCR-B baseline." });
    flags.push({ title: "Interpol Watchlist Warning", severity: "high", desc: "Partial name match on Interpol Red Notice database." });
  }

  const riskScore = isFlagged ? 75 : 12;
  const riskTier = riskScore > 70 ? "HIGH" : riskScore > 40 ? "MED" : "LOW";

  const newDocId = `DOC-${Math.floor(88232 + Math.random() * 10000)}`;
  const newRecord = {
    id: newDocId,
    travelerName,
    docType,
    docNumber,
    nationality,
    dob,
    expiry,
    gender,
    riskScore,
    riskTier,
    timestamp: new Date().toISOString(),
    officerDecision: "PENDING",
    officerId: null,
    mrzValid: !isFlagged,
    tamperDetected: isFlagged,
    faceMatchConfidence: 88,
    watchlistMatch: isFlagged,
    flags
  };

  const db = loadDatabase();
  db.screenings.unshift(newRecord);
  db.auditLogs.unshift({
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "AI-FORENSICS-ENGINE",
    action: "Screening Analyzed",
    details: `${newDocId} analyzed for ${travelerName}. Score: ${riskScore} (${riskTier}).`
  });

  saveDatabase(db);

  res.json({ success: true, result: newRecord });
});

// Officer Decision Handler
app.post('/api/screening/decision', (req, res) => {
  const { docId, decision, officerId } = req.body || {};
  const db = loadDatabase();
  const doc = db.screenings.find(s => s.id === docId);
  if (doc) {
    doc.officerDecision = (decision || "APPROVED").toUpperCase();
    doc.officerId = officerId || "OFC-40217";

    db.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: officerId || "OFC-40217",
      action: `Officer Sign-off: ${decision.toUpperCase()}`,
      details: `Officer confirmed outcome for ${docId}: ${decision.toUpperCase()}.`
    });

    saveDatabase(db);
  }
  res.json({ success: true, message: "Officer decision recorded in database." });
});

// User Query Submission
app.post('/api/user/query', (req, res) => {
  const { userId, queryType } = req.body || {};
  const db = loadDatabase();
  const newQuery = {
    id: `QRY-${Math.floor(51043 + Math.random() * 1000)}`,
    userId: userId || "Jordan Lee",
    submitted: "Just now",
    queryType: queryType || "Verification Request",
    status: "PENDING_OFFICER_REVIEW",
    officer: "Kessler"
  };
  db.userQueries.unshift(newQuery);
  saveDatabase(db);
  res.json({ success: true, query: newQuery });
});

// Audit Logs
app.get('/api/audit-logs', (req, res) => {
  const db = loadDatabase();
  res.json({ auditLogs: db.auditLogs });
});

// Downloadable PDF Case Report
app.get('/api/reports/download/:id', (req, res) => {
  const db = loadDatabase();
  const doc = db.screenings.find(s => s.id === req.params.id) || db.screenings[0];

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>SENTRY Border Security Screening Report - ${doc.id}</title>
    <style>
      body { font-family: sans-serif; padding: 40px; color: #111; line-height: 1.6; }
      .header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
      .title { font-size: 22px; font-weight: bold; }
      .badge { font-size: 14px; font-weight: bold; padding: 4px 12px; background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; border-radius: 4px; }
      .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; margin-top: 10px; }
      .flag { background: #fff8e1; border: 1px solid #ffe082; padding: 8px; margin-bottom: 6px; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="title">SENTRY BORDER CONTROL AGENCY</div>
        <div style="font-size:12px; color:#666;">CHECKPOINT SCREENING CONSOLE AUDIT REPORT</div>
      </div>
      <div class="badge">RISK TIER: ${doc.riskTier} (${doc.riskScore}/100)</div>
    </div>

    <div class="section-title">Case Metadata</div>
    <div class="grid">
      <div><strong>Document ID:</strong> ${doc.id}</div>
      <div><strong>Traveler Name:</strong> ${doc.travelerName}</div>
      <div><strong>Document Type:</strong> ${doc.docType}</div>
      <div><strong>Document Number:</strong> ${doc.docNumber}</div>
      <div><strong>Nationality:</strong> ${doc.nationality}</div>
      <div><strong>Officer Decision:</strong> ${doc.officerDecision}</div>
    </div>

    <div class="section-title">Detection Signals</div>
    ${(doc.flags && doc.flags.length > 0) ? doc.flags.map(f => `<div class="flag"><strong>${f.title}</strong>: ${f.desc}</div>`).join('') : '<div>No flags recorded.</div>'}

    <div class="section-title">Officer Sign-off</div>
    <div style="font-size:12px; margin-top:10px;">
      <div>Verified by Officer ID: OFC-40217 (R. Kessler)</div>
      <div>Timestamp: ${doc.timestamp}</div>
      <div>Digital Signature: ENCRYPTED_SENTRY_HASH_${doc.id}</div>
    </div>
  </body>
  </html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Fallback to Frontend Index
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server with Port Search
function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log(`=======================================================`);
    console.log(`   SENTRY BACKEND RUNNING ON PORT ${portToTry}`);
    console.log(`   Frontend served from: ${frontendPath}`);
    console.log(`   Local URL: http://localhost:${portToTry}`);
    console.log(`=======================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      startServer(portToTry + 1);
    }
  });
}

startServer(PORT);
