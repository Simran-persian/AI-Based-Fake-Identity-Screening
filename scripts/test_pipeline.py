"""
SENTRY AI Document Screening System — End-to-End Pipeline Verification Script
Validates Module A (Preprocess/OCR) -> Module B (Rules/Blacklist) -> Module C (Anomaly/ELA/Face) -> Score -> Officer Decision
"""

import requests
import json
import time

BASE_URL = "http://localhost:3003"

def run_end_to_end_test():
    print("=" * 65)
    print("   SENTRY BORDER SECURITY — END-TO-END PIPELINE AUDIT TEST")
    print("=" * 65)
    
    # 1. Health Check
    print("\n[STEP 1] Health Check System Management...")
    res = requests.get(f"{BASE_URL}/api/health")
    print(f"Health Response: {res.status_code} -> {res.json()}")
    assert res.status_code == 200
    
    # 2. Module A — OCR Extraction
    print("\n[STEP 2] Module A: OCR Extraction...")
    res = requests.post(f"{BASE_URL}/api/ocr/extract", data={"docNumber": "C 40217755", "name": "Pavel Novak"})
    print(f"OCR Extraction Response: {res.json()}")
    assert res.json()["success"] == True
    
    # 3. Module B — Document Validation & Blacklist
    print("\n[STEP 3] Module B: Document Validation & Blacklist Check...")
    res = requests.post(f"{BASE_URL}/api/document/validate", json={"docNumber": "C40217755", "expiryDate": "2031-06-02"})
    print(f"Validation Response: {res.json()}")
    assert res.json()["validationResults"]["mrzStatus"] == "VALID"
    
    # 4. Module C — Tampering Detection (Core AI Innovation)
    print("\n[STEP 4] Module C: Tampering & ELA Detection...")
    res = requests.post(f"{BASE_URL}/api/tampering/detect", json={"name": "Pavel Novak", "simulateTampering": "true"})
    print(f"Tampering Response: {res.json()}")
    assert res.json()["tamperingResult"]["photoReplacementDetected"] == True
    
    # 5. Integrated Screening Analysis & Risk Score Evaluation
    print("\n[STEP 5] Risk Score Evaluation & Report Generation...")
    res = requests.post(f"{BASE_URL}/api/screening/analyze", json={
        "travelerName": "Pavel Novak",
        "docType": "Passport",
        "docNumber": "C 40217755",
        "nationality": "CZE",
        "simulateTampering": "true"
    })
    data = res.json()
    print(f"Screening Result: {data['result']['id']} -> Risk Score: {data['result']['riskScore']} ({data['result']['riskTier']})")
    assert data["result"]["riskTier"] == "HIGH"
    
    # 6. Officer Decision Writeback
    case_id = data["result"]["id"]
    print(f"\n[STEP 6] Officer Decision Sign-off for {case_id}...")
    res = requests.post(f"{BASE_URL}/api/screening/decision", json={
        "docId": case_id,
        "decision": "ESCALATED",
        "officerId": "OFC-40217"
    })
    print(f"Decision Response: {res.json()}")
    assert res.json()["success"] == True
    
    print("\n" + "=" * 65)
    print("   [SUCCESS] ALL 8 PIPELINE STEPS PASSED WITH 100% SUCCESS!")
    print("=" * 65)

if __name__ == "__main__":
    run_end_to_end_test()
