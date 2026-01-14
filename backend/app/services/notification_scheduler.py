import asyncio
import schedule
import time
from datetime import datetime, timedelta
from typing import List, Dict
import logging
from firebase_admin import firestore
from .email_service import email_service

logger = logging.getLogger(__name__)

class NotificationScheduler:
    def __init__(self):
        try:
            self.db = firestore.client()
            self.is_running = False
        except Exception as e:
            logger.warning(f"Firebase not initialized in NotificationScheduler: {e}")
            self.db = None
            self.is_running = False

    async def check_inactive_users(self):
        """Check for users who haven't practiced today and send reminder emails"""
        try:
            logger.info("Checking for inactive users...")
            
            # Get current date
            today = datetime.now().strftime('%Y-%m-%d')
            yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            
            # Get all users
            users_ref = self.db.collection('users')
            users = users_ref.stream()
            
            inactive_users = []
            
            for user_doc in users:
                user_data = user_doc.to_dict()
                user_id = user_doc.id
                
                # Skip if user doesn't have email
                if 'email' not in user_data:
                    continue
                
                # Check user's streak data
                streak_ref = self.db.collection('streaks').document(user_id)
                streak_doc = streak_ref.get()
                
                if not streak_doc.exists:
                    continue
                
                streak_data = streak_doc.to_dict()
                activities = streak_data.get('activities', {})
                
                # Check if user was active yesterday but not today
                was_active_yesterday = yesterday in activities and activities[yesterday].get('count', 0) > 0
                is_active_today = today in activities and activities[today].get('count', 0) > 0
                
                # Send reminder if user was active yesterday but not today
                if was_active_yesterday and not is_active_today:
                    current_streak = streak_data.get('currentStreak', 0)
                    longest_streak = streak_data.get('longestStreak', 0)
                    
                    # Only send reminder if they have a streak to maintain
                    if current_streak > 0:
                        inactive_users.append({
                            'user_id': user_id,
                            'email': user_data['email'],
                            'name': user_data.get('displayName', 'Learner'),
                            'current_streak': current_streak,
                            'longest_streak': longest_streak
                        })
            
            # Send reminder emails
            for user in inactive_users:
                try:
                    success = email_service.send_streak_reminder(
                        user['email'],
                        user['name'],
                        user['current_streak'],
                        user['longest_streak']
                    )
                    
                    if success:
                        logger.info(f"Sent streak reminder to {user['email']}")
                        
                        # Log the notification
                        await self.log_notification(user['user_id'], 'streak_reminder', {
                            'current_streak': user['current_streak'],
                            'email_sent': True
                        })
                    else:
                        logger.error(f"Failed to send streak reminder to {user['email']}")
                        
                except Exception as e:
                    logger.error(f"Error sending reminder to {user['email']}: {str(e)}")
            
            logger.info(f"Processed {len(inactive_users)} inactive users")
            
        except Exception as e:
            logger.error(f"Error in check_inactive_users: {str(e)}")

    async def check_broken_streaks(self):
        """Check for users whose streaks were broken and send encouragement emails"""
        try:
            logger.info("Checking for broken streaks...")
            
            today = datetime.now().strftime('%Y-%m-%d')
            yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            
            # Get all streak documents
            streaks_ref = self.db.collection('streaks')
            streaks = streaks_ref.stream()
            
            for streak_doc in streaks:
                streak_data = streak_doc.to_dict()
                user_id = streak_doc.id
                
                # Get user data
                user_ref = self.db.collection('users').document(user_id)
                user_doc = user_ref.get()
                
                if not user_doc.exists:
                    continue
                
                user_data = user_doc.to_dict()
                
                if 'email' not in user_data:
                    continue
                
                activities = streak_data.get('activities', {})
                current_streak = streak_data.get('currentStreak', 0)
                last_activity_date = streak_data.get('lastActivityDate')
                
                # Check if streak was broken (had activity yesterday but current streak is 0)
                was_active_yesterday = yesterday in activities and activities[yesterday].get('count', 0) > 0
                is_streak_broken = current_streak == 0 and was_active_yesterday
                
                # Check if we already sent a broken streak email today
                notifications_ref = self.db.collection('notifications').document(user_id)
                notifications_doc = notifications_ref.get()
                
                sent_today = False
                if notifications_doc.exists:
                    notifications_data = notifications_doc.to_dict()
                    today_notifications = notifications_data.get(today, [])
                    sent_today = any(n.get('type') == 'streak_broken' for n in today_notifications)
                
                if is_streak_broken and not sent_today:
                    # Get the broken streak length from yesterday's data
                    broken_streak = activities[yesterday].get('streak_before_break', 1)
                    
                    try:
                        success = email_service.send_streak_broken_email(
                            user_data['email'],
                            user_data.get('displayName', 'Learner'),
                            broken_streak
                        )
                        
                        if success:
                            logger.info(f"Sent broken streak email to {user_data['email']}")
                            
                            await self.log_notification(user_id, 'streak_broken', {
                                'broken_streak': broken_streak,
                                'email_sent': True
                            })
                        
                    except Exception as e:
                        logger.error(f"Error sending broken streak email to {user_data['email']}: {str(e)}")
            
        except Exception as e:
            logger.error(f"Error in check_broken_streaks: {str(e)}")

    async def log_notification(self, user_id: str, notification_type: str, data: Dict):
        """Log notification to Firestore"""
        try:
            today = datetime.now().strftime('%Y-%m-%d')
            timestamp = datetime.now().isoformat()
            
            notification_data = {
                'type': notification_type,
                'timestamp': timestamp,
                'data': data
            }
            
            # Store in user's notification log
            notifications_ref = self.db.collection('notifications').document(user_id)
            notifications_doc = notifications_ref.get()
            
            if notifications_doc.exists:
                notifications_data = notifications_doc.to_dict()
                if today not in notifications_data:
                    notifications_data[today] = []
                notifications_data[today].append(notification_data)
            else:
                notifications_data = {today: [notification_data]}
            
            notifications_ref.set(notifications_data)
            
        except Exception as e:
            logger.error(f"Error logging notification: {str(e)}")

    def schedule_daily_checks(self):
        """Schedule daily notification checks"""
        # Schedule streak reminders for 7 PM every day
        schedule.every().day.at("19:00").do(lambda: asyncio.create_task(self.check_inactive_users()))
        
        # Schedule broken streak checks for 8 AM every day
        schedule.every().day.at("08:00").do(lambda: asyncio.create_task(self.check_broken_streaks()))
        
        logger.info("Scheduled daily notification checks")

    async def run_scheduler(self):
        """Run the notification scheduler"""
        self.is_running = True
        logger.info("Starting notification scheduler...")
        
        self.schedule_daily_checks()
        
        while self.is_running:
            schedule.run_pending()
            await asyncio.sleep(60)  # Check every minute

    def stop_scheduler(self):
        """Stop the notification scheduler"""
        self.is_running = False
        logger.info("Stopping notification scheduler...")

# Create global scheduler instance
notification_scheduler = NotificationScheduler()