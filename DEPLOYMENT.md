# Deployment Guide: GitHub & Vercel

## Part 1: GitHub Setup

### Step 1: Initialize Git Repository (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Create GitHub Repository
1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named `insta360` (or your preferred name)
3. Do NOT initialize with README, .gitignore, or license (you already have files)

### Step 3: Add Remote and Push
```bash
git remote add origin https://github.com/YOUR_USERNAME/insta360.git
git branch -M main
git push -u origin main
```

### Step 4: Create .gitignore
The `.gitignore` file is already configured to exclude:
- `node_modules/`
- `dist/`
- `.env.local`
- `.DS_Store`

---

## Part 2: Vercel Deployment

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Project
```bash
vercel
```

Choose the following options:
- **Set up and deploy?** Yes
- **Which scope?** Your personal account
- **Link to existing project?** No
- **Project name?** insta360
- **Root directory?** ./
- **Build command?** `npm run build`
- **Output directory?** `dist`

### Step 4: Add Environment Variables in Vercel Dashboard

After deployment, go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add the following:
```
VITE_FIREBASE_API_KEY = your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN = your_auth_domain
VITE_FIREBASE_PROJECT_ID = your_project_id
VITE_FIREBASE_STORAGE_BUCKET = your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
VITE_FIREBASE_APP_ID = your_app_id
GEMINI_API_KEY = your_gemini_api_key
```

---

## Part 3: Automatic Deployment with GitHub

### Create vercel.json Configuration

Add this file to your project root to optimize Vercel builds:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_FIREBASE_API_KEY": "@firebase_api_key",
    "VITE_FIREBASE_AUTH_DOMAIN": "@firebase_auth_domain",
    "VITE_FIREBASE_PROJECT_ID": "@firebase_project_id",
    "VITE_FIREBASE_STORAGE_BUCKET": "@firebase_storage_bucket",
    "VITE_FIREBASE_MESSAGING_SENDER_ID": "@firebase_messaging_sender_id",
    "VITE_FIREBASE_APP_ID": "@firebase_app_id",
    "GEMINI_API_KEY": "@gemini_api_key"
  }
}
```

### Connect GitHub to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `insta360` project
3. Go to **Settings → Git**
4. Click "Connect Git Repository"
5. Select your GitHub account and the `insta360` repository
6. Choose deployment settings:
   - **Production Branch:** main
   - **Preview Branches:** All branches

### Automatic Deployments

Now every time you:
- **Push to `main`** → Automatic production deployment
- **Create a pull request** → Automatic preview deployment
- **Merge PR to main** → Automatic production deployment

---

## Part 4: Workflow for Development

### 1. Local Development
```bash
git checkout -b feature/your-feature-name
npm run dev
# Make changes...
git add .
git commit -m "description of changes"
```

### 2. Create Pull Request
```bash
git push origin feature/your-feature-name
```
Then go to GitHub and create a PR. Vercel will automatically create a preview deployment.

### 3. Merge to Main (Production)
Once PR is approved:
- Click "Merge pull request" on GitHub
- Vercel automatically deploys to production

### 4. View Deployments
- **Production URL:** `https://insta360.vercel.app` (or your custom domain)
- **Preview URLs:** See in Vercel dashboard or GitHub PR comments

---

## Part 5: Firebase Functions Deployment

If you have Cloud Functions to deploy:

```bash
cd functions
npm install
npm run build

# Deploy functions
cd ..
npm run deploy-functions
```

---

## Part 6: Custom Domain (Optional)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration steps provided by Vercel

---

## Troubleshooting

### Build Fails on Vercel
- Check **Vercel Build Logs** for errors
- Ensure all environment variables are set
- Verify Node version: `npm --version` in Vercel logs

### Environment Variables Not Working
- Make sure variables start with `VITE_` for frontend
- Restart deployment after adding env vars
- Clear cache: Vercel Dashboard → Settings → Git → Clear Cache

### GitHub Push Fails
```bash
# If credentials issue:
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/insta360.git
```

---

## Quick Reference Commands

```bash
# Local development
npm run dev

# Build locally
npm run build

# Deploy to Vercel (CLI)
vercel deploy --prod

# Check Vercel status
vercel status

# View logs
vercel logs <url>
```
