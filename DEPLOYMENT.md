# 🚀 EnergI Deployment Guide

Follow these steps to deploy the EnergI platform to **Render** (Backend/Full-stack) or any Node.js hosting provider.

## 1. Prepare your GitHub Repository
Ensure all changes are pushed to your GitHub repository:
```bash
git add .
git commit -m "chore: prepare for unified deployment"
git push origin main
```

## 2. Deploy to Render (Unified Service)
Render is recommended for this setup as it can build both the frontend and backend in one service.

1.  **New Web Service**: In Render dashboard, click **New +** > **Web Service**.
2.  **Connect Repo**: Connect your `EnergI-` repository.
3.  **Configure Settings**:
    - **Name**: `energi-platform`
    - **Environment**: `Node`
    - **Build Command**: `npm run build` (This runs the frontend build as defined in the root package.json)
    - **Start Command**: `npm start`
4.  **Environment Variables**:
    Add the following keys in the **Environment** tab:
    - `NODE_ENV`: `production`
    - `PORT`: `10000` (or leave as default)
    - `MONGODB_URI`: *Your MongoDB Atlas Connection String*
    - `JWT_ACCESS_SECRET`: *Random 32+ char string*
    - `JWT_REFRESH_SECRET`: *Random 32+ char string*
    - `STRIPE_SECRET_KEY`: *Your Stripe Secret Key*
    - `STRIPE_WEBHOOK_SECRET`: *Your Stripe Webhook Secret*
    - `RESEND_API_KEY`: *Your Resend API Key*
    - `FRONTEND_URL`: `https://your-app-name.onrender.com`
    - `BACKEND_URL`: `https://your-app-name.onrender.com`

## 3. Stripe Webhook Configuration
Once the app is deployed and you have your Render URL:
1.  Go to the **Stripe Dashboard** > Developers > Webhooks.
2.  Add a new endpoint: `https://your-app-name.onrender.com/api/v1/payments/webhook`.
3.  Select events: `checkout.session.completed`.
4.  Copy the **Signing Secret** and update the `STRIPE_WEBHOOK_SECRET` in Render settings.

## 4. Verification
- Visit `https://your-app-name.onrender.com`.
- You should see the login page.
- Try registering a new account to verify database connectivity.

---
> [!TIP]
> Since we use the **Unified Service** approach, you only need to manage **one** deployment and **one** set of environment variables.
