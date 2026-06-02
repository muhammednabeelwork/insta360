# GitHub & Vercel Deployment - Step by Step

## STEP 1: Initialize Git Locally

Run these commands in PowerShell:

```powershell
cd c:\Nabeel\app\insta360

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Insta360 project"
```

Expected: Git initialized with your first commit ✅

---

## STEP 2: Create GitHub Repository

1. Go to https://github.com/new
2. **Repository name:** `insta360`
3. **Description:** "Insta360 Certificate Management System"
4. **Visibility:** Public or Private (your choice)
5. **Don't** initialize with README, .gitignore, or license (you already have them)
6. Click "Create repository"

---

## STEP 3: Connect Local Git to GitHub

After creating the repo on GitHub, you'll see commands. Run these:

```powershell
cd c:\Nabeel\app\insta360

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/insta360.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

Expected: All your code pushed to GitHub ✅

---

## STEP 4: Install Vercel CLI

```powershell
npm install -g vercel

# Verify installation
vercel --version
```

Expected: Vercel CLI installed successfully ✅

---

## STEP 5: Login to Vercel

```powershell
vercel login
```

- Choose: Email or Social login (GitHub login recommended)
- Verify your email if needed
- Browser will open for authentication

Expected: Authentication successful ✅

---

## STEP 6: Deploy to Vercel

```powershell
cd c:\Nabeel\app\insta360

# Deploy to production
vercel --prod
```

When prompted:
- **Set up and deploy?** → `Y` (Yes)
- **Which scope?** → Select your account
- **Project name?** → `insta360`
- **Root directory?** → `./` (press Enter)
- **Build command?** → Leave default (press Enter) or use `npm run build`
- **Output directory?** → `dist`
- **Include source maps?** → `N` (No)

Expected: Deployment successful! You'll get a URL like `https://insta360.vercel.app` ✅

---

## STEP 7: Add Environment Variables to Vercel

After successful deployment:

```powershell
# Open Vercel dashboard
vercel env
```

Or go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these (copy values from Firebase Console and Gemini API):

| Key | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | (from Firebase) |
| `VITE_FIREBASE_AUTH_DOMAIN` | (from Firebase) |
| `VITE_FIREBASE_PROJECT_ID` | (from Firebase) |
| `VITE_FIREBASE_STORAGE_BUCKET` | (from Firebase) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | (from Firebase) |
| `VITE_FIREBASE_APP_ID` | (from Firebase) |
| `GEMINI_API_KEY` | (from Google AI Studio) |

For each variable:
- Select: **Production, Preview, Development**
- Click **Save**

Expected: All environment variables set ✅

---

## STEP 8: Add GitHub Secrets (for CI/CD)

Go to: https://github.com/YOUR_USERNAME/insta360/settings/secrets/actions

Click "New repository secret" and add:

```
VERCEL_TOKEN = (get from https://vercel.com/account/settings/tokens)
VERCEL_ORG_ID = (from Vercel Project Settings)
VERCEL_PROJECT_ID = (from Vercel Project Settings)
```

Plus all 7 Firebase/Gemini variables listed above.

Expected: GitHub Secrets configured ✅

---

## STEP 9: Test Automatic Deployment

Make a small change and push to test:

```powershell
cd c:\Nabeel\app\insta360

# Create a feature branch
git checkout -b test/deployment

# Make a small change (e.g., edit a comment in a file)
# Then commit and push
git add .
git commit -m "Test automatic deployment"
git push origin test/deployment
```

Go to GitHub and create a Pull Request. Vercel will automatically:
- Build your code
- Create a preview deployment
- Post a comment with the preview URL

Merge the PR and watch it deploy to production! 🚀

---

## Your URLs After Setup

| Purpose | URL |
|---|---|
| **Production App** | https://insta360.vercel.app |
| **GitHub Repository** | https://github.com/YOUR_USERNAME/insta360 |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Firebase Console** | https://console.firebase.google.com |
| **Gemini API Studio** | https://aistudio.google.com |

---

## Troubleshooting

### Issue: "git not recognized"
**Solution:** Install Git from https://git-scm.com and restart PowerShell

### Issue: "npm not found"
**Solution:** Install Node.js from https://nodejs.org (includes npm)

### Issue: Vercel deploy fails
**Solution:** Check build output - run `npm run build` locally first

### Issue: Environment variables not working
**Solution:** 
1. Set all vars as "Production"
2. Redeploy: `vercel --prod`
3. Wait 2-3 minutes for cache to clear

### Issue: GitHub secrets not working in workflow
**Solution:** Verify all secret names exactly match the workflow file

---

## Quick Commands Reference

```powershell
# Development
npm run dev                    # Local dev server

# Deployment
npm run build                 # Build for production
vercel --prod                 # Deploy to Vercel
git push origin main          # Push to GitHub (auto-deploys)

# Check status
vercel status                 # Check Vercel deployment status
git log --oneline            # View commit history
```

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- GitHub Docs: https://docs.github.com
- See DEPLOYMENT.md for more detailed guide
