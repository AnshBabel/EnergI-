# EnergI: Full SaaS Ecosystem Master Plan

## 1. Executive Summary
EnergI is a mission-critical "Meter-to-Cash" SaaS platform designed for high-precision utility management. It replaces manual, error-prone billing processes with a zero-error integer engine and provides a futuristic dashboard for both utility providers (Admins) and end-users (Consumers).

## 2. Technical Core: The "Zero-Error" Foundation
The heart of EnergI is its financial integrity. By treating money and energy units with extreme precision, the platform establishes trust between providers and consumers.

- **Integer-Math Engine**: All calculations are performed in Paise (1 Rupee = 100 Paise) within a shared utility layer. This eliminates floating-point decimal errors that plague standard calculators.
- **Dynamic Tariff Architecture**: Instead of hardcoded rates, the system uses a `TariffConfig` model. This allows admins to update slab rates (e.g., 0-100 units at ₹5.00) through a UI without redeploying code.
- **Consumption Logic**: The engine automatically calculates consumption by subtracting `previousReading` from `currentReading`, ensuring users are only billed for actual usage.

## 3. SaaS Architecture: Multi-Tenancy
To be a true SaaS, the system must support multiple independent organizations (tenants) on one infrastructure.

- **Data Isolation**: Every database model (User, Bill, Payment) includes an `organizationId`. This ensures a Housing Society in Delhi cannot see the data of a PG in Bangalore.
- **White-Label Branding**: The Organization model stores specific branding assets like logos and primary colors, which are dynamically injected into the Angular frontend and PDF invoices.

## 4. Advanced Feature Roadmap

### Phase 1: Financial & Security (Current Focus)
- **Bcrypt Hashing**: All passwords are salt-hashed before database entry to ensure data-breach protection.
- **JWT Authentication**: Uses a dual-token system (Access & Refresh) for secure, persistent sessions.
- **Stripe Integration**: A secure "Pay Now" flow using Stripe Checkout and automated Webhooks to mark bills as "PAID" instantly.

### Phase 2: Administrative Excellence
- **Automated Billing Cycles**: The system tracks `lastBillingDate` and can auto-generate bills every 30 days for thousands of users simultaneously.
- **Dispute Workflow**: Consumers can flag a bill as "DISPUTED," which freezes the "PAID" status and alerts an admin for manual review.
- **Advanced Analytics**: CSV and PDF exports for audit-ready financial reporting.

### Phase 3: Visual & UX Mastery
- **Glassmorphism UI**: A high-definition, energy-themed dashboard built with Angular 18 and CSS.
- **Angular Animations**: Fluid transitions that provide visual feedback for complex data changes.
- **Stealth Portal**: A hidden admin entry point triggered by specific keyboard sequences or secret URLs for enhanced privacy.

## 5. Security & Compliance Layer
- **Secret Management**: Strict `.gitignore` rules prevent sensitive keys and MongoDB strings from ever reaching public repositories.
- **Idempotency Handling**: The Stripe Webhook handler verifies event IDs to prevent duplicate payment processing.
- **CORS Protection**: Explicitly restricted communication between the Angular frontend and Node.js backend.
