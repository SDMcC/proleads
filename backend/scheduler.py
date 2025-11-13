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
    """Execute a scheduled distribution"""
    schedule_id = schedule["schedule_id"]
    schedule_name = schedule.get("name", "Unnamed Schedule")
    
    try:
        logger.info(f"Executing scheduled distribution: {schedule_name} (ID: {schedule_id})")
        
        # Check if there are enough undistributed leads
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
        
        # Create a distribution record for this scheduled run
        distribution_id = str(uuid.uuid4())
        distribution_doc = {
            "distribution_id": distribution_id,
            "filename": f"auto_distribution_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "total_leads": available_leads,
            "status": "processing",
            "uploaded_by": f"SCHEDULE:{schedule_name}",
            "uploaded_at": datetime.utcnow(),
            "schedule_id": schedule_id,
            "auto_distributed": True,
            "processing_started_at": datetime.utcnow()
        }
        await db.lead_distributions.insert_one(distribution_doc)
        
        logger.info(f"Created distribution {distribution_id} for schedule {schedule_name}")
        
        # Import and execute distribution function
        # Note: We're importing here to avoid circular imports
        from server import perform_lead_distribution
        
        # Perform the distribution
        await perform_lead_distribution(distribution_id)
        
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
            f"Completed scheduled distribution {distribution_id}. "
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


async def run_distribution_scheduler():
    """Main scheduler loop - runs every minute"""
    logger.info("Starting distribution scheduler...")
    
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db = client[os.getenv("DB_NAME")]
    
    while True:
        try:
            now = datetime.now(timezone.utc)
            
            # Find schedules that need to run
            schedules_to_run = await db.distribution_schedules.find({
                "enabled": True,
                "next_run": {"$lte": now}
            }).to_list(None)
            
            if schedules_to_run:
                logger.info(f"Found {len(schedules_to_run)} schedule(s) to execute")
            
            for schedule in schedules_to_run:
                try:
                    await execute_scheduled_distribution(db, schedule)
                except Exception as e:
                    logger.error(
                        f"Failed to run schedule {schedule.get('name', 'unknown')}: {str(e)}"
                    )
            
            # Sleep for 1 minute
            await asyncio.sleep(60)
            
        except Exception as e:
            logger.error(f"Scheduler error: {str(e)}")
            await asyncio.sleep(60)


async def start_scheduler_task():
    """Start the scheduler as a background task"""
    asyncio.create_task(run_distribution_scheduler())
    logger.info("Distribution scheduler task started")
