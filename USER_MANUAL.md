# 📘 EnergI — Platform Operations Manual

Welcome to **EnergI**, your high-tech "Meter-to-Cash" SaaS platform. This manual provides a step-by-step guide to every functionality within the system, from initial registration to final payment.

---

## 🚀 1. Getting Started: Registration

### 🛡️ For Administrators (Utility Managers)
1.  **Create Org**: Navigate to the Registration page and select the **Admin** tab.
2.  **Submit Details**: Enter your Name, Email, Organization Name, and a unique **Society Slug/ID** (e.g., `green-valley`).
3.  **Branding**: Upload your **Company Logo** and an **Authorized Signature** (used for legal PDF invoices).
4.  **Access**: Once submitted, you will be redirected to the Admin Console.

### 🏠 For Consumers (Residents/Users)
1.  **Join Org**: Select the **Consumer** tab on the Registration page.
2.  **Select Society**: You **must** enter the exact **Society ID** provided by your administrator (e.g., `green-valley`).
3.  **Profile**: Enter your Name, Email, and Phone.
4.  **Meter Binding**: Provide your Meter Number (provided by the utility).
5.  **Access**: After registration, you enter your personal Consumer Dashboard.

---

## 🛡️ 2. Administrator Guide (The War Room)

### 📊 Dashboard & Command Center
*   **Analytics**: View total collected, pending, and overdue revenue via the **Revenue Mix** bar.
*   **Batch Operations**: Trigger the monthly billing cycle for all users at once by clicking **"Run Monthly Cycle"** or using the shortcut `Cmd + Shift + B`.
*   **Collection Health**: Monitor the real-time percentage of successful collections.

### 📡 IoT Live Hub (Smart Metering)
*   **Real-Time Monitoring**: View a list of all active Smart Meters in your network.
*   **Digital Matrix**: Watch live readings tick as energy is consumed in real-time.
*   **Load Analysis**: Identify high-consumption users instantly via the "Load Bars."

### 👥 Consumer Management
*   **Onboarding**: Add new consumers manually or review registered users.
*   **Smart Meter Toggle**: While adding/editing a consumer, toggle **"Enable Smart Meter"** to switch them from manual readings to automated IoT tracking.
*   **Consumption Rate**: Set a custom "Usage Rate" for IoT users to simulate different household sizes.

### ⚡ Tariff & Settings
*   **Slab Configuration**: Define energy price brackets (e.g., 0-100 units = ₹5, 100+ = ₹8).
*   **Tax & Fees**: Configure fixed service charges and percentage-based taxes that apply automatically to every bill.
*   **Early Bird Incentives**: Set a discount percentage for users who pay early (e.g., "5% off if paid within 7 days").

---

## 🏠 3. Consumer Guide (Energy Intelligence)

### 🏠 Personal Dashboard
*   **Welcome 👋**: A personalized greeting welcoming you by name.
*   **Live Digital Meter**: If your administrator has enabled a Smart Meter, you will see a **Live Ticking Meter** showing your exact consumption to 4 decimal places.
*   **Energy Intelligence**: View your **Consumption Trend** (Is it increasing or decreasing?) and the **Slab Advisor** (Tips on how to stay in a cheaper tariff bracket).

### 🧾 Bill Management & Payment
*   **Current Bill**: View a high-impact card showing your latest amount due.
*   **Early Bird Alert ✨**: If eligible, a glowing banner will show how much you can save by paying immediately.
*   **Secure Payment**: Click **"Pay Now"** to be redirected to the secure **Stripe Payment Gateway**. Once paid, your status updates instantly.
*   **Download PDF**: Get professional, legal-grade invoices with the utility logo and signature.

### ⚠️ Disputes & Notifications
*   **Dispute a Bill**: If you notice a reading error, click "Raise Dispute." The bill will be frozen (Admin cannot collect) until the manager reviews your notes.
*   **Instant Alerts**: Receive notifications for new bills, payment confirmations, or dispute updates.

---

## ✨ 4. Advanced Platform Features

### 🎞️ Showcase Mode
*   **What it is**: Designed for demonstrations. 
*   **How to use**: Toggle **"Showcase Mode"** in the sidebar footer. 
*   **Effect**: It fills empty dashboards with beautiful "Sample Data" and Trends. This allows you to show off the platform's intelligence even if you haven't generated any real bills yet.

### ⌨️ Pro Shortcuts (Admin)
*   **`Command + Shift + B`**: Instant trigger for Batch Billing.

---

> [!NOTE]
> **Data Integrity**: Always ensure your **Organization Slug** is unique during registration, as this serves as the primary "Handshake" between your utility and your consumers.
