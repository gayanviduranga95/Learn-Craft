# LearnCraft LMS — Manual Deployment Checklist

Follow this checklist when deploying LearnCraft to your production environment.

---

## 1. MongoDB Atlas Configuration
- [ ] Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
- [ ] Under **Network Access**, ensure your production hosting IP addresses (or `0.0.0.0/0` with strong authentication) are allowed.
- [ ] Under **Database Access**, verify your database user has read and write privileges for the `learncraft` database.
- [ ] Copy the standard connection string (`mongodb+srv://...`).

---

## 2. Transactional Email Provider Setup (Resend or SendGrid)
- [ ] Sign up at [Resend](https://resend.com) (Recommended) or [SendGrid](https://sendgrid.com).
- [ ] Generate an API Key with sending permissions.
- [ ] Add and verify your custom sending domain, or use Resend's onboarding test sender address.
- [ ] Set `RESEND_API_KEY=re_...` in your backend environment variables.
- [ ] Set `EMAIL_FROM="LearnCraft <notifications@yourdomain.com>"` (or your verified domain).
- [ ] *Note: In development and test runs, without an API key, the system safely falls back to console mock logging so no emails will fail or bounce.*

---

## 3. Google Cloud OAuth 2.0 Credentials
- [ ] Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
- [ ] Select or create your OAuth 2.0 Web Client.
- [ ] Under **Authorized JavaScript Origins**, add:
  - `http://localhost:5173` (for local frontend dev)
  - `https://your-frontend-domain.vercel.app` (your production frontend origin)
- [ ] Copy the **Client ID**.
- [ ] Set `GOOGLE_CLIENT_ID` in backend environment variables.
- [ ] Set `VITE_GOOGLE_CLIENT_ID` in frontend environment variables.

---

## 4. Environment Variables Checklist

### Frontend Environment Variables (`learncraft/.env` or Vercel Frontend Project)
```env
# Production Backend API URL (must include /api if not using relative rewrites)
VITE_API_URL=https://your-backend-api.vercel.app/api

# Google OAuth 2.0 Web Client ID
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Backend Environment Variables (`backend/.env` or Vercel Backend Project)
```env
PORT=5000
NODE_ENV=production

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/learncraft?retryWrites=true&w=majority

# Strong Cryptographic Secret for JWTs (at least 32 random characters)
JWT_SECRET=generate-a-strong-32-char-random-secret-here

# Production Frontend Origin (used for CORS and verification/reset links)
CLIENT_URL=https://your-frontend-domain.vercel.app

# Transactional Email Configuration
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=LearnCraft <notifications@yourdomain.com>

# Google OAuth Client ID for backend token validation
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 5. Vercel Deployment Instructions

### Option A: Separate Frontend and Backend Projects (Recommended for Vercel)
1. **Backend Deployment:**
   - In Vercel, import the repository and set the **Root Directory** to `backend`.
   - Set Framework Preset to `Other`.
   - Add all Backend Environment Variables listed above.
   - Deploy and note your backend domain (e.g., `https://learncraft-api.vercel.app`).
2. **Frontend Deployment:**
   - In Vercel, import the repository and set the **Root Directory** to `learncraft`.
   - Set Framework Preset to `Vite`.
   - Set `VITE_API_URL=https://learncraft-api.vercel.app/api`.
   - Set `VITE_GOOGLE_CLIENT_ID=...`.
   - Deploy.

---

## 6. Post-Deployment Verification
- [ ] Visit frontend in browser and confirm light/dark theme toggle works.
- [ ] Register a new test account with email/password and verify you receive a verification email.
- [ ] Click the verification link and confirm the account is marked verified.
- [ ] Log in with Google Sign-In and check session persistence across page refreshes.
- [ ] Visit "My Profile & Settings" from the header menu and test changing your avatar preset and theme.
- [ ] Request a password reset from the login screen and confirm the reset email link works.
- [ ] Ensure all instructor and course completion actions perform smoothly.
