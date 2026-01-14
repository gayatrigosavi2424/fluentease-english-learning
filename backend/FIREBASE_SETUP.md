# 🔥 Firebase Setup Guide

## Quick Setup Steps

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `FluentEase` (or any name you prefer)
4. Click "Continue"
5. Disable Google Analytics (optional for development)
6. Click "Create project"

### Step 2: Enable Authentication

1. In your Firebase project, click "Build" → "Authentication"
2. Click "Get started"
3. Click on "Email/Password" under Sign-in providers
4. Enable "Email/Password"
5. Click "Save"

### Step 3: Create Firestore Database

1. Click "Build" → "Firestore Database"
2. Click "Create database"
3. Select "Start in test mode" (for development)
4. Choose a location (closest to you)
5. Click "Enable"

### Step 4: Get Service Account Credentials

1. Click the gear icon ⚙️ (Project Settings)
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Click "Generate key" in the popup
5. A JSON file will download - this is your credentials file

### Step 5: Set Up Credentials in Your Project

1. **Rename the downloaded file** to `firebase-credentials.json`
2. **Move it to your backend folder:**
   ```
   backend/
   ├── app/
   ├── firebase-credentials.json  ← Place it here
   └── ...
   ```

### Step 6: Update .env File

Make sure your `backend/.env` file has:
```env
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
```

## ✅ Verify Setup

Run your backend:
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

You should see:
```
✅ Firebase initialized successfully with credentials from: firebase-credentials.json
```

## 🔧 Troubleshooting

### "Firebase credentials not found"
- Make sure the file is named exactly `firebase-credentials.json`
- Check it's in the `backend` folder (not in `backend/app`)
- Verify the path in `.env` is correct

### "Permission denied"
- Make sure you downloaded the correct service account key
- Try generating a new key from Firebase Console

### "Invalid credentials"
- The JSON file might be corrupted
- Download a fresh service account key
- Make sure you're using the correct Firebase project

## 🎯 Quick Test

After setup, test if Firebase is working:

1. Open browser: `http://127.0.0.1:8000/health`
2. You should see the health check response
3. No Firebase errors in the terminal

## 📝 Security Note

⚠️ **IMPORTANT**: Never commit `firebase-credentials.json` to Git!

The `.gitignore` file already excludes it, but double-check:
- Don't share this file publicly
- Don't commit it to GitHub
- Keep it secure on your local machine

## Need Help?

If you're still having issues:
1. Check the terminal for specific error messages
2. Verify all steps above are completed
3. Try generating a new service account key
4. Make sure you're in the correct Firebase project