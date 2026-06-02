# Quick Start: Deploy to GitHub & Vercel

## 🚀 5-Minute Setup

### Step 1: Create Environment File
Create `.env.local` in project root with your secrets:
```bash
cp .env.example .env.local  # if example exists, otherwise create manually
```

Add your Firebase and Gemini API keys to `.env.local`

### Step 2: Initialize Git & Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/insta360.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Step 4: Add GitHub Secrets
1. Go to GitHub → Your repo → Settings → Secrets and variables → Actions
2. Add these secrets (values from Firebase Console and Vercel Dashboard):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `GEMINI_API_KEY`
   - `VERCEL_TOKEN` (from Vercel Settings → Tokens)

### Step 5: Add Environment Variables to Vercel
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add same 7 Firebase/Gemini variables
3. Production, Preview, and Development environments

---

## 📋 Your Workflow After Setup

### To Deploy Changes:

```bash
# 1. Create feature branch
git checkout -b feature/amazing-feature

# 2. Make changes & test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Add amazing feature"
git push origin feature/amazing-feature

# 4. Create Pull Request on GitHub
# - Preview deploys automatically to Vercel
# - View preview URL in PR comments

# 5. After review, merge to main
# - Automatic production deployment to Vercel!
```

---

## 🔗 Your URLs

| Environment | URL |
|---|---|
| **Production** | `https://insta360.vercel.app` |
| **GitHub Repo** | `https://github.com/YOUR_USERNAME/insta360` |
| **Vercel Dashboard** | `https://vercel.com/dashboard` |
| **Firebase Console** | `https://console.firebase.google.com` |

---

## ✅ Testing Your Setup

```bash
# Build locally to verify
npm run build

# Check for TypeScript errors
npm run lint

# Preview production build
npm run preview
```

---

## 📚 See Also

- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
- [GITHUB_SECRETS.md](GITHUB_SECRETS.md) - Secrets configuration
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) - CI/CD pipeline
