from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
import logging
from datetime import datetime
from firebase_admin import firestore
from ..services.email_service import email_service
from ..services.notification_scheduler import notification_scheduler

logger = logging.getLogger(__name__)
router = APIRouter()
db = firestore.client()

# Request schemas
class NotificationPreferences(BaseModel):
    email_reminders: bool = True
    reminder_time: str = "19:00"  # 7 PM default
    streak_reminders: bool = True
    achievement_notifications: bool = True

class UpdatePreferencesRequest(BaseModel):
    user_id: str
    preferences: NotificationPreferences

class TestEmailRequest(BaseModel):
    email: EmailStr
    type: str  # 'streak_reminder', 'streak_broken', 'achievement'
    user_name: Optional[str] = "Test User"
    current_streak: Optional[int] = 5
    longest_streak: Optional[int] = 10
    achievement_name: Optional[str] = "Week Warrior"
    achievement_emoji: Optional[str] = "🔥"

# Response schemas
class NotificationResponse(BaseModel):
    success: bool
    message: str

@router.post("/preferences", response_model=NotificationResponse)
async def update_notification_preferences(request: UpdatePreferencesRequest):
    """Update user's notification preferences"""
    try:
        # Store preferences in Firestore
        prefs_ref = db.collection('notification_preferences').document(request.user_id)
        prefs_ref.set(request.preferences.dict())
        
        logger.info(f"Updated notification preferences for user {request.user_id}")
        
        return NotificationResponse(
            success=True,
            message="Notification preferences updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error updating notification preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update preferences")

@router.get("/preferences/{user_id}")
async def get_notification_preferences(user_id: str):
    """Get user's notification preferences"""
    try:
        prefs_ref = db.collection('notification_preferences').document(user_id)
        prefs_doc = prefs_ref.get()
        
        if prefs_doc.exists:
            return prefs_doc.to_dict()
        else:
            # Return default preferences
            default_prefs = NotificationPreferences()
            return default_prefs.dict()
            
    except Exception as e:
        logger.error(f"Error getting notification preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get preferences")

@router.post("/test-email", response_model=NotificationResponse)
async def send_test_email(request: TestEmailRequest):
    """Send a test email (for development/testing)"""
    try:
        success = False
        
        if request.type == "streak_reminder":
            success = email_service.send_streak_reminder(
                request.email,
                request.user_name,
                request.current_streak,
                request.longest_streak
            )
        elif request.type == "streak_broken":
            success = email_service.send_streak_broken_email(
                request.email,
                request.user_name,
                request.current_streak
            )
        elif request.type == "achievement":
            success = email_service.send_achievement_email(
                request.email,
                request.user_name,
                request.achievement_name,
                request.achievement_emoji
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid email type")
        
        if success:
            return NotificationResponse(
                success=True,
                message=f"Test {request.type} email sent successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email")
            
    except Exception as e:
        logger.error(f"Error sending test email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/manual-check", response_model=NotificationResponse)
async def trigger_manual_check(background_tasks: BackgroundTasks):
    """Manually trigger notification checks (for testing)"""
    try:
        background_tasks.add_task(notification_scheduler.check_inactive_users)
        background_tasks.add_task(notification_scheduler.check_broken_streaks)
        
        return NotificationResponse(
            success=True,
            message="Manual notification check triggered"
        )
        
    except Exception as e:
        logger.error(f"Error triggering manual check: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to trigger manual check")

@router.get("/history/{user_id}")
async def get_notification_history(user_id: str, days: int = 7):
    """Get user's notification history"""
    try:
        notifications_ref = db.collection('notifications').document(user_id)
        notifications_doc = notifications_ref.get()
        
        if not notifications_doc.exists:
            return {"notifications": []}
        
        notifications_data = notifications_doc.to_dict()
        
        # Get notifications for the last N days
        from datetime import datetime, timedelta
        history = []
        
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            if date in notifications_data:
                for notification in notifications_data[date]:
                    notification['date'] = date
                    history.append(notification)
        
        # Sort by timestamp (newest first)
        history.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return {"notifications": history}
        
    except Exception as e:
        logger.error(f"Error getting notification history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get notification history")

@router.delete("/history/{user_id}")
async def clear_notification_history(user_id: str):
    """Clear user's notification history"""
    try:
        notifications_ref = db.collection('notifications').document(user_id)
        notifications_ref.delete()
        
        return NotificationResponse(
            success=True,
            message="Notification history cleared"
        )
        
    except Exception as e:
        logger.error(f"Error clearing notification history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear history")

@router.get("/stats")
async def get_notification_stats():
    """Get notification system statistics"""
    try:
        # Get total users with preferences
        prefs_collection = db.collection('notification_preferences')
        prefs_docs = prefs_collection.stream()
        
        total_users = 0
        email_enabled = 0
        streak_reminders_enabled = 0
        
        for doc in prefs_docs:
            total_users += 1
            prefs = doc.to_dict()
            if prefs.get('email_reminders', True):
                email_enabled += 1
            if prefs.get('streak_reminders', True):
                streak_reminders_enabled += 1
        
        return {
            "total_users_with_preferences": total_users,
            "email_reminders_enabled": email_enabled,
            "streak_reminders_enabled": streak_reminders_enabled,
            "scheduler_running": notification_scheduler.is_running
        }
        
    except Exception as e:
        logger.error(f"Error getting notification stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get stats")