# 🔧 FluentEase Backend

FastAPI backend for the FluentEase English Learning App with AI-powered features.

## 🚀 Quick Start

### Option 1: Using Start Script (Windows)

```bash
# Just double-click start.bat or run:
start.bat
```

### Option 2: Manual Setup

```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
uvicorn app.main:app --reload
```

## 📋 Prerequisites

1. **Python 3.8+** installed
2. **Firebase project** created
3. **Gemini API key** obtained
4. **Firebase credentials** downloaded

## ⚙️ Configuration

### 1. Create `.env` file

```bash
cp .env.example .env
```

### 2. Add your API keys to `.env`

```env
# Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Email Configuration (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FROM_NAME=FluentEase Learning

# Firebase
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
```

### 3. Add Firebase Credentials

1. Download `firebase-credentials.json` from Firebase Console
2. Place it in the `backend` folder
3. See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions

## 🔑 Getting API Keys

### Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy and paste into `.env`

### Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Generate new private key
4. Save as `firebase-credentials.json`

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for complete guide.

## 🧪 Testing

Once running, test these endpoints:

- **Root**: http://127.0.0.1:8000/
- **Health Check**: http://127.0.0.1:8000/health
- **API Docs**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## 📚 API Endpoints

### Grammar Analysis
- `POST /grammar/check` - Check grammar and get corrections

### Speaking Practice
- `POST /speak/feedback` - Analyze speech audio

### Writing Practice
- `POST /write/feedback` - Evaluate writing

### Image Description
- `GET /describe/image` - Get random image
- `POST /describe/feedback` - Analyze description

### Notifications
- `POST /notifications/preferences` - Update settings
- `GET /notifications/preferences/{user_id}` - Get settings

## 🔧 Troubleshooting

### "Firebase not initialized"

**Solution:**
1. Make sure `firebase-credentials.json` exists in backend folder
2. Check `.env` has correct path
3. See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

### "Gemini API error"

**Solution:**
1. Verify API key in `.env`
2. Check you have quota available
3. Generate new key if needed

### "Port 8000 already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### "Module not found"

**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── main.py         # FastAPI app
├── venv/               # Virtual environment
├── .env                # Environment variables
├── firebase-credentials.json  # Firebase key
├── requirements.txt    # Dependencies
└── start.bat          # Quick start script
```

## 🚀 Deployment

See [../DEPLOYMENT.md](../DEPLOYMENT.md) for deployment instructions.

## 📝 Development

### Adding New Endpoints

1. Create route file in `app/routes/`
2. Import in `app/main.py`
3. Add router with prefix

### Running Tests

```bash
pytest
```

## 🔒 Security

- Never commit `.env` or `firebase-credentials.json`
- Use environment variables for secrets
- Keep dependencies updated

## 📞 Support

- Check [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for Firebase issues
- See [../docs/API.md](../docs/API.md) for API documentation
- Open GitHub issue for bugs

## ✅ Checklist

Before running:
- [ ] Python 3.8+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] `.env` file created with API keys
- [ ] `firebase-credentials.json` in backend folder
- [ ] Firebase project created and configured

## 🎉 You're Ready!

Run the server and start building! 🚀