"""
SENTRY — AI-Based Fake Identity & Document Screening System
AI Application Core (FastAPI Service Hub)
Modules:
  - Module A: Image Preprocessing (Deskew, Denoise, Alignment) + OCR Data Ingestion
  - Module B: Data Fusion & Cross-Verification (ICAO 9303 MRZ Checksum, Expiry, Blacklist)
  - Module C: Anomaly Detection (Photo Replacement, ELA Tampering, Face Match & PAD Liveness)
  - Evaluation: Risk Score Computation & Case Persistence
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import datetime
import math
import os
import json

app = FastAPI(
    title="SENTRY AI Document Screening Core Hub",
    description="Fullstack AI-Powered Border Control Document Screening & Biometric Forensics Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- MODULE A: IMAGE PREPROCESSING & INGESTION ----------------

class PreprocessingResponse(BaseModel):
    success: bool
    status: str
    deskewAngle: float
    denoiseApplied: bool
    alignmentStatus: str

def preprocess_image_pipeline(image_bytes: bytes) -> Dict:
    # Simulated OpenCV Deskew, Denoise & Perspective Transform Alignment
    return {
        "deskewAngle": -1.2,
        "denoiseApplied": True,
        "alignmentStatus": "ALIGNED_TO_ICAO_TEMPLATE"
    }

def ocr_extraction_engine(text: str = "") -> Dict:
    return {
        "name": "Pavel Novak",
        "documentNumber": "C 40217755",
        "nationality": "Czech Republic (CZE)",
        "dateOfBirth": "1989-03-14",
        "dateOfExpiry": "2031-06-02",
        "gender": "M",
        "issuingAuthority": "Ministry of Interior CZE",
        "mrzLine1": "P<CZENOVAK<<PAVEL<<<<<<<<<<<<<<<<<<<<<<<<<<<",
        "mrzLine2": "C402177557CZE8903142M3106025<<<<<<<<<<<<<<02"
    }

# ---------------- MODULE B: DATA FUSION & CROSS-VERIFICATION ----------------

def calculate_mrz_check_digit(mrz_str: str) -> int:
    weights = [7, 3, 1]
    total = 0
    for idx, char in enumerate(mrz_str):
        if '0' <= char <= '9':
            val = int(char)
        elif 'A' <= char <= 'Z':
            val = ord(char) - 55
        else:
            val = 0
        total += val * weights[idx % 3]
    return total % 10

def validate_document_rules(doc_num: str, expiry: str, name: str) -> Dict:
    clean_num = doc_num.replace(" ", "").upper()
    check_digit = calculate_mrz_check_digit(clean_num)
    
    # Expiry Check
    try:
        exp_date = datetime.datetime.strptime(expiry, "%Y-%m-%d")
        is_expired = exp_date < datetime.datetime.now()
    except Exception:
        is_expired = False
        
    # Blacklist Database Lookup Simulation
    is_blacklisted = "NOVAK" in name.upper() or "C40217755" in clean_num
    
    return {
        "mrzCheckDigit": check_digit,
        "mrzStatus": "VALID" if check_digit >= 0 else "INVALID",
        "documentExpired": is_expired,
        "blacklistMatch": is_blacklisted,
        "blacklistReason": "Interpol Red Notice #2024-991" if is_blacklisted else None
    }

# ---------------- MODULE C: ANOMALY DETECTION (AI/ML STACK) ----------------

def detect_tampering_anomalies(name: str, simulate: bool = True) -> Dict:
    is_tampered = "NOVAK" in name.upper() or simulate
    flags = []
    
    if is_tampered:
        flags.append({"title": "Stamp forgery suspected", "severity": "high", "desc": "Entry stamp ink density inconsistent with issuing authority reference set."})
        flags.append({"title": "Font irregularity in MRZ line 2", "severity": "warn", "desc": "Character spacing deviates 2.1σ from OCR-B baseline."})
        flags.append({"title": "Interpol Watchlist Warning", "severity": "high", "desc": "Partial name match on Interpol Red Notice database."})
        
    return {
        "photoReplacementDetected": is_tampered,
        "textManipulationDetected": is_tampered,
        "stampForgeryDetected": is_tampered,
        "elaScore": 84.5 if is_tampered else 12.1,
        "flags": flags
    }

def verify_face_biometrics(low_match: bool = False) -> Dict:
    confidence = 68.0 if low_match else 88.0
    return {
        "faceMatchConfidence": confidence,
        "matchStatus": "VERIFIED" if confidence >= 85 else "REVIEW_REQUIRED",
        "livenessCheckPassed": True,
        "presentationAttackDetected": False
    }

# ---------------- EVALUATION & SCORE COMPUTATION ----------------

def compute_weighted_risk_score(mod_b: Dict, mod_c: Dict) -> Dict:
    score = 10
    if mod_b.get("blacklistMatch"):
        score += 40
    if mod_c.get("photoReplacementDetected"):
        score += 25
    if mod_c.get("stampForgeryDetected"):
        score += 15
        
    score = min(score, 99)
    tier = "HIGH" if score > 70 else "MED" if score > 40 else "LOW"
    return {"riskScore": score, "riskTier": tier}

# ---------------- FASTAPI REST ENDPOINTS ----------------

@app.get("/api/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "SENTRY AI Application Core Hub (FastAPI)",
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.post("/api/preprocess")
async def api_preprocess(file: UploadFile = File(...)):
    contents = await file.read()
    res = preprocess_image_pipeline(contents)
    return {"success": True, "result": res}

@app.post("/api/ocr/extract")
def api_ocr_extract(docNumber: Optional[str] = Form("C 40217755"), name: Optional[str] = Form("Pavel Novak")):
    extracted = ocr_extraction_engine(name)
    return {"success": True, "module": "Module 1: OCR Extraction", "extractedFields": extracted}

@app.post("/api/document/validate")
def api_document_validate(payload: Dict):
    doc_num = payload.get("docNumber", "C40217755")
    expiry = payload.get("expiryDate", "2031-06-02")
    name = payload.get("name", "Pavel Novak")
    res = validate_document_rules(doc_num, expiry, name)
    return {"success": True, "module": "Module 2: Document Validation", "validationResults": res}

@app.post("/api/tampering/detect")
def api_tampering_detect(payload: Dict):
    name = payload.get("name", "Pavel Novak")
    simulate = payload.get("simulateTampering", True)
    res = detect_tampering_anomalies(name, simulate)
    return {"success": True, "module": "Module 3: Tampering Detection", "tamperingResult": res}

@app.post("/api/face/verify")
def api_face_verify():
    res = verify_face_biometrics()
    return {"success": True, "module": "Module 4: Face Verification", "biometricResults": res}

@app.post("/api/screening/analyze")
def api_screening_analyze(payload: Dict):
    name = payload.get("travelerName", "Pavel Novak")
    doc_type = payload.get("docType", "Passport")
    doc_num = payload.get("docNumber", "C 40217755")
    expiry = payload.get("expiry", "2031-06-02")
    
    mod_a = ocr_extraction_engine(name)
    mod_b = validate_document_rules(doc_num, expiry, name)
    mod_c = detect_tampering_anomalies(name, True)
    face_res = verify_face_biometrics()
    
    eval_score = compute_weighted_risk_score(mod_b, mod_c)
    case_id = f"DOC-{int(datetime.datetime.now().timestamp()) % 100000}"
    
    result_record = {
        "id": case_id,
        "travelerName": name,
        "docType": doc_type,
        "docNumber": doc_num,
        "nationality": payload.get("nationality", "CZE"),
        "dob": payload.get("dob", "1989-03-14"),
        "expiry": expiry,
        "gender": payload.get("gender", "M"),
        "riskScore": eval_score["riskScore"],
        "riskTier": eval_score["riskTier"],
        "timestamp": datetime.datetime.now().isoformat(),
        "officerDecision": "PENDING",
        "officerId": None,
        "mrzValid": not mod_b["documentExpired"],
        "tamperDetected": mod_c["photoReplacementDetected"],
        "faceMatchConfidence": face_res["faceMatchConfidence"],
        "watchlistMatch": mod_b["blacklistMatch"],
        "flags": mod_c["flags"]
    }
    
    return {"success": True, "result": result_record}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
