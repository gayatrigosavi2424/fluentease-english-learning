# 🚀 Deployment Guide

This guide covers deploying FluentEase to various platforms.

## 📋 Prerequisites

- GitHub repository with your code
- Firebase project configured
- Google Gemini API key
- Email account for notifications (Gmail recommended)

## 🌐 Frontend Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Select the `client` folder as root directory

2. **Environment Variables**
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   VITE_API_URL=https://your-backend-url.com
   ```

3. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Netlify

1. **Connect Repository**
   - Go to [Netlify](https://netlify.com)
   - Connect your GitHub repository
   - Set base directory to `client`

2. **Build Settings**
   ```
   Base directory: client
   Build command: npm run build
   Publish directory: client/dist
   ```

3. **Environment Variables**
   - Add the same variables as Vercel in Site Settings > Environment Variables

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Hosting**
   ```bash
   cd client
   firebase init hosting
   # Select your Firebase project
   # Set public directory to 'dist'
   # Configure as single-page app: Yes
   ```

3. **Deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## 🔧 Backend Deployment

### Railway (Recommended)

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Create new project from GitHub repo
   - Select the `backend` folder

2. **Environment Variables**
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   EMAIL_ADDRESS=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   FROM_NAME=FluentEase Learning
   FIREBASE_CREDENTIALS_PATH=/app/firebase-credentials.json
   PORT=8000
   ```

3. **Add Firebase Credentials**
   - Upload your Firebase service account JSON file
   - Set the path in environment variables

4. **Procfile** (create in backend folder)
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create App**
   ```bash
   cd backend
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set GEMINI_API_KEY=your_key
   heroku config:set EMAIL_ADDRESS=your_email
   # ... add all other variables
   ```

4. **Deploy**
   ```bash
   git subtree push --prefix backend heroku main
   ```

### DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository
   - Select the `backend` folder

2. **Configure Service**
   ```yaml
   name: fluentease-backend
   source_dir: /backend
   github:
     repo: your-username/fluentease-english-learning
     branch: main
   run_command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   environment_slug: python
   instance_count: 1
   instance_size_slug: basic-xxs
   ```

3. **Environment Variables**
   - Add all required environment variables in the dashboard

## 📧 Email Scheduler Deployment

### Background Service (Railway/Heroku)

1. **Create Separate Service**
   - Deploy the scheduler as a separate worker service
   - Use the same codebase but different start command

2. **Procfile for Scheduler**
   ```
   worker: python app/scheduler_main.py
   ```

3. **Environment Variables**
   - Same as backend deployment
   - Ensure Firebase credentials are accessible

### Cron Job (VPS/Dedicated Server)

1. **Server Setup**
   ```bash
   # Install dependencies
   pip install -r requirements.txt
   
   # Create cron job
   crontab -e
   
   # Add daily check at 7 PM
   0 19 * * * /usr/bin/python3 /path/to/app/scheduler_main.py
   ```

2. **Systemd Service** (Linux)
   ```ini
   [Unit]
   Description=FluentEase Email Scheduler
   After=network.target
   
   [Service]
   Type=simple
   User=your-user
   WorkingDirectory=/path/to/backend
   ExecStart=/usr/bin/python3 app/scheduler_main.py
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```

## 🔒 Security Configuration

### CORS Settings
Update backend CORS origins for production:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",
        "https://your-app.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /streaks/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /notifications/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /notification_preferences/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📊 Monitoring & Analytics

### Error Tracking (Sentry)

1. **Install Sentry**
   ```bash
   # Frontend
   npm install @sentry/react @sentry/tracing
   
   # Backend
   pip install sentry-sdk[fastapi]
   ```

2. **Configure Sentry**
   ```javascript
   // Frontend
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "your-sentry-dsn",
     environment: "production"
   });
   ```

   ```python
   # Backend
   import sentry_sdk
   from sentry_sdk.integrations.fastapi import FastApiIntegration
   
   sentry_sdk.init(
       dsn="your-sentry-dsn",
       integrations=[FastApiIntegration()],
       environment="production"
   )
   ```

### Performance Monitoring

1. **Frontend Analytics**
   - Google Analytics 4
   - Vercel Analytics
   - Web Vitals monitoring

2. **Backend Monitoring**
   - Railway/Heroku metrics
   - Custom health check endpoints
   - Database performance monitoring

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install and test frontend
        run: |
          cd client
          npm install
          npm run test
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install and test backend
        run: |
          cd backend
          pip install -r requirements.txt
          # Add tests when available

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./client

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v1.0.0
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: "backend"
```

## 🌍 Domain Configuration

### Custom Domain Setup

1. **Frontend Domain**
   - Configure DNS to point to your hosting provider
   - Set up SSL certificate (usually automatic)
   - Update CORS settings in backend

2. **Backend Domain**
   - Configure subdomain (api.yourdomain.com)
   - Update frontend API_URL
   - Set up SSL certificate

3. **Email Domain**
   - Configure SPF/DKIM records for better deliverability
   - Set up custom from address if needed

## 📈 Scaling Considerations

### Database Scaling
- Monitor Firebase usage and upgrade plan if needed
- Consider database indexing for better performance
- Implement data archiving for old records

### API Scaling
- Use Redis for caching frequent requests
- Implement rate limiting
- Consider CDN for static assets

### Email Scaling
- Monitor email sending limits
- Consider dedicated email service (SendGrid, Mailgun)
- Implement email queuing for high volume

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check allowed origins in backend
   - Verify frontend URL configuration

2. **Firebase Connection Issues**
   - Verify credentials file path
   - Check Firebase project permissions

3. **Email Delivery Issues**
   - Verify SMTP credentials
   - Check spam folders
   - Monitor email provider limits

4. **Build Failures**
   - Check environment variables
   - Verify dependency versions
   - Review build logs

### Health Checks

Add health check endpoints:
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review platform-specific documentation
3. Open a GitHub issue with deployment details
4. Contact support@fluentease.com for urgent issues

---

**Happy Deploying! 🚀**