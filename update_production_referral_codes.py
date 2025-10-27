#!/usr/bin/env python3
"""
Script to update referral codes in PRODUCTION MongoDB Atlas database
Run this to migrate production users to the new username-based format
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# Production MongoDB Atlas credentials
PRODUCTION_MONGO_URL = "mongodb+srv://proleads-hub:d3vk62slqs2c73erkog0@customer-apps-pri.iell6r.mongodb.net/?appName=customer-apps-pri&maxPoolSize=5&retryWrites=true&w=majority"
PRODUCTION_DB_NAME = "proleads-hub-test_database"

async def update_production_referral_codes():
    """Update all referral codes in production database to use lowercase usernames"""
    
    print("=" * 70)
    print("UPDATING PRODUCTION DATABASE (MongoDB Atlas)")
    print("=" * 70)
    print(f"\nDatabase: {PRODUCTION_DB_NAME}")
    print(f"Cluster: customer-apps-pri.iell6r.mongodb.net")
    print("\nConnecting to production database...\n")
    
    try:
        client = AsyncIOMotorClient(PRODUCTION_MONGO_URL)
        db = client[PRODUCTION_DB_NAME]
        
        # Test connection
        await db.command('ping')
        print("✅ Connected to production database successfully!\n")
        
        users = await db.users.find({}).to_list(length=None)
        
        print(f"Found {len(users)} users in production database\n")
        print("=" * 70)
        
        updated_count = 0
        skipped_count = 0
        
        for user in users:
            old_code = user.get("referral_code", "")
            new_code = user.get("username", "").lower()
            
            if old_code != new_code and new_code:
                # Update the user's referral code
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"referral_code": new_code}}
                )
                print(f"✅ Updated: {user['username']}")
                print(f"   Old: {old_code}")
                print(f"   New: {new_code}")
                print("-" * 70)
                updated_count += 1
            else:
                skipped_count += 1
        
        print("=" * 70)
        print(f"\n✅ MIGRATION COMPLETE!")
        print(f"\nResults:")
        print(f"  - Total users found: {len(users)}")
        print(f"  - Users updated: {updated_count}")
        print(f"  - Users skipped (already correct): {skipped_count}")
        print(f"\n🎉 Production database is now updated!")
        print(f"\nAll users now have clean referral URLs:")
        print(f"  Example: https://proleads.network/r/username")
        print("=" * 70)
        
    except Exception as e:
        print("=" * 70)
        print("❌ ERROR updating production database")
        print("=" * 70)
        print(f"\nError: {str(e)}")
        print("\nPossible issues:")
        print("1. MongoDB Atlas connection string is incorrect")
        print("2. Database credentials are invalid")
        print("3. Network/firewall blocking connection")
        print("4. Database name is incorrect")
        
    finally:
        client.close()
        print("\n✅ Database connection closed")

if __name__ == "__main__":
    asyncio.run(update_production_referral_codes())
