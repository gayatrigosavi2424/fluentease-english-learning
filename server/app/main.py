from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import speech, grammar  # import routes

app = FastAPI()

# ✅ CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to specific frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Root route for testing
@app.get("/")
def read_root():
    return {"message": "Server is running"}

# ✅ Now include routers AFTER app is defined
app.include_router(speech.router)
app.include_router(grammar.router)
