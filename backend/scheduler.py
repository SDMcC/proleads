"""
Background scheduler for automated lead distributions
"""
import asyncio
import os
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import logging
from dotenv import load_dotenv
from scheduler_health import update_scheduler_heartbeat, log_scheduler_event

load_dotenv()

logger = logging.getLogger(__name__)


def calculate_next_run(schedule: dict) -> datetime:
    """Calculate the next run time based on schedule settings"""
    now = datetime.now(timezone.utc)
    frequency = schedule.get("frequency", "weekly")
    time_parts = schedule.get("time", "09:00").split(":")
    hour = int(time_parts[0])
    minute = int(time_parts[1]) if len(time_parts) > 1 else 0
    
    if frequency == "weekly":
        # Calculate next occurrence of specified day_of_week (1=Monday, 7=Sunday)
        target_day = schedule.get("day_of_week", 1)  # 1 = Monday
        current_weekday = now.isoweekday()  # 1=Monday, 7=Sunday
        
        days_ahead = target_day - current_weekday
        if days_ahead < 0:  # Target day already happened this week
            days_ahead += 7
        elif days_ahead == 0:  # Target day is today
            # Check if the time has already passed today
            schedule_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if now >= schedule_time:
                days_ahead = 7  # Next week
        
        next_run = now + timedelta(days=days_ahead)
        next_run = next_run.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
    elif frequency == "monthly":
        # Calculate next occurrence of specified day_of_month
        target_day = schedule.get("day_of_month", 1)
        
        # Ensure target_day is valid (1-31)
        target_day = max(1, min(31, target_day))
        
        if now.day > target_day or (now.day == target_day and now.hour >= hour and now.minute >= minute):
            # Next month
            if now.month == 12:
                next_run = now.replace(year=now.year + 1, month=1, day=1)
            else:
                next_run = now.replace(month=now.month + 1, day=1)
            
            # Handle months with fewer days
            try:
                next_run = next_run.replace(day=target_day)
            except ValueError:
                # Day doesn't exist in that month (e.g., Feb 31), use last day
                next_run = next_run.replace(day=1) + timedelta(days=32)
                next_run = next_run.replace(day=1) - timedelta(days=1)
        else:
            # This month
            try:
                next_run = now.replace(day=target_day)
            except ValueError:
                # Day doesn't exist in current month, use last day
                next_run = now.replace(day=1) + timedelta(days=32)
                next_run = next_run.replace(day=1) - timedelta(days=1)
        
        next_run = next_run.replace(hour=hour, minute=minute, second=0, microsecond=0)
    else:
        # Default to weekly if unknown frequency
        next_run = now + timedelta(weeks=1)
        next_run = next_run.replace(hour=hour, minute=minute, second=0, microsecond=0)
    
    return next_run


async def execute_scheduled_distribution(db, schedule: dict):
    """
    Execute a scheduled distribution
    This pulls leads from multiple CSVs (oldest first) and distributes to all eligible members
    """
    schedule_id = schedule["schedule_id"]
    schedule_name = schedule.get("name", "Unnamed Schedule")
    
    try:
        logger.info(f"Executing scheduled distribution: {schedule_name} (ID: {schedule_id})")
        
        # Check if there are enough undistributed leads (across all CSVs)
        available_leads = await db.leads.count_documents({
            "distribution_count": {"$lt": 10}
        })
        
        min_required = schedule.get("min_leads_required", 50)
        if available_leads < min_required:
            logger.warning(
                f"Schedule {schedule_name}: Not enough leads ({available_leads} < {min_required}). "
                f"Skipping this run."
            )
            # Update next run time and skip
            next_run = calculate_next_run(schedule)
            await db.distribution_schedules.update_one(
                {"schedule_id": schedule_id},
                {
                    "$set": {"next_run": next_run},
                    "$inc": {"skipped_count": 1}
                }
            )
            return
        
        # Import distribution function
        # Note: We're importing here to avoid circular imports
        from server import perform_scheduled_lead_distribution
        
        # Perform the sequential distribution (pulls from multiple CSVs automatically)
        logger.info(f"Starting scheduled distribution for {schedule_name}")
        await perform_scheduled_lead_distribution(schedule_id, schedule_name)
        
        # Update schedule
        next_run = calculate_next_run(schedule)
        await db.distribution_schedules.update_one(
            {"schedule_id": schedule_id},
            {
                "$set": {
                    "last_run": datetime.utcnow(),
                    "next_run": next_run
                },
                "$inc": {"run_count": 1}
            }
        )
        
        logger.info(
            f"Completed scheduled distribution for {schedule_name}. "
            f"Next run: {next_run.isoformat()}"
        )
        
    except Exception as e:
        logger.error(f"Failed to execute schedule {schedule_name}: {str(e)}")
        # Update schedule with error
        await db.distribution_schedules.update_one(
            {"schedule_id": schedule_id},
            {
                "$set": {
                    "last_error": str(e),
                    "last_error_at": datetime.utcnow()
                },
                "$inc": {"error_count": 1}
            }
        )


async def check_subscription_reminders(db):
    """
    Check for subscriptions expiring soon and send reminder emails
    Sends reminders at 7 days, 3 days, and 1 day before expiration
    """
    try:
        now = datetime.now(timezone.utc)
        logger.info("Checking for subscription reminders...")
        
        # Check for subscriptions expiring in 7 days
        seven_days_from_now = now + timedelta(days=7)
        seven_days_end = seven_days_from_now + timedelta(hours=1)
        
        # Check for subscriptions expiring in 3 days
        three_days_from_now = now + timedelta(days=3)
        three_days_end = three_days_from_now + timedelta(hours=1)
        
        # Check for subscriptions expiring in 1 day
        one_day_from_now = now + timedelta(days=1)
        one_day_end = one_day_from_now + timedelta(hours=1)
        
        # Find users with expiring subscriptions (7 days)
        users_7_days = await db.users.find({
            "subscription_expires_at": {
                "$gte": seven_days_from_now,
                "$lt": seven_days_end
            },
            "membership_tier": {"$in": ["bronze", "silver", "gold"]},
            "reminder_sent_7_days": {"$ne": True}
        }).to_list(None)
        
        # Find users with expiring subscriptions (3 days)
        users_3_days = await db.users.find({
            "subscription_expires_at": {
                "$gte": three_days_from_now,
                "$lt": three_days_end
            },
            "membership_tier": {"$in": ["bronze", "silver", "gold"]},
            "reminder_sent_3_days": {"$ne": True}
        }).to_list(None)
        
        # Find users with expiring subscriptions (1 day)
        users_1_day = await db.users.find({
            "subscription_expires_at": {
                "$gte": one_day_from_now,
                "$lt": one_day_end
            },
            "membership_tier": {"$in": ["bronze", "silver", "gold"]},
            "reminder_sent_1_day": {"$ne": True}
        }).to_list(None)
        
        # Send reminders for 7 days
        for user in users_7_days:
            try:
                await send_subscription_reminder_email(
                    db,
                    user["email"],
                    user["username"],
                    user["membership_tier"],
                    7
                )
                await db.users.update_one(
                    {"user_id": user["user_id"]},
                    {"$set": {"reminder_sent_7_days": True}}
                )
                logger.info(f"Sent 7-day reminder to {user['email']}")
            except Exception as e:
                logger.error(f"Failed to send 7-day reminder to {user['email']}: {str(e)}")
        
        # Send reminders for 3 days
        for user in users_3_days:
            try:
                await send_subscription_reminder_email(
                    db,
                    user["email"],
                    user["username"],
                    user["membership_tier"],
                    3
                )
                await db.users.update_one(
                    {"user_id": user["user_id"]},
                    {"$set": {"reminder_sent_3_days": True}}
                )
                logger.info(f"Sent 3-day reminder to {user['email']}")
            except Exception as e:
                logger.error(f"Failed to send 3-day reminder to {user['email']}: {str(e)}")
        
        # Send reminders for 1 day
        for user in users_1_day:
            try:
                await send_subscription_reminder_email(
                    db,
                    user["email"],
                    user["username"],
                    user["membership_tier"],
                    1
                )
                await db.users.update_one(
                    {"user_id": user["user_id"]},
                    {"$set": {"reminder_sent_1_day": True}}
                )
                logger.info(f"Sent 1-day reminder to {user['email']}")
            except Exception as e:
                logger.error(f"Failed to send 1-day reminder to {user['email']}: {str(e)}")
        
        total_reminders = len(users_7_days) + len(users_3_days) + len(users_1_day)
        if total_reminders > 0:
            logger.info(f"Sent {total_reminders} subscription reminder emails")
        
    except Exception as e:
        logger.error(f"Error checking subscription reminders: {str(e)}")


async def send_subscription_reminder_email(db, email, username, tier, days_remaining):
    """
    Send subscription reminder email
    """
    try:
        # Get tier pricing
        tier_prices = {
            "bronze": "$19",
            "silver": "$49",
            "gold": "$99"
        }
        price = tier_prices.get(tier, "$19")
        
        # Create email content
        subject = f"Your Proleads {tier.capitalize()} Subscription Expires in {days_remaining} Day{'s' if days_remaining != 1 else ''}!"
        
        if days_remaining == 7:
            urgency = "soon"
            message = f"Your {tier.capitalize()} membership will expire in 7 days. Don't lose access to your weekly leads and commission earnings!"
        elif days_remaining == 3:
            urgency = "very soon"
            message = f"⚠️ Only 3 days left on your {tier.capitalize()} membership! Renew now to keep your leads flowing."
        else:  # 1 day
            urgency = "tomorrow"
            message = f"🚨 URGENT: Your {tier.capitalize()} membership expires TOMORROW! Don't miss out on this week's leads."
        
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
                <h1 style="color: white; margin: 0;">Proleads Network</h1>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9; border-radius: 10px; margin-top: 20px;">
                <h2 style="color: #333;">Hi {username},</h2>
                
                <p style="font-size: 16px; color: #666; line-height: 1.6;">
                    {message}
                </p>
                
                <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                    <h3 style="margin-top: 0; color: #667eea;">Your Membership Details:</h3>
                    <p style="margin: 5px 0;"><strong>Tier:</strong> {tier.capitalize()}</p>
                    <p style="margin: 5px 0;"><strong>Price:</strong> {price}/month</p>
                    <p style="margin: 5px 0;"><strong>Days Remaining:</strong> {days_remaining} day{'s' if days_remaining != 1 else ''}</p>
                </div>
                
                <h3 style="color: #333;">What You'll Lose:</h3>
                <ul style="color: #666; line-height: 1.8;">
                    <li>Weekly supply of fresh, qualified leads</li>
                    <li>Sendloop email automation access</li>
                    <li>Recurring commission earnings</li>
                    <li>Access to your referral network</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://smartlead-hub-2.preview.emergentagent.com/payment" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; 
                              padding: 15px 40px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-size: 18px; 
                              font-weight: bold;
                              display: inline-block;">
                        Renew Now
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px;">
                    Questions? Reply to this email or contact us at support@proleads.network
                </p>
            </div>
        </body>
        </html>
        """
        
        # Store email in database (for email sending service to pick up)
        await db.pending_emails.insert_one({
            "email_id": str(uuid.uuid4()),
            "to_email": email,
            "subject": subject,
            "body": email_body,
            "type": "subscription_reminder",
            "days_remaining": days_remaining,
            "created_at": datetime.utcnow(),
            "sent": False
        })
        
        logger.info(f"Queued subscription reminder email for {email} ({days_remaining} days)")
        
    except Exception as e:
        logger.error(f"Failed to send subscription reminder: {str(e)}")
        raise


async def run_distribution_scheduler():
    """Main scheduler loop - runs every minute"""
    logger.info("Starting distribution scheduler...")
    
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db = client[os.getenv("DB_NAME")]
    
    # Log startup
    await log_scheduler_event(db, "startup", "Scheduler started successfully")
    
    # Track last reminder check time
    last_reminder_check = datetime.now(timezone.utc) - timedelta(hours=2)  # Run on first iteration
    
    while True:
        try:
            # Update heartbeat
            await update_scheduler_heartbeat(db)
            
            now = datetime.now(timezone.utc)
            
            # Log check
            await log_scheduler_event(db, "check", f"Checking for schedules at {now.isoformat()}")
            
            # Check subscription reminders every hour
            if (now - last_reminder_check).total_seconds() >= 3600:  # 1 hour
                logger.info("Running subscription reminder check...")
                await check_subscription_reminders(db)
                last_reminder_check = now
            
            # Find schedules that need to run
            schedules_to_run = await db.distribution_schedules.find({
                "enabled": True,
                "next_run": {"$lte": now}
            }).to_list(None)
            
            if schedules_to_run:
                logger.info(f"Found {len(schedules_to_run)} schedule(s) to execute")
                await log_scheduler_event(
                    db, 
                    "found_schedules", 
                    f"Found {len(schedules_to_run)} schedule(s) to execute at {now.isoformat()}"
                )
            
            for schedule in schedules_to_run:
                try:
                    await log_scheduler_event(
                        db,
                        "execute_start",
                        f"Starting execution of schedule: {schedule.get('name')}",
                        schedule_id=schedule.get('schedule_id')
                    )
                    await execute_scheduled_distribution(db, schedule)
                    await log_scheduler_event(
                        db,
                        "execute_complete",
                        f"Completed execution of schedule: {schedule.get('name')}",
                        schedule_id=schedule.get('schedule_id')
                    )
                except Exception as e:
                    error_msg = str(e)
                    logger.error(
                        f"Failed to run schedule {schedule.get('name', 'unknown')}: {error_msg}"
                    )
                    await log_scheduler_event(
                        db,
                        "execute_error",
                        f"Failed to execute schedule: {schedule.get('name')}",
                        schedule_id=schedule.get('schedule_id'),
                        error=error_msg
                    )
            
            # Sleep for 1 minute
            await asyncio.sleep(60)
            
        except Exception as e:
            logger.error(f"Scheduler error: {str(e)}")
            await log_scheduler_event(db, "error", f"Scheduler loop error: {str(e)}", error=str(e))
            await asyncio.sleep(60)


async def start_scheduler_task():
    """Start the scheduler as a background task"""
    asyncio.create_task(run_distribution_scheduler())
    logger.info("Distribution scheduler task started")
