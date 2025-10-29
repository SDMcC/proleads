import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Database connection for storing notifications - lazy initialization
_client = None
_db = None

def get_db():
    """Get database connection (lazy initialization)"""
    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
        _db = _client[os.getenv("DB_NAME")]
    return _db

# SMTP Configuration (will be loaded from env or Ethereal)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.ethereal.email")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@proleadsnetwork.com")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Proleads Network")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@proleadsnetwork.com")

async def create_ethereal_account():
    """Create a test Ethereal email account for development"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post("https://api.nodemailer.com/user")
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Ethereal account created: {data['user']}")
                return {
                    "host": "smtp.ethereal.email",
                    "port": 587,
                    "username": data['user'],
                    "password": data['pass'],
                    "web_url": "https://ethereal.email/messages"
                }
    except Exception as e:
        logger.error(f"Failed to create Ethereal account: {str(e)}")
    return None

async def store_notification(user_email: str, subject: str, body: str, notification_type: str = "general"):
    """Store notification in database for history"""
    try:
        db = get_db()
        notification = {
            "notification_id": str(uuid.uuid4()),
            "user_email": user_email,
            "subject": subject,
            "body": body,
            "type": notification_type,
            "read": False,
            "created_at": datetime.utcnow().isoformat(),
        }
        await db.notifications.insert_one(notification)
        logger.info(f"Stored notification for {user_email}: {subject}")
    except Exception as e:
        logger.error(f"Failed to store notification: {str(e)}")

async def send_email(to_email: str, subject: str, body: str, html: bool = False, notification_type: str = "general", store_in_history: bool = True):
    """Send email via SMTP and optionally store in notification history"""
    try:
        # Store notification in database first
        if store_in_history:
            await store_notification(to_email, subject, body, notification_type)
        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        # Add body
        if html:
            message.attach(MIMEText(body, "html"))
        else:
            message.attach(MIMEText(body, "plain"))
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USERNAME,
            password=SMTP_PASSWORD,
            start_tls=True
        )
        
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

# Email Templates (Plain Text)

async def send_new_referral_email(to_email: str, referrer_name: str, new_member_username: str):
    """Send email when someone signs up with referral link"""
    subject = "🎉 New Referral - Someone joined using your link!"
    body = f"""Hello {referrer_name},

Great news! {new_member_username} has just joined Proleads Network using your referral link!

You're building your network and earning commissions. Keep sharing your referral link to grow your team!

Login to your dashboard to see your updated referral network:
https://proleads.network

Best regards,
Proleads Network Team
"""
    return await send_email(to_email, subject, body, notification_type="new_referral")

async def send_lead_distribution_email(to_email: str, username: str, lead_count: int, csv_filename: str):
    """Send email when new leads are distributed"""
    subject = f"📋 {lead_count} New Leads Distributed to Your Account"
    body = f"""Hello {username},

Good news! {lead_count} new leads have been distributed to your account.

File: {csv_filename}

Login to your dashboard to download your leads:
https://proleads.network

Start reaching out to these leads and grow your business!

Best regards,
Proleads Network Team
"""
    return await send_email(to_email, subject, body, notification_type="lead_distribution")

async def send_payment_confirmation_email(to_email: str, username: str, tier: str, amount: float):
    """Send email after successful payment"""
    subject = f"✅ Payment Confirmed - Welcome to {tier.capitalize()} Membership!"
    body = f"""Hello {username},

Thank you for your payment! Your {tier.capitalize()} membership has been activated.

Payment Details:
- Membership: {tier.capitalize()}
- Amount: ${amount:.2f}
- Status: Confirmed

Your membership benefits are now active. Login to your dashboard:
https://proleads.network

Best regards,
Proleads Network Team
"""
    return await send_email(to_email, subject, body, notification_type="payment_confirmation")

async def send_subscription_reminder_email(to_email: str, username: str, tier: str, expires_at: str):
    """Send email reminder 3 days before subscription expires"""
    subject = "⏰ Subscription Renewal Reminder"
    body = f"""Hello {username},

This is a friendly reminder that your {tier.capitalize()} membership will expire on {expires_at}.

To continue enjoying your membership benefits, please renew your subscription before it expires.

Login to your dashboard to renew:
https://proleads.network

Best regards,
Proleads Network Team
"""
    return await send_email(to_email, subject, body, notification_type="subscription_reminder")

async def send_commission_payout_email(to_email: str, username: str, amount: float, milestone_count: int):
    """Send email when milestone commission is marked as paid"""
    subject = f"💰 Commission Payout - ${amount:.2f} Milestone Bonus!"
    body = f"""Hello {username},

Congratulations! Your milestone bonus has been paid.

Milestone Details:
- Referrals Achieved: {milestone_count}
- Bonus Amount: ${amount:.2f}
- Status: Paid

Keep building your network to reach even bigger milestones!

Login to your dashboard:
https://proleads.network

Best regards,
Proleads Network Team
"""
    return await send_email(to_email, subject, body, notification_type="commission_payout")

async def send_referral_upgrade_email(to_email: str, referrer_name: str, referral_username: str, new_tier: str):
    """Send email when a referral upgrades their membership"""
    subject = f"🚀 Your Referral {referral_username} Upgraded to {new_tier.capitalize()}!"
    body = f"""Hello {referrer_name},

Exciting news! {referral_username}, one of your referrals, has upgraded their membership to {new_tier.capitalize()}!

This means you'll earn higher commissions from their network activity. Keep encouraging your team!

Login to your dashboard to see your updated earnings:
https://proleads.network

Best regards,
Proleads Network Team
"""
    return await send_email(to_email, subject, body, notification_type="referral_upgrade")

# Admin Email Templates

async def send_admin_milestone_notification(milestone_user: str, milestone_count: int, bonus_amount: float):
    """Send email to admin when user reaches milestone"""
    subject = f"🎯 Milestone Achieved - {milestone_user} reached {milestone_count} referrals"
    body = f"""Admin Notification,

User {milestone_user} has achieved a milestone!

Milestone Details:
- User: {milestone_user}
- Referrals: {milestone_count}
- Bonus Amount: ${bonus_amount:.2f}
- Status: Pending Payment

Login to admin dashboard to mark as paid:
https://proleads.network/admin

Best regards,
Proleads Network System
"""
    return await send_email(ADMIN_EMAIL, subject, body)

async def send_admin_payment_confirmation(username: str, tier: str, amount: float):
    """Send email to admin when payment is confirmed"""
    subject = f"💳 Payment Confirmed - {username} upgraded to {tier.capitalize()}"
    body = f"""Admin Notification,

A new payment has been confirmed!

Payment Details:
- User: {username}
- Membership: {tier.capitalize()}
- Amount: ${amount:.2f}
- Status: Confirmed

Login to admin dashboard:
https://proleads.network/admin

Best regards,
Proleads Network System
"""
    return await send_email(ADMIN_EMAIL, subject, body)

async def send_admin_lead_distribution_status(distribution_id: str, status: str, total_leads: int, eligible_members: int):
    """Send email to admin about lead distribution status"""
    subject = f"📊 Lead Distribution {status.upper()} - {total_leads} leads"
    body = f"""Admin Notification,

Lead distribution update:

Distribution Details:
- Distribution ID: {distribution_id}
- Status: {status.upper()}
- Total Leads: {total_leads}
- Eligible Members: {eligible_members}

Login to admin dashboard:
https://proleads.network/admin

Best regards,
Proleads Network System
"""
    return await send_email(ADMIN_EMAIL, subject, body)
async def send_admin_ticket_notification(ticket_id: str, username: str, subject: str, priority: str, category: str, message_preview: str):
    """Send email to admin when a new ticket is created"""
    email_subject = f"🎫 New Support Ticket - {priority.upper()} Priority"
    
    # Priority emoji
    priority_emoji = {
        "low": "🟢",
        "medium": "🟡", 
        "high": "🟠",
        "urgent": "🔴"
    }
    emoji = priority_emoji.get(priority.lower(), "🎫")
    
    body = f"""Admin Notification,

{emoji} A new support ticket has been created!

Ticket Details:
- Ticket ID: {ticket_id}
- From User: {username}
- Subject: {subject}
- Priority: {priority.upper()}
- Category: {category}

Message Preview:
{message_preview[:200]}{'...' if len(message_preview) > 200 else ''}

View and respond to this ticket:
https://proleads.network/admin/dashboard

Best regards,
Proleads Network System
"""
    
    return await send_email(ADMIN_EMAIL, email_subject, body, notification_type="ticket")
