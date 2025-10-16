from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import grammar, speak, write, describe, notifications

app = FastAPI(title="English Learning App Backend")

# Add CORS middleware first
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server + React
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
