# EnergI ⚡ — Smart Utility Billing & Energy Management Platform

> **Multi-Tenant Meter-to-Cash SaaS Platform** — Designed for housing societies, commercial PGs, and smart grid electricity providers.

[![Live Web Service](https://img.shields.io/badge/Live_URL-https%3A%2F%2Fenergi--utility.onrender.com-7C3AED?style=for-the-badge&logo=render)](https://energi-utility.onrender.com)
[![Angular](https://img.shields.io/badge/Angular_18-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/cloud/atlas)

---

## 🌐 Live Application
* **Production Deployment**: [https://energi-utility.onrender.com](https://energi-utility.onrender.com)
* **Status**: Google Search Console Verified & Production Ready 🎉

---

## 🚀 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | **Angular 18** (Standalone Components), RxJS, TailwindCSS, Chart.js, Lucide Icons |
| **Backend** | **Node.js**, **Express.js**, Multer (File Uploads), PDFKit, Nodemon |
| **Database** | **MongoDB Atlas** (Mongoose ORM) with integer-paise financial precision |
| **Payments** | **Stripe Payment Gateway** (Idempotent Webhooks & Checkout Sessions) |
| **Email Services** | **Resend API** for automated invoice & payment receipt notifications |

---

## 🔑 Showcase & Demo Accounts

To experience every feature of the EnergI platform, use the following pre-configured showcase accounts:

### 🛡️ 1. Society Admin Account (Utility Manager)
* **Organization Slug**: `lpu-slug`
* **Email**: `admin@gmail.com`
* **Features**: Admin Command Center, IoT Live Hub, Batch Billing Cycles (`Cmd + Shift + B`), Tariff Slab Config, Dispute Resolution, Custom Branding (Logo & Signatures).

### 🏠 2. Consumer Account (Resident / Smart Meter User)
* **Organization Slug**: `lpu-slug`
* **Email**: `danish@gmail.com`
* **Features**: Live Ticking Smart Meter Telemetry, Usage Trends & Slab Advisor, Early Bird Discount Alerts, Instant Stripe Payments, PDF Invoice Downloads.

---

## ⚡ Quick Start (Local Development)

### 1. Repository Setup
```bash
git clone https://github.com/AnshBabel/EnergI-.git
cd EnergI-
```

### 2. Install Dependencies (Monorepo)
```bash
npm run install:all
```

### 3. Start Development Servers
```bash
# Start Backend Server (runs on http://localhost:5001)
npm run dev:backend

# Start Frontend Dev Server (runs on http://localhost:4200 with proxy)
npm run dev:frontend
```

---

## 🏗️ Core Features & Architecture

```
Phase 1-3  → Multi-Tenant Core, JWT Cookie Security & Tenant Isolation
Phase 4-6  → Integer-Math Billing Engine & Dynamic Tariff Slabs
Phase 7-8  → Stripe Payment Gateway & Webhooks with Idempotency
Phase 9-10 → Bill Dispute Workflow & Digital PDF Invoicing
Phase 11   → Angular 18 Premium Glassmorphism Interface
Phase 12   → IoT Live Telemetry Hub & Showcase Demonstration Layer
```

### 📡 IoT Live Hub
Real-time energy consumption telemetry with a "Digital Matrix" ticker and variable load monitoring for smart meters.

### ✨ Showcase Mode
Integrated demonstration layer available on showcase accounts (`admin@gmail.com` / `danish@gmail.com`) that populates dashboards with rich presentation data.

### ⚡ Early Bird Incentives
Automated pricing logic granting discounts for users who settle bills prior to cutoff grace periods.

### 📜 PDF Invoicing & Digital Signatures
Dynamic PDF bill generation containing society logos, digitally signed authorized signatures, and customizable footer notes.

---

## 📡 API Routes Reference

### Authentication
```http
POST /api/v1/auth/register       → Register new organization + admin / consumer
POST /api/v1/auth/login          → Login account (Rate limited: 5 req/15min)
POST /api/v1/auth/refresh        → Refresh access token
POST /api/v1/auth/logout         → Logout & clear httpOnly cookies
GET  /api/v1/auth/me             → Get current authenticated user profile
```

### Consumers & User Management
```http
GET    /api/v1/users             → List organization consumers (Admin)
POST   /api/v1/users             → Add consumer to grid (Admin)
GET    /api/v1/users/:id         → Fetch consumer details
PATCH  /api/v1/users/:id         → Update consumer (Toggle Smart Meter / Load)
```

### Billing & Invoices
```http
POST /api/v1/bills/user/:userId   → Generate single consumer bill
POST /api/v1/bills/cycle          → Execute batch billing cycle (Admin)
GET  /api/v1/bills                → List all organization bills (Admin)
GET  /api/v1/bills/my             → Get consumer bills (Consumer)
GET  /api/v1/bills/:id/pdf        → Download legal PDF invoice
```

---

## 🛡️ Security & Performance

- **Dual-Token JWT**: Short-lived access tokens paired with `httpOnly` secure refresh cookies.
- **Idempotency**: `stripeEventId` validation to prevent duplicate payment processing.
- **Integer Math Engine**: All financial calculations are executed in integer paise to eliminate floating-point rounding errors.
- **Helmet & CORS**: Configured security headers supporting cross-origin assets and Google Fonts.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

<p align="center">
  👨‍💻 Created with ❤️ by <b>Ansh Babel</b>
</p>
