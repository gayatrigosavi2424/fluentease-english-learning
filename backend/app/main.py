from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import grammar, speak, write, describe, notifications
import firebase_admin
from firebase_admin import credentials
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK
try:
    # Check if Firebase is already initialized
    firebase_admin.get_app()
except ValueError:
    # Initialize Firebase if not already initialized
    cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-credentials.json')
    
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print(f"✅ Firebase initialized successfully with credentials from: {cred_path}")
    else:
        print(f"⚠️ Warning: Firebase credentials not found at {cred_path}")
        print("⚠️ Some features requiring Firebase will not work")
        # Initialize with default credentials for development
        firebase_admin.initialize_app()

app = FastAPI(title="English Learning App Backend")

# Add CORS middleware first
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://fluentease-english-learning.vercel.app",
        "https://*.vercel.app"  # Allow all Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(grammar.router, prefix="/grammar", tags=["Grammar"])
app.include_router(speak.router, prefix="/speak", tags=["Speak"])
app.include_router(write.router, prefix="/write", tags=["Write"])
app.include_router(describe.router, prefix="/describe", tags=["Describe"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

@app.get("/")
async def root():
    return {"message": "Backend is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "endpoints": {
            "grammar": "/grammar/check",
            "speak": "/speak/feedback", 
            "write": "/write/feedback",
            "describe_image": "/describe/image",
            "describe_feedback": "/describe/feedback"
        }
    }
