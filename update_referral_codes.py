#!/usr/bin/env python3
"""
Script to update existing referral codes to use lowercase usernames
Run this once to migrate existing users to the new format
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

async def update_referral_codes():
    """Update all existing referral codes to use lowercase usernames"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        users = await db.users.find({}).to_list(length=None)
        
        print(f"Found {len(users)} users to update")
        updated_count = 0
        
        for user in users:
            old_code = user.get("referral_code", "")
            new_code = user.get("username", "").lower()
            
            if old_code != new_code and new_code:
                # Update the user's referral code
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"referral_code": new_code}}
                )
                print(f"Updated user {user['username']}: {old_code} -> {new_code}")
                updated_count += 1
        
        print(f"\n✅ Successfully updated {updated_count} referral codes")
        
    except Exception as e:
        print(f"❌ Error updating referral codes: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(update_referral_codes())
