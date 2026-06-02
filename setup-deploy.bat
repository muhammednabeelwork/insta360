@echo off
REM GitHub & Vercel Deployment Setup Script for Windows

echo.
echo ===============================================
echo  Insta360 Deployment Setup
echo ===============================================
echo.

cd /d c:\Nabeel\app\insta360

echo [Step 1/6] Checking Node.js and npm...
call node --version
call npm --version
echo.

echo [Step 2/6] Installing dependencies...
call npm install
echo.

echo [Step 3/6] Testing build...
call npm run build
echo.

echo [Step 4/6] Initializing Git repository...
call git init
call git add .
call git commit -m "Initial commit: Insta360 project"
echo.

echo [Step 5/6] Installing Vercel CLI globally...
call npm install -g vercel
echo.

echo ===============================================
echo  Setup Complete!
echo ===============================================
echo.
echo Next steps:
echo 1. Create GitHub repository at github.com/new
echo 2. Run: git remote add origin https://github.com/YOUR_USERNAME/insta360.git
echo 3. Run: git push -u origin main
echo 4. Install Vercel CLI: vercel login
echo 5. Deploy: vercel --prod
echo.
echo See QUICK_START.md for detailed instructions.
echo.
pause
