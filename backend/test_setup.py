"""
Quick setup test script
Run this to check what's configured correctly
"""
import os
import sys
from pathlib import Path

print("=" * 50)
print("FluentEase Backend Setup Check")
print("=" * 50)
print()

# Check Python version
print(f"✓ Python version: {sys.version.split()[0]}")
print()

# Check if .env exists
env_file = Path(".env")
if env_file.exists():
    print("✓ .env file found")
    
    # Check for required variables
    with open(".env", "r") as f:
        env_content = f.read()
        
    if "GEMINI_API_KEY" in env_content:
        print("  ✓ GEMINI_API_KEY is set")
    else:
        print("  ✗ GEMINI_API_KEY is missing")
        
    if "FIREBASE_CREDENTIALS_PATH" in env_content:
        print("  ✓ FIREBASE_CREDENTIALS_PATH is set")
    else:
        print("  ✗ FIREBASE_CREDENTIALS_PATH is missing")
else:
    print("✗ .env file NOT found")
    print("  → Create .env file from .env.example")

print()

# Check for Firebase credentials
firebase_creds = Path("firebase-credentials.json")
if firebase_creds.exists():
    print("✓ firebase-credentials.json found")
    print(f"  File size: {firebase_creds.stat().st_size} bytes")
else:
    print("✗ firebase-credentials.json NOT found")
    print("  → Download from Firebase Console")
    print("  → See FIREBASE_SETUP.md for instructions")

print()

# Check if virtual environment is activated
if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
    print("✓ Virtual environment is activated")
else:
    print("⚠ Virtual environment might not be activated")
    print("  → Run: venv\\Scripts\\activate")

print()

# Check required packages
print("Checking required packages...")
required_packages = [
    "fastapi",
    "uvicorn",
    "google-generativeai",
    "firebase-admin",
    "python-dotenv"
]

missing_packages = []
for package in required_packages:
    try:
        __import__(package.replace("-", "_"))
        print(f"  ✓ {package}")
    except ImportError:
        print(f"  ✗ {package} - NOT INSTALLED")
        missing_packages.append(package)

if missing_packages:
    print()
    print("⚠ Missing packages detected!")
    print("  → Run: pip install -r requirements.txt")

print()
print("=" * 50)
print("Setup Check Complete")
print("=" * 50)
print()

# Provide recommendations
if not env_file.exists() or not firebase_creds.exists():
    print("⚠ SETUP INCOMPLETE")
    print()
    print("Next steps:")
    if not env_file.exists():
        print("1. Create .env file with your API keys")
    if not firebase_creds.exists():
        print("2. Download firebase-credentials.json")
        print("   → See FIREBASE_SETUP.md for help")
    print()
    print("Or run simplified version without Firebase:")
    print("  uvicorn app.main_simple:app --reload")
else:
    print("✓ SETUP LOOKS GOOD!")
    print()
    print("Start the server with:")
    print("  uvicorn app.main:app --reload")

print()
