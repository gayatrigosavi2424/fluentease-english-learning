#!/usr/bin/env python3
import sys
import os
import multiprocessing

# Fix for Windows multiprocessing
if __name__ == "__main__":
    multiprocessing.freeze_support()
    
    # Add the current directory to Python path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    try:
        import uvicorn
        print("✅ Starting English Learning App Backend...")
        print("📍 Backend will run on: http://127.0.0.1:8000")
        print("🔄 Auto-reload disabled for Windows compatibility")
        print("⏹️  Press Ctrl+C to stop the server")
        print("-" * 50)
        
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=False,  # Disable reload for Windows compatibility
            log_level="info"
        )
    except ImportError as e:
        print("❌ Error: Missing dependencies!")
        print("🔧 Please run: pip install -r requirements.txt")
        print(f"📝 Details: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)