# 🌟 FluentEase - AI-Powered English Learning App

[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-green.svg)](https://fastapi.tiangolo.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Admin-orange.svg)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-purple.svg)](https://ai.google.dev/)

A comprehensive English learning platform with AI-powered feedback, GitHub-style streak tracking, and personalized email notifications.

![FluentEase Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=FluentEase+English+Learning+App)

## ✨ Features

### 🎯 Core Learning Modules
- **🎤 Speaking Practice** - Real-time speech recognition with pronunciation feedback
- **✍️ Writing Practice** - AI grammar checking with exact mistake detection
- **🖼️ Image Description** - Vocabulary building through visual storytelling

### 🤖 AI-Powered Analysis
- **Gemini AI Integration** - Advanced grammar and speech analysis
- **Exact Mistake Detection** - Specific error identification with corrections
- **Personalized Feedback** - Tailored suggestions for improvement
- **Multi-aspect Scoring** - Pronunciation, grammar, fluency, and vocabulary scores

### 🔥 GitHub-Style Streak System
- **Daily Activity Tracking** - Visual contribution calendar
- **Streak Counters** - Current and longest streak tracking
- **Achievement Badges** - 8 different milestones to unlock
- **Progress Analytics** - Weekly and monthly statistics

### 📧 Smart Email Notifications
- **Daily Reminders** - Automated streak maintenance emails
- **Broken Streak Recovery** - Encouraging comeback messages
- **Achievement Celebrations** - Milestone unlock notifications
- **Customizable Preferences** - User-controlled notification settings

### 🔐 User Management
- **Firebase Authentication** - Secure login/signup system
- **Progress Tracking** - Persistent user data storage
- **Profile Management** - Comprehensive user dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Firebase project
- Google Gemini API key
- Gmail account (for email notifications)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/fluentease-english-learning.git
cd fluentease-english-learning
```

### 2. Frontend Setup
```bash
cd client
npm install
cp .env.example .env
# Edit .env with your Firebase config
npm run dev
```

### 3. Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn app.main:app --reload
```

### 4. Email Notifications (Optional)
```bash
# Start the notification scheduler
python app/scheduler_main.py
```

## 📁 Project Structure

```
fluentease-english-learning/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── StreakCalendar.jsx
│   │   │   ├── StreakStats.jsx
│   │   │   ├── StreakAchievements.jsx
│   │   │   └── NotificationSettings.jsx
│   │   ├── pages/              # Main application pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Speak.jsx
│   │   │   ├── Write.jsx
│   │   │   ├── Describe.jsx
│   │   │   ├── Streaks.jsx
│   │   │   └── Profile.jsx
│   │   ├── services/           # API and utility services
│   │   │   ├── api.js
│   │   │   ├── progress.js
│   │   │   └── streaks.js
│   │   └── context/            # React context providers
│   └── package.json
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── routes/             # API endpoints
│   │   │   ├── grammar.py
│   │   │   ├── speak.py
│   │   │   ├── write.py
│   │   │   ├── describe.py
│   │   │   └── notifications.py
│   │   ├── services/           # Business logic
│   │   │   ├── email_service.py
│   │   │   └── notification_scheduler.py
│   │   └── main.py
│   ├── requirements.txt
│   └── scheduler_main.py       # Email notification scheduler
├── docs/                       # Documentation
├── .gitignore
├── README.md
└── LICENSE
```

## 🔧 Configuration

### Frontend Environment Variables
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
```

### Backend Environment Variables
```env
# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FROM_NAME=FluentEase Learning

# Firebase
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
```

## 🎯 Usage

### For Learners
1. **Sign up** and create your profile
2. **Choose a practice mode**: Speaking, Writing, or Describing
3. **Complete exercises** and receive AI-powered feedback
4. **Track your progress** with the GitHub-style streak calendar
5. **Unlock achievements** and maintain daily learning habits
6. **Customize notifications** to stay motivated

### For Developers
1. **Extend AI models** by modifying the Gemini prompts
2. **Add new practice modes** by creating new route handlers
3. **Customize email templates** in the email service
4. **Implement new achievements** in the streak system

## 🤖 AI Integration

### Gemini AI Features
- **Grammar Analysis**: Identifies exact mistakes with corrections
- **Speech Evaluation**: Analyzes pronunciation and fluency
- **Writing Assessment**: Provides detailed feedback on composition
- **Contextual Learning**: Adapts to user's proficiency level

### API Endpoints
```
POST /grammar/check          # Grammar analysis
POST /speak/feedback         # Speech evaluation
POST /write/feedback         # Writing assessment
POST /describe/feedback      # Description analysis
```

## 📊 Analytics & Tracking

### Streak System
- Daily activity tracking with Firebase
- GitHub-style contribution calendar
- Achievement system with 8 badges
- Weekly and monthly progress reports

### User Progress
- Skill-based scoring (1-10 scale)
- Historical performance tracking
- Personalized improvement suggestions
- Export capabilities for progress data

## 📧 Email Notification System

### Automated Emails
- **Daily Reminders**: Sent at user-preferred time
- **Streak Alerts**: When streaks are at risk
- **Achievement Notifications**: Celebrating milestones
- **Recovery Messages**: Encouraging restart after breaks

### Setup Guide
See [EMAIL_SETUP_GUIDE.md](backend/EMAIL_SETUP_GUIDE.md) for detailed configuration instructions.

## 🔒 Security & Privacy

- **Firebase Authentication**: Secure user management
- **Data Encryption**: All user data encrypted at rest
- **Privacy Controls**: Users control their data and notifications
- **GDPR Compliant**: Data deletion and export capabilities

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Heroku)
```bash
cd backend
# Configure environment variables
# Deploy with your preferred platform
```

### Email Scheduler
```bash
# Run as a background service
nohup python app/scheduler_main.py &
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Style
- **Frontend**: ESLint + Prettier configuration
- **Backend**: Black + isort for Python formatting
- **Commits**: Conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for advanced language processing
- **Firebase** for authentication and database services
- **React** and **FastAPI** for the robust tech stack
- **Framer Motion** for smooth animations
- **Tailwind CSS** for beautiful styling

## 📞 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Open a GitHub issue
- **Email**: support@fluentease.com
- **Discord**: Join our community server

## 🗺️ Roadmap

- [ ] Mobile app development (React Native)
- [ ] Advanced AI tutoring with conversation practice
- [ ] Multiplayer learning challenges
- [ ] Integration with popular language learning platforms
- [ ] Voice cloning for pronunciation practice
- [ ] AR/VR immersive learning experiences

---

**Made with ❤️ for English learners worldwide**

⭐ **Star this repo if you found it helpful!**