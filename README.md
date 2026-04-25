# EnergI ⚡

> **Multi-tenant utility billing SaaS** — designed for housing societies, PGs, and electricity providers.

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | MongoDB Atlas (Mongoose) |
| Frontend | **Angular 18 + CSS** |
| Icons | Lucide Angular |
| Payments | Stripe |
| Email | Resend |
| PDF | PDFKit |

---

## Quick Start

### 1. Backend setup

```bash
cd backend
cp .env.example .env
# Fill in your MONGODB_URI, JWT secrets, Stripe keys, Resend key
npm install
npm run dev
```

### 2. Frontend setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:4200`, API at `http://localhost:5000`.

---

## Evolution & Architecture

The platform has evolved through 12 core phases, now featuring a high-precision IoT simulation and a "Digital Energy" UI.

```
Phase 1-3  → Multi-tenant Core & Security
Phase 4-6  → Billing Engine (Pure Integer Math) & Tariff Config
Phase 7-8  → Stripe Integration & Idempotent Webhooks
Phase 9-10 → Dispute Workflow & PDF Invoicing
Phase 11   → Angular 18 Premium Dashboard
Phase 12   → IoT Live Hub & Showcase Mode
```

---

## Advanced Features

### 📡 IoT Live Hub
Real-time energy consumption monitoring with a "Digital Matrix" ticker. Supports smart meter emulation with variable load analysis.

### 🎞️ Showcase Mode
A demonstration layer that populates the dashboard with high-fidelity mock data and trends, perfect for client presentations.

### ⚡ Early Bird Incentives
Automated discount logic for users who settle bills before specific thresholds.

### 🛡️ Admin Command Center
Centralized control for batch billing cycles, collection analytics, and consumer lifecycle management.

---

## API Routes

### Auth
```
POST /api/v1/auth/register   → Create org + admin
POST /api/v1/auth/login      → Login (rate limited: 5/15min)
POST /api/v1/auth/refresh    → Refresh access token
POST /api/v1/auth/logout     → Clear cookie
GET  /api/v1/auth/me         → Current user
```

### Users (Admin only)
```
GET    /api/v1/users         → List consumers
POST   /api/v1/users         → Add consumer
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
```

### Tariff (Admin only)
```
GET    /api/v1/tariffs
POST   /api/v1/tariffs
PATCH  /api/v1/tariffs/:id/activate
DELETE /api/v1/tariffs/:id
```

### Bills
```
POST /api/v1/bills/user/:userId   → Generate bill (Admin)
POST /api/v1/bills/cycle          → Batch billing cycle (Admin)
GET  /api/v1/bills                → All bills (Admin)
GET  /api/v1/bills/analytics      → Stats (Admin)
GET  /api/v1/bills/export         → CSV download (Admin)
GET  /api/v1/bills/my             → My bills (Consumer)
GET  /api/v1/bills/:id
GET  /api/v1/bills/:id/pdf        → Bill PDF download
```

### Payments
```
POST /api/v1/payments/checkout/:billId   → Stripe checkout session
POST /api/v1/payments/webhook            → Stripe webhook (raw body)
```

---

## Security

- **JWT**: Dual-token system with httpOnly cookies.
- **Rate Limiting**: `express-rate-limit` on auth routes.
- **Idempotency**: `stripeEventId` tracking prevents duplicate payments.
- **Validation**: Strict `zod` schemas for all API payloads.

---

## Running Tests

```bash
cd backend
npm test
```

Tests cover the zero-error billing engine logic.
