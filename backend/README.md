# 🇮🇳 SENTRY AI - Fake Identity & Document Screening System Backend

Production-Grade **TypeScript + Express + Prisma ORM + PostgreSQL** backend built for Smart India Hackathon. Features real-time **Socket.io** telemetry, **tamper-evident sha256 hash-chained Audit Trails**, **AI Assistant Chatbot**, and dynamic risk scoring for **Indian Passport & International Document Screening**.

---

## 🚀 Tech Stack

- **Runtime**: Node.js v20+ / Express / TypeScript
- **Database**: PostgreSQL 15+ (via Docker or Neon/Supabase PostgreSQL Cloud)
- **ORM**: Prisma ORM v5
- **Auth & RBAC**: JWT (`jsonwebtoken`) + `bcryptjs` (10 rounds)
- **Real-Time Sockets**: Socket.io
- **Uploads**: Multer disk storage under `/uploads`
- **Validation**: Zod schema validation middleware
- **Logging**: Winston logger

---

## 🛠️ Local Setup & Quickstart

### 1. Prerequisites
- Node.js v18+ & npm
- PostgreSQL running locally via Docker or a Cloud PostgreSQL URI (Neon / Supabase)

### 2. Environment Configuration
Ensure `.env` in `backend/` directory is set:
```env
PORT=4000
DATABASE_URL="postgresql://sentry_admin:sentry_secure_password_2026@localhost:5432/sentry_screening_db?schema=public"
JWT_SECRET="sentry_jwt_secret_key_hackathon_2026"
NODE_ENV="development"
AI_SERVICE_URL="http://localhost:8000"
```

### 3. Start PostgreSQL Database
```bash
# Using Docker (from project root)
docker compose up -d postgres
```
*Note: If using Cloud PostgreSQL (Neon/Supabase), replace `DATABASE_URL` in `.env` with your PostgreSQL cloud connection string.*

### 4. Migrate Database & Seed Demo Credentials
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

### 5. Start Backend Server
```bash
# Development mode with hot-reload
npm run dev

# Production build & start
npm run build
npm start
```
The server will start at `http://localhost:4000`.

---

## 🔑 Demo Credentials (Seeded)

| Role | Email | Password |
|---|---|---|
| **Officer** | `officer@sentry.gov.in` | `Password123!` |
| **Supervisor** | `supervisor@sentry.gov.in` | `Password123!` |
| **Admin** | `admin@sentry.gov.in` | `Password123!` |
| **Auditor** | `auditor@sentry.gov.in` | `Password123!` |

---

## 📑 Complete API Endpoints

### 🔑 Auth (`/api/auth`)
- `POST /api/auth/login` → `{ email, password }`
- `POST /api/auth/register` (ADMIN only) → `{ name, email, password, role, checkpointId? }`
- `GET /api/auth/me` → Current logged-in user profile

### 🔍 Screening (`/api/screening`)
- `POST /api/screening/scan` (OFFICER) → `multipart/form-data` (`document`, `selfie`, `documentType`, `sessionId`)
- `GET /api/screening/:id` → Single screening details with Officer & Checkpoint joins
- `PATCH /api/screening/:id/decision` → `{ decision: "ACCEPT"|"ESCALATE"|"REJECT", remark }`
- `GET /api/screening/history/list` → Paginated history (`checkpointId`, `status`, `from`, `to`, `page`, `limit`)

### 🛡️ Tamper-Evident Audit Trail (`/api/audit`)
- `GET /api/audit` → Fetch audit logs (optional `screeningEventId` filter)
- `GET /api/audit/verify` → Cryptographically verifies sha256 hash chain ($H_n = \text{sha256}(H_{n-1} + \text{payload})$). Returns `{ intact: true/false, totalLogsVerified }`

### 📋 Watchlist (`/api/watchlist`)
- `GET /api/watchlist` → List active watchlist entries
- `POST /api/watchlist` (ADMIN) → Add watchlist entry
- `DELETE /api/watchlist/:id` (ADMIN) → Delete entry

### ⚙️ Admin Model Config (`/api/admin`)
- `GET /api/admin/model-weights` → Current risk formula weights
- `PUT /api/admin/model-weights` (ADMIN) → Update weights (validates sum equals 1.0)

### 📊 Supervisor Live Queue (`/api/queue`)
- `GET /api/queue/live` → Real-time list of processing scans grouped by checkpoint

### 🤖 AI Chatbot Assistant (`/api/chatbot`)
- `POST /api/chatbot/query` → `{ message }` AI security assistant for document verification guidelines & risk score explanations

---

## 🎯 3 Demo SRS Scenarios Rehearsal (`/demo-assets`)

1. **Clean Indian Passport**:
   - Post `clean_passport.png` to `/api/screening/scan`.
   - Result: `riskScore < 25`, `recommendedAction = CLEAR`, VFX signal `GREEN`.
2. **Tampered Passport (Doctored Document)**:
   - Post `tampered_novak_passport.png` to `/api/screening/scan`.
   - Result: `tamperingScore > 80%`, `riskScore > 75`, `recommendedAction = REJECT/ESCALATE`, Watchlist flag triggered, VFX signal `RED`.
3. **Face Biometric Mismatch**:
   - Post `mismatch_selfie.png` to `/api/screening/scan`.
   - Result: `faceMatchScore < 50%`, `recommendedAction = ESCALATE`, VFX signal `ORANGE`.
