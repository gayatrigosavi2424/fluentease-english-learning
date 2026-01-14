"""
Simplified version of main.py that works without Firebase
Use this for testing if you don't have Firebase set up yet
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import grammar, speak, write, describe

app = FastAPI(title="English Learning App Backend")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (without notifications for now)
app.include_router(grammar.router, prefix="/grammar", tags=["Grammar"])
app.include_router(speak.router, prefix="/speak", tags=["Speak"])
app.include_router(write.router, prefix="/write", tags=["Write"])
app.include_router(describe.router, prefix="/describe", tags=["Describe"])

@app.get("/")
async def root():
    return {
        "message": "Backend is running!",
        "status": "healthy",
        "note": "Running in simplified mode without Firebase"
    }

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
