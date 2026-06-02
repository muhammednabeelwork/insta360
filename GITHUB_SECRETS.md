# GitHub Secrets Setup Guide

To enable automatic deployment with GitHub Actions, you need to set up secrets in your GitHub repository.

## Steps to Add Secrets

### 1. Go to Your Repository Settings
- Visit: `https://github.com/YOUR_USERNAME/insta360/settings/secrets/actions`
- Or: Repository → Settings → Secrets and variables → Actions

### 2. Add the Following Secrets

Click "New repository secret" for each:

| Secret Name | Value | Where to Find |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Your Firebase API Key | Firebase Console → Project Settings → Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase Auth Domain | Firebase Console → Project Settings (e.g., `your-app.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID | Firebase Console → Project Settings |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase Storage Bucket | Firebase Console → Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Sender ID | Firebase Console → Project Settings |
| `VITE_FIREBASE_APP_ID` | Your Firebase App ID | Firebase Console → Project Settings |
| `GEMINI_API_KEY` | Your Google Gemini API Key | [Google AI Studio](https://aistudio.google.com) → API Keys |
| `VERCEL_TOKEN` | Your Vercel API Token | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Your Vercel Organization ID | Vercel Dashboard → Settings → General |
| `VERCEL_PROJECT_ID` | Your Vercel Project ID | Vercel Dashboard → Project Settings → General |

## Getting Your Vercel Token

1. Go to [Vercel Settings](https://vercel.com/account/settings/tokens)
2. Click "Create Token"
3. Name it "GitHub Actions"
4. Copy and paste into GitHub Secrets as `VERCEL_TOKEN`

## Getting Your Vercel Project ID

After first deployment:
1. Go to Vercel Dashboard → Your Project
2. Go to Settings → General
3. Copy Project ID and Org ID into GitHub Secrets

---

## Environment Variables (.env.local for local development)

Create a `.env.local` file in your project root:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_gemini_api_key
```

**Note:** This file is in `.gitignore`, so it won't be pushed to GitHub.
