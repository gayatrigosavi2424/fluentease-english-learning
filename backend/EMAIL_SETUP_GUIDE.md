# 📧 Email Notification Setup Guide

This guide will help you set up daily email notifications for your FluentEase English learning app.

## 🚀 Quick Setup

### 1. Gmail App Password Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. Go to [Google Account Settings](https://myaccount.google.com/)
3. Navigate to **Security** → **2-Step Verification**
4. Scroll down to **App passwords**
5. Generate a new app password for "FluentEase"
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### 2. Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_ADDRESS=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
FROM_NAME=FluentEase Learning

# Other required variables
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
```

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Run the Notification Scheduler

```bash
# Start the scheduler (runs continuously)
python app/scheduler_main.py
```

## 📅 How It Works

### Daily Schedule
- **7:00 PM**: Check for inactive users and send streak reminders
- **8:00 AM**: Check for broken streaks and send encouragement emails

### Email Types

1. **🔥 Streak Reminder**
   - Sent when user was active yesterday but not today
   - Includes current streak count and motivation
   - Only sent if user has an active streak

2. **💔 Broken Streak**
   - Sent when a user's streak is broken
   - Encourages them to start fresh
   - Celebrates their previous achievement

3. **🏆 Achievement Unlock**
   - Sent when user unlocks new badges
   - Celebrates milestones and progress

### User Preferences
Users can control their notifications in the Profile page:
- Enable/disable email reminders
- Choose reminder time
- Toggle streak reminders
- Toggle achievement notifications

## 🧪 Testing

### Test Emails
Users can send test emails from their Profile page to verify setup.

### Manual Trigger
```bash
# Trigger manual check via API
curl -X POST http://localhost:8000/notifications/manual-check
```

### Check Logs
```bash
# View scheduler logs
tail -f notification_scheduler.log
```

## 🔧 Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Make sure you're using an App Password, not your regular Gmail password
   - Verify 2-Factor Authentication is enabled

2. **"SMTP connection failed"**
   - Check your internet connection
   - Verify SMTP_SERVER and SMTP_PORT settings

3. **"Firebase not initialized"**
   - Ensure FIREBASE_CREDENTIALS_PATH points to valid credentials file
   - Check Firebase project permissions

### Email Provider Alternatives

#### Outlook/Hotmail
```env
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
```

#### Yahoo Mail
```env
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
```

## 📊 Monitoring

### Check Notification Stats
```bash
curl http://localhost:8000/notifications/stats
```

### View User Notification History
```bash
curl http://localhost:8000/notifications/history/USER_ID
```

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Use App Passwords instead of regular passwords
- Regularly rotate your email credentials
- Monitor email sending limits (Gmail: 500 emails/day)

## 🎯 Production Deployment

For production, consider:
- Using a dedicated email service (SendGrid, Mailgun, AWS SES)
- Setting up proper logging and monitoring
- Implementing rate limiting
- Using environment-specific configurations

## 📞 Support

If you encounter issues:
1. Check the logs: `notification_scheduler.log`
2. Verify environment variables
3. Test with manual email sending
4. Check Firebase connectivity

The notification system is designed to fail gracefully - if emails can't be sent, the app continues to work normally.