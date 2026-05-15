# 👑 Super Admin "God-Mode" Feature Roadmap

This document outlines the priority features for the EnergI Super Admin portal to ensure total platform oversight and the ability to resolve any "stuck" processes.

## 🛠 Phase 1: Troubleshooting & Crisis Control
*Focus: Fixing things when they go wrong.*

- [ ] **Advanced JSON Data Surgeon**
    - **Feature**: Direct inline editing of MongoDB documents within the dashboard.
    - **Purpose**: Fix corrupted meter readings, adjust billing dates, or manually update user roles if a process gets stuck.
    - **Safety**: Implement "Dry Run" and "Validation" before saving.

- [x] **Global Maintenance Toggle**
    - **Feature**: A master switch to put specific Orgs or the entire platform into Maintenance Mode.
    - **Purpose**: Prevent data corruption during database migrations or when patching critical bugs.
    - **UI**: Display a custom professional banner to all affected users.

- [ ] **Scheduled Job Dashboard**
    - **Feature**: Real-time status of the Billing Scheduler and IoT Emulator.
    - **Purpose**: See if the midnight billing run succeeded. Add a "Manually Trigger Now" button for testing or recovery.

## 📈 Phase 2: Visibility & Monitoring
*Focus: Seeing what is happening in real-time.*

- [ ] **System Audit Log Feed**
    - **Feature**: A scrolling log of all critical actions (logins, org creations, failed payments, AI timeouts).
    - **Purpose**: Immediate visibility into "Why is a user reporting an error?" without checking server terminals.

- [ ] **Performance & Health Metrics**
    - **Feature**: Track API response times, DB slow queries, and memory trends.
    - **Purpose**: Detect memory leaks or bottlenecked organizations before they crash the server.

- [ ] **AI Usage & Cost Auditing**
    - **Feature**: Breakdown of Gemini token usage per Organization.
    - **Purpose**: Identify "noisy" tenants who are consuming too much AI quota and adjust their billing limits.

## 🚀 Phase 3: Platform Scalability
*Focus: Managing the growth of the SaaS.*

- [ ] **White-Label Configuration**
    - **Feature**: Upload logos, set primary colors, and define custom domain settings for new Organizations.
    - **Purpose**: Make onboarding a new Utility client take 5 minutes instead of hours of manual setup.

- [ ] **Bulk Impersonation & Testing**
    - **Feature**: Quick-switch between Admin and Consumer views of the same Org.
    - **Purpose**: Faster debugging of reported UI issues across different user roles.

- [ ] **Global Notification Broadcast**
    - **Feature**: Send an "Urgent System Alert" to all connected users across all organizations.
    - **Purpose**: Announce new features, price changes, or system maintenance.

---

### ✅ Completed Milestones
- [x] **Real-time V8 Memory Monitoring** (Heap tracking & Health status).
- [x] **Live Online Members Count** (Active sessions in last 5 minutes).
- [x] **Live Telemetry Drill-down** (Click to see exactly who is online).
- [x] **Gemini Quota Telemetry** (Real-time TPM/RPM tracking).
- [x] **Organization Freeze/Unfreeze** (Multi-tenant lock system).
- [x] **Basic User Impersonation** (Login as any user).
