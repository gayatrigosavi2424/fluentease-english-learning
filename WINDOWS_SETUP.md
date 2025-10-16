# 🚀 Windows Setup Guide - English Learning App

## Quick Fix for Python 3.13.5 Compatibility Issues

### Option 1: Automated Fix (Recommended)

1. **Open Command Prompt as Administrator**
2. **Navigate to your project:**
   ```cmd
   cd "C:\Users\Gaytri Gosavi\OneDrive\Desktop\english-learning-app"
   ```

3. **Run the automated fix:**
   ```cmd
   cd backend
   fix_setup.bat
   ```

### Option 2: Manual Fix

1. **Delete old virtual environment:**
   ```cmd
   cd backend
   rmdir /s /q venv
   ```

2. **Create fresh virtual environment:**
   ```cmd
   python -m venv venv
   ```

3. **Activate virtual environment:**
   ```cmd
   venv\Scripts\activate
   ```

4. **Upgrade pip:**
   ```cmd
   python -m pip install --upgrade pip
   ```

5. **Install dependencies:**
   ```cmd
   pip install -r requirements.txt
   ```

6. **Start backend:**
   ```cmd
   python start.py
   ```

## Frontend Setup (Separate Terminal)

1. **Open NEW Command Prompt**
2. **Navigate to client:**
   ```cmd
   cd "C:\Users\Gaytri Gosavi\OneDrive\Desktop\english-learning-app\client"
   ```

3. **Install dependencies (first time only):**
   ```cmd
   npm install
   ```

4. **Start frontend:**
   ```cmd
   npm run dev
   ```

## Expected Results

✅ **Backend**: http://127.0.0.1:8000  
✅ **Frontend**: http://localhost:5173  

## Troubleshooting

### If you still get pydantic_core errors:

```cmd
# Try installing specific versions
pip install pydantic==2.10.0 --force-reinstall
pip install fastapi==0.115.0 --force-reinstall
```

### If Whisper installation fails:

```cmd
# Install without Whisper first
pip install fastapi uvicorn pydantic python-dotenv google-generativeai
# Then try Whisper separately
pip install openai-whisper
```

### Alternative: Use Python 3.11 or 3.12

If issues persist, consider using Python 3.11 or 3.12 which have better package compatibility:

1. Download Python 3.11 from python.org
2. Install it
3. Create new virtual environment with: `py -3.11 -m venv venv`

## Quick Commands Summary

**Backend (Terminal 1):**
```cmd
cd backend
venv\Scripts\activate
python start.py
```

**Frontend (Terminal 2):**
```cmd
cd client  
npm run dev
```

## Need Help?

If you're still having issues, try these commands one by one and let me know where it fails:

```cmd
cd backend
python --version
pip --version
venv\Scripts\activate
pip list
python -c "import fastapi"
```