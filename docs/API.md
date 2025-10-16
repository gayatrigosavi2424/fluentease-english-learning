# 🔌 API Documentation

FluentEase backend API built with FastAPI provides endpoints for AI-powered English learning features.

## 🌐 Base URL

- **Development**: `http://127.0.0.1:8000`
- **Production**: `https://your-api-domain.com`

## 🔐 Authentication

Most endpoints require Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## 📋 Endpoints Overview

### Grammar Analysis
- `POST /grammar/check` - Analyze text for grammar mistakes

### Speaking Practice  
- `POST /speak/feedback` - Analyze speech audio for feedback

### Writing Practice
- `POST /write/feedback` - Evaluate writing submissions

### Image Description
- `GET /describe/image` - Get random image for description
- `POST /describe/feedback` - Analyze image descriptions

### Notifications
- `POST /notifications/preferences` - Update notification settings
- `GET /notifications/preferences/{user_id}` - Get notification preferences
- `POST /notifications/test-email` - Send test emails

## 📝 Detailed Endpoints

### Grammar Check

**POST** `/grammar/check`

Analyze text for grammar, spelling, and punctuation errors using AI.

**Request Body:**
```json
{
  "text": "I are learning english very good."
}
```

**Response:**
```json
{
  "input_text": "I are learning english very good.",
  "corrected_text": "I am learning English very well.",
  "feedback": "📊 GRAMMAR ANALYSIS RESULTS: 3 mistake(s) found\n\n🔍 ERROR #1:\n   ❌ Wrong: \"I are\"\n   ✅ Correct: \"I am\"\n   📝 Rule: Subject-verb agreement\n\n🔍 ERROR #2:\n   ❌ Wrong: \"english\"\n   ✅ Correct: \"English\"\n   📝 Rule: Proper noun capitalization\n\n🔍 ERROR #3:\n   ❌ Wrong: \"very good\"\n   ✅ Correct: \"very well\"\n   📝 Rule: Adverb usage with verbs",
  "score": 6
}
```

**Error Responses:**
- `400` - Invalid request (empty text)
- `500` - Internal server error

---

### Speaking Feedback

**POST** `/speak/feedback`

Analyze uploaded audio for pronunciation, grammar, and fluency.

**Request:**
- Content-Type: `multipart/form-data`
- File: Audio file (WAV, MP3, etc.)

**Response:**
```json
{
  "transcript": "Hello, my name is John and I love learning English.",
  "feedback": "📊 SPEECH ANALYSIS RESULTS: 0 issue(s) found\n\n✅ EXCELLENT! Your speech was clear and grammatically correct!",
  "score": 9,
  "detailed_scores": {
    "pronunciation": 9,
    "grammar": 9,
    "fluency": 8,
    "vocabulary": 9
  },
  "mistakes": ["✅ No speech errors found! Excellent speaking!"],
  "strengths": ["✅ Good length - you spoke for a substantial amount", "✅ Clear pronunciation"],
  "suggestions": ["💡 Keep practicing regularly", "💡 Try speaking for longer periods"]
}
```

---

### Writing Feedback

**POST** `/write/feedback`

Evaluate writing submissions for grammar, style, and content.

**Request Body:**
```json
{
  "text": "Learning English is very important for my career. It helps me communicate with international clients and opens up new opportunities.",
  "topic": "Why is learning English important?"
}
```

**Response:**
```json
{
  "feedback": "Excellent writing! Your response is well-structured and addresses the topic effectively.",
  "score": 8,
  "detailed_scores": {
    "grammar": 9,
    "vocabulary": 8,
    "structure": 8,
    "content": 8
  },
  "mistakes": ["✅ No major grammar mistakes found!"],
  "strengths": ["✅ Clear topic focus", "✅ Good sentence variety"],
  "suggestions": ["💡 Try using more advanced vocabulary", "💡 Add specific examples"]
}
```

---

### Random Image

**GET** `/describe/image`

Get a random image for description practice.

**Response:**
```json
{
  "image_url": "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg",
  "description": "A beautiful sunset over a calm lake with mountains in the background",
  "prompt": "Describe this peaceful landscape scene"
}
```

---

### Description Feedback

**POST** `/describe/feedback`

Analyze image description text for vocabulary and descriptive quality.

**Request Body:**
```json
{
  "text": "This image shows a beautiful sunset with orange and pink colors in the sky. There is a calm lake reflecting the sky, and mountains can be seen in the distance."
}
```

**Response:**
```json
{
  "feedback": "Great job on your description! Here's some feedback:\n\n✅ What you did well:\n- You wrote 32 words, showing good effort\n- Your description shows attention to detail\n- Good use of color descriptions\n- Nice use of spatial relationships (distance, reflection)\n\n💡 Areas for improvement:\n- Try to use more descriptive adjectives\n- Consider describing what people might be feeling\n- Add sensory details beyond just visual",
  "score": 8
}
```

---

### Notification Preferences

**POST** `/notifications/preferences`

Update user's email notification preferences.

**Request Body:**
```json
{
  "user_id": "firebase-user-id",
  "preferences": {
    "email_reminders": true,
    "reminder_time": "19:00",
    "streak_reminders": true,
    "achievement_notifications": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification preferences updated successfully"
}
```

---

**GET** `/notifications/preferences/{user_id}`

Get user's current notification preferences.

**Response:**
```json
{
  "email_reminders": true,
  "reminder_time": "19:00",
  "streak_reminders": true,
  "achievement_notifications": true
}
```

---

### Test Email

**POST** `/notifications/test-email`

Send a test email to verify email configuration.

**Request Body:**
```json
{
  "email": "user@example.com",
  "type": "streak_reminder",
  "user_name": "John Doe",
  "current_streak": 5,
  "longest_streak": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test streak_reminder email sent successfully"
}
```

**Email Types:**
- `streak_reminder` - Daily streak maintenance reminder
- `streak_broken` - Encouragement after streak breaks
- `achievement` - Achievement unlock celebration

---

## 🔍 Health Check

**GET** `/health`

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "endpoints": {
    "grammar": "/grammar/check",
    "speak": "/speak/feedback",
    "write": "/write/feedback",
    "describe_image": "/describe/image",
    "describe_feedback": "/describe/feedback"
  }
}
```

## 📊 Rate Limits

- **Grammar Check**: 100 requests per hour per user
- **Speech Analysis**: 50 requests per hour per user  
- **Email Notifications**: 10 requests per hour per user
- **Other endpoints**: 200 requests per hour per user

## 🔒 Security

### CORS Policy
The API accepts requests from:
- `http://localhost:5173` (development)
- `https://your-frontend-domain.com` (production)

### Input Validation
- Text inputs are limited to 5000 characters
- Audio files are limited to 10MB
- Email addresses are validated

### Error Handling
All endpoints return consistent error responses:

```json
{
  "detail": "Error description",
  "status_code": 400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🧪 Testing

### Using curl

```bash
# Grammar check
curl -X POST "http://127.0.0.1:8000/grammar/check" \
  -H "Content-Type: application/json" \
  -d '{"text": "I are learning english."}'

# Get random image
curl -X GET "http://127.0.0.1:8000/describe/image"

# Health check
curl -X GET "http://127.0.0.1:8000/health"
```

### Using Python requests

```python
import requests

# Grammar check
response = requests.post(
    "http://127.0.0.1:8000/grammar/check",
    json={"text": "I are learning english."}
)
print(response.json())

# Get random image
response = requests.get("http://127.0.0.1:8000/describe/image")
print(response.json())
```

## 📚 Interactive Documentation

FastAPI provides automatic interactive documentation:

- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

## 🔧 Configuration

### Environment Variables

Required environment variables for the API:

```env
GEMINI_API_KEY=your_gemini_api_key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FROM_NAME=FluentEase Learning
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
```

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication and Firestore
3. Download service account credentials
4. Set the credentials path in environment variables

### Email Setup

1. Enable 2-factor authentication on Gmail
2. Generate an app password
3. Use the app password in EMAIL_PASSWORD

## 🚀 Deployment

The API can be deployed to various platforms:

- **Railway**: Automatic deployment from GitHub
- **Heroku**: Using Procfile and requirements.txt
- **DigitalOcean**: App Platform deployment
- **AWS**: Using Lambda or EC2

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed deployment instructions.

## 📞 Support

For API-related issues:
- Check the interactive documentation at `/docs`
- Review error messages and status codes
- Verify environment variables and configuration
- Open a GitHub issue with API endpoint details

---

**Happy coding! 🚀**