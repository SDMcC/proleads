"""
Scheduler health monitoring - writes status to database for production monitoring
"""
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)


async def update_scheduler_heartbeat(db):
    """Update scheduler heartbeat every minute"""
    try:
        await db.scheduler_health.update_one(
            {"service": "scheduler"},
            {
                "$set": {
                    "last_heartbeat": datetime.utcnow(),
                    "status": "running",
                    "service": "scheduler"
                }
            },
            upsert=True
        )
    except Exception as e:
        logger.error(f"Failed to update scheduler heartbeat: {str(e)}")


async def log_scheduler_event(db, event_type: str, message: str, schedule_id: str = None, error: str = None):
    """Log scheduler events to database for production monitoring"""
    try:
        event_doc = {
            "event_type": event_type,  # "check", "execute", "skip", "error", "complete"
            "message": message,
            "schedule_id": schedule_id,
            "error": error,
            "timestamp": datetime.utcnow()
        }
        await db.scheduler_events.insert_one(event_doc)
        
        # Keep only last 500 events
        count = await db.scheduler_events.count_documents({})
        if count > 500:
            # Delete oldest events
            oldest = await db.scheduler_events.find().sort("timestamp", 1).limit(count - 500).to_list(None)
            if oldest:
                oldest_ids = [e["_id"] for e in oldest]
                await db.scheduler_events.delete_many({"_id": {"$in": oldest_ids}})
    except Exception as e:
        logger.error(f"Failed to log scheduler event: {str(e)}")
