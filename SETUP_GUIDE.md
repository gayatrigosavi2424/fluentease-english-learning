# English Learning App Setup Guide

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the backend server:**
   ```bash
   python start.py
   ```
   
   The backend will run on `http://127.0.0.1:8000`

## Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will run on `http://localhost:5173`

## Environment Variables

Make sure the `.env` file in the backend directory contains:
```
GEMINI_API_KEY=AIzaSyDUA-PPeaPIzKNc5VJTpIbTgYRJlstGLq4
VITE_BACKEND_URL=http://localhost:8000
PEXELS_API_KEY=i17QoTe4noXi5a7KbWANoZXPpSMQ5ylldJAy7vSWBy0da1gNqN4zNr0X
```

## Features Fixed

✅ **Grammar Checking**: Uses Gemini AI to check grammar and provide feedback
✅ **Speech Recognition**: Uses Whisper to transcribe audio and Gemini for feedback  
✅ **Writing Analysis**: Analyzes written text for quality and provides scores
✅ **CORS Configuration**: Properly configured for frontend-backend communication
✅ **Error Handling**: Proper error handling and user feedback
✅ **Progress Tracking**: Scores are calculated and saved to user progress

## API Endpoints

- `POST /grammar/check` - Check grammar of text
- `POST /speak/feedback` - Upload audio file for speech analysis
- `POST /write/feedback` - Analyze written text

## Troubleshooting

1. **Backend not starting**: Make sure you're in the backend directory and virtual environment is activated
2. **Frontend API errors**: Ensure backend is running on port 8000
3. **Audio upload issues**: Check that your browser has microphone permissions
4. **Gemini API errors**: Verify your API key is valid and has quota remaining