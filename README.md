# EnergI ⚡

> **Multi-tenant utility billing SaaS** — designed for housing societies, PGs, and electricity providers.

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | MongoDB Atlas (Mongoose) |
| Frontend | React + Vite |
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
npm run dev
```

Frontend runs at `http://localhost:5173`, API at `http://localhost:5000`.

---

## 12-Phase Architecture

```
Phase 1  → Stack + scaffold
Phase 2  → Express server + MongoDB
Phase 3  → Multi-tenant models (organizationId everywhere)
Phase 4  → JWT auth + rate limiting
Phase 5  → Dynamic tariff config
Phase 6  → Billing engine (pure integer math)
Phase 7  → Bill management + billing periods
Phase 8  → Stripe checkout + idempotent webhooks
Phase 9  → Email notifications (Resend)
Phase 10 → Dispute workflow
Phase 11 → React frontend (Admin + Consumer)
Phase 12 → PDF, CSV export, white-label
```

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

### Disputes
```
POST   /api/v1/disputes/bill/:billId   → Raise dispute (Consumer)
GET    /api/v1/disputes/my             → My disputes (Consumer)
GET    /api/v1/disputes                → All disputes (Admin)
PATCH  /api/v1/disputes/:id/resolve    → Resolve (Admin)
PATCH  /api/v1/disputes/:id/status     → Update status (Admin)
```

---

## Security

- JWT: 1h access token (memory) + 7d refresh token (httpOnly cookie)
- Auth routes: 5 attempts per 15 minutes via `express-rate-limit`
- Stripe webhook: signature verification with `stripe.webhooks.constructEvent`
- Stripe webhook idempotency: `stripeEventId` unique index prevents double-processing
- Input validation: `zod` schema on all routes

---

## Key Design Decisions

### Integer math for billing
All monetary values stored in **paise** (1 INR = 100 paise). No floats. Prevents rounding errors.

### Multi-tenancy from day one
Every Mongoose model carries `organizationId`. All queries are scoped by org. One housing society = one Organization document.

### Tariff snapshots
Bills store the `tariffConfigId` + full `calculationBreakdown`. Even if tariffs change, historical bills show what was charged and at which rate.

### Idempotent webhook
Stripe can fire the same webhook multiple times. The `stripeEventId` field is unique-indexed — a duplicate event returns `{ alreadyProcessed: true }` without creating a second payment record.

---

## Running Tests (billing engine)

```bash
cd backend
npm test
```

Tests cover: zero units, single slab, multi-slab, integer output, negative input guard.

---

## Environment Variables

See `backend/.env.example` for the complete list. Required:
- `MONGODB_URI`
- `JWT_ACCESS_SECRET` (min 32 chars)
- `JWT_REFRESH_SECRET` (min 32 chars)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
# EnergI-
