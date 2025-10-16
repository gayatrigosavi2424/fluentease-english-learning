import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import List, Dict
import logging
from dotenv import load_dotenv

load_dotenv()

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
FROM_NAME = os.getenv("FROM_NAME", "FluentEase Learning")

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = SMTP_SERVER
        self.smtp_port = SMTP_PORT
        self.email_address = EMAIL_ADDRESS
        self.email_password = EMAIL_PASSWORD
        self.from_name = FROM_NAME

    def send_email(self, to_email: str, subject: str, html_content: str, text_content: str = None) -> bool:
        """Send an email to a user"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.email_address}>"
            msg['To'] = to_email

            # Create text and HTML parts
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_address, self.email_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    def send_streak_reminder(self, user_email: str, user_name: str, current_streak: int, longest_streak: int) -> bool:
        """Send a streak reminder email"""
        subject = f"🔥 Don't break your {current_streak}-day learning streak!"
        
        html_content = self.get_streak_reminder_html(user_name, current_streak, longest_streak)
        text_content = self.get_streak_reminder_text(user_name, current_streak, longest_streak)
        
        return self.send_email(user_email, subject, html_content, text_content)

    def send_streak_broken_email(self, user_email: str, user_name: str, broken_streak: int) -> bool:
        """Send an email when streak is broken"""
        subject = f"💔 Your {broken_streak}-day streak ended - Let's start fresh!"
        
        html_content = self.get_streak_broken_html(user_name, broken_streak)
        text_content = self.get_streak_broken_text(user_name, broken_streak)
        
        return self.send_email(user_email, subject, html_content, text_content)

    def send_achievement_email(self, user_email: str, user_name: str, achievement_name: str, achievement_emoji: str) -> bool:
        """Send an achievement unlock email"""
        subject = f"🏆 Achievement Unlocked: {achievement_name}!"
        
        html_content = self.get_achievement_html(user_name, achievement_name, achievement_emoji)
        text_content = self.get_achievement_text(user_name, achievement_name, achievement_emoji)
        
        return self.send_email(user_email, subject, html_content, text_content)

    def get_streak_reminder_html(self, user_name: str, current_streak: int, longest_streak: int) -> str:
        """Generate HTML content for streak reminder email"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Keep Your Streak Going!</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #ff6b6b, #ffa500); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .streak-counter {{ background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .cta-button {{ display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔥 Don't Break Your Streak!</h1>
                    <p>Hi {user_name}, your learning journey is on fire!</p>
                </div>
                <div class="content">
                    <div class="streak-counter">
                        <h2 style="color: #ff6b6b; margin: 0;">Current Streak</h2>
                        <div style="font-size: 48px; font-weight: bold; color: #333; margin: 10px 0;">{current_streak}</div>
                        <p style="margin: 0; color: #666;">consecutive days</p>
                    </div>
                    
                    <p>You're doing amazing! You've been learning consistently for <strong>{current_streak} days</strong> in a row.</p>
                    
                    {"<p>🏆 You're getting close to beating your personal record of <strong>" + str(longest_streak) + " days</strong>!</p>" if current_streak >= longest_streak - 2 else ""}
                    
                    <p>Don't let this streak end! Just 5-10 minutes of practice today will keep your momentum going.</p>
                    
                    <div style="text-align: center;">
                        <a href="https://your-app-url.com/speak" class="cta-button">🎤 Practice Speaking</a>
                        <a href="https://your-app-url.com/write" class="cta-button">✍️ Practice Writing</a>
                        <a href="https://your-app-url.com/describe" class="cta-button">🖼️ Practice Describing</a>
                    </div>
                    
                    <p style="margin-top: 30px; padding: 15px; background: #e8f5e8; border-radius: 5px;">
                        💡 <strong>Quick Tip:</strong> Set a daily reminder on your phone to practice at the same time each day. Consistency is key to language learning success!
                    </p>
                </div>
                <div class="footer">
                    <p>Keep learning, keep growing! 🌱</p>
                    <p>FluentEase - Your English Learning Companion</p>
                </div>
            </div>
        </body>
        </html>
        """

    def get_streak_reminder_text(self, user_name: str, current_streak: int, longest_streak: int) -> str:
        """Generate text content for streak reminder email"""
        return f"""
        Hi {user_name},

        🔥 Don't Break Your {current_streak}-Day Streak!

        You're doing amazing! You've been learning consistently for {current_streak} days in a row.

        {"🏆 You're getting close to beating your personal record of " + str(longest_streak) + " days!" if current_streak >= longest_streak - 2 else ""}

        Don't let this streak end! Just 5-10 minutes of practice today will keep your momentum going.

        Practice options:
        🎤 Speaking Practice
        ✍️ Writing Practice  
        🖼️ Describing Practice

        💡 Quick Tip: Set a daily reminder on your phone to practice at the same time each day. Consistency is key to language learning success!

        Keep learning, keep growing! 🌱
        FluentEase - Your English Learning Companion
        """

    def get_streak_broken_html(self, user_name: str, broken_streak: int) -> str:
        """Generate HTML content for broken streak email"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Let's Start Fresh!</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .cta-button {{ display: inline-block; background: #00b894; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💔 Streak Ended - But Don't Give Up!</h1>
                    <p>Hi {user_name}, every expert was once a beginner.</p>
                </div>
                <div class="content">
                    <p>Your {broken_streak}-day learning streak has ended, but that doesn't diminish the amazing progress you made!</p>
                    
                    <p>🌟 <strong>What you achieved:</strong></p>
                    <ul>
                        <li>✅ {broken_streak} consecutive days of learning</li>
                        <li>✅ Built a strong learning habit</li>
                        <li>✅ Improved your English skills significantly</li>
                    </ul>
                    
                    <p>The best time to start a new streak is right now! Even the most successful learners have ups and downs.</p>
                    
                    <div style="text-align: center;">
                        <a href="https://your-app-url.com/streaks" class="cta-button">🔥 Start New Streak</a>
                    </div>
                    
                    <p style="margin-top: 30px; padding: 15px; background: #e8f4fd; border-radius: 5px;">
                        💪 <strong>Remember:</strong> Progress isn't always linear. What matters is getting back on track and continuing your learning journey!
                    </p>
                </div>
                <div class="footer">
                    <p>You've got this! 💪</p>
                    <p>FluentEase - Your English Learning Companion</p>
                </div>
            </div>
        </body>
        </html>
        """

    def get_streak_broken_text(self, user_name: str, broken_streak: int) -> str:
        """Generate text content for broken streak email"""
        return f"""
        Hi {user_name},

        💔 Your {broken_streak}-day streak ended, but don't give up!

        What you achieved:
        ✅ {broken_streak} consecutive days of learning
        ✅ Built a strong learning habit  
        ✅ Improved your English skills significantly

        The best time to start a new streak is right now! Even the most successful learners have ups and downs.

        💪 Remember: Progress isn't always linear. What matters is getting back on track and continuing your learning journey!

        You've got this! 💪
        FluentEase - Your English Learning Companion
        """

    def get_achievement_html(self, user_name: str, achievement_name: str, achievement_emoji: str) -> str:
        """Generate HTML content for achievement email"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Achievement Unlocked!</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #ffd700, #ffb347); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .achievement {{ background: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0; box-shadow: 0 4px 15px rgba(255,215,0,0.3); }}
                .cta-button {{ display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏆 Achievement Unlocked!</h1>
                    <p>Congratulations {user_name}!</p>
                </div>
                <div class="content">
                    <div class="achievement">
                        <div style="font-size: 64px; margin-bottom: 15px;">{achievement_emoji}</div>
                        <h2 style="color: #ffd700; margin: 0 0 10px 0;">{achievement_name}</h2>
                        <p style="color: #666; margin: 0;">You've reached a new milestone!</p>
                    </div>
                    
                    <p>Your dedication to learning English is paying off! This achievement shows your commitment to consistent practice and improvement.</p>
                    
                    <p>Keep up the fantastic work and continue building your English skills. Every day of practice brings you closer to fluency!</p>
                    
                    <div style="text-align: center;">
                        <a href="https://your-app-url.com/streaks" class="cta-button">🔥 View All Achievements</a>
                    </div>
                </div>
                <div class="footer">
                    <p>Celebrating your success! 🎉</p>
                    <p>FluentEase - Your English Learning Companion</p>
                </div>
            </div>
        </body>
        </html>
        """

    def get_achievement_text(self, user_name: str, achievement_name: str, achievement_emoji: str) -> str:
        """Generate text content for achievement email"""
        return f"""
        Hi {user_name},

        🏆 Achievement Unlocked!

        {achievement_emoji} {achievement_name}

        Your dedication to learning English is paying off! This achievement shows your commitment to consistent practice and improvement.

        Keep up the fantastic work and continue building your English skills. Every day of practice brings you closer to fluency!

        Celebrating your success! 🎉
        FluentEase - Your English Learning Companion
        """

# Create global email service instance
email_service = EmailService()