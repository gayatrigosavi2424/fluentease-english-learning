#!/usr/bin/env python3
"""
Notification Scheduler Main Script
Run this script to start the daily email notification system.
"""

import asyncio
import logging
import os
import sys
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.notification_scheduler import notification_scheduler

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('notification_scheduler.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if Firebase is already initialized
        firebase_admin.get_app()
        logger.info("Firebase already initialized")
    except ValueError:
        # Initialize Firebase
        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase initialized successfully")
        else:
            logger.error("Firebase credentials not found. Please set FIREBASE_CREDENTIALS_PATH")
            sys.exit(1)

async def main():
    """Main function to run the notification scheduler"""
    logger.info("Starting FluentEase Notification Scheduler...")
    
    # Initialize Firebase
    initialize_firebase()
    
    # Check required environment variables
    required_vars = ['EMAIL_ADDRESS', 'EMAIL_PASSWORD', 'GEMINI_API_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please check your .env file")
        sys.exit(1)
    
    logger.info("Environment variables validated")
    logger.info(f"Email notifications will be sent from: {os.getenv('EMAIL_ADDRESS')}")
    
    try:
        # Start the scheduler
        await notification_scheduler.run_scheduler()
    except KeyboardInterrupt:
        logger.info("Received interrupt signal, shutting down...")
        notification_scheduler.stop_scheduler()
    except Exception as e:
        logger.error(f"Scheduler error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Scheduler stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)