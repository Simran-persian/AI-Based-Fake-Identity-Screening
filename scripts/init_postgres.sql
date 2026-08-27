-- SENTRY Border Security System - PostgreSQL Database Initialization DDL
CREATE TABLE IF NOT EXISTS traveler_screenings (
    case_id VARCHAR(50) PRIMARY KEY,
    traveler_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    nationality VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    date_of_expiry DATE,
    gender VARCHAR(10),
    mrz_valid BOOLEAN DEFAULT TRUE,
    tamper_detected BOOLEAN DEFAULT FALSE,
    face_match_confidence NUMERIC(5,2),
    watchlist_matched BOOLEAN DEFAULT FALSE,
    risk_score INT NOT NULL,
    risk_tier VARCHAR(20) NOT NULL,
    officer_decision VARCHAR(50) DEFAULT 'PENDING',
    officer_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blacklist_registry (
    id SERIAL PRIMARY KEY,
    person_name VARCHAR(255) NOT NULL,
    document_number VARCHAR(100) NOT NULL UNIQUE,
    country_code VARCHAR(10) NOT NULL,
    threat_level VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS audit_trail (
    log_id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL
);

-- Seed Initial Blacklist Data
INSERT INTO blacklist_registry (person_name, document_number, country_code, threat_level, reason)
VALUES
('Pavel Novak', 'C40217755', 'CZE', 'HIGH', 'Interpol Red Notice #2024-991 - Identity Impersonation'),
('Marko Petrov', 'P9920144', 'SRB', 'CRITICAL', 'Interpol Red Notice #2024-882 - Document Fraud Alert')
ON CONFLICT (document_number) DO NOTHING;

-- Seed Initial Screening Data
INSERT INTO traveler_screenings (case_id, traveler_name, document_type, document_number, nationality, date_of_birth, date_of_expiry, gender, mrz_valid, tamper_detected, face_match_confidence, watchlist_matched, risk_score, risk_tier, officer_decision, officer_id)
VALUES
('DOC-88231', 'A. Meridian', 'Passport', 'P98240112', 'GER', '1988-05-12', '2030-11-20', 'F', true, false, 96.00, false, 12, 'LOW', 'APPROVED', 'OFC-40217'),
('DOC-88230', 'J. Okafor', 'Visa', 'VS-409182', 'NGA', '1992-09-04', '2026-08-30', 'M', true, false, 68.00, false, 48, 'MED', 'PENDING', NULL),
('DOC-88229', 'Pavel Novak', 'Passport', 'C40217755', 'CZE', '1989-03-14', '2031-06-02', 'M', false, true, 88.00, true, 75, 'HIGH', 'ESCALATED', 'OFC-40217')
ON CONFLICT (case_id) DO NOTHING;
