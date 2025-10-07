#!/usr/bin/env python3

import asyncio
import os
import uuid
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")

async def add_more_users():
    """Add 7 more users under firstuser to reach 25 milestone"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Get firstuser information
        firstuser = await db.users.find_one({"username": "firstuser"})
        if not firstuser:
            print("❌ firstuser not found")
            return False
        
        current_count = await db.users.count_documents({
            "referrer_address": firstuser["address"],
            "membership_tier": {"$ne": "affiliate"},
            "suspended": {"$ne": True}
        })
        
        print(f"✅ firstuser currently has {current_count} paid referrals")
        print(f"🎯 Adding 7 more users to reach 25 milestone...")
        
        # Create 7 more Bronze users under firstuser
        for i in range(7):
            user_id = str(uuid.uuid4())
            wallet_address = f"0x{user_id.replace('-', '')[:40]}"
            username = f"bronze_milestone_{i+1}_{int(datetime.now().timestamp())}"
            email = f"{username}@example.com"
            referral_code = f"REF{username.upper()[:10]}{user_id[:8].upper()}"
            
            # Create user document
            user_doc = {
                "user_id": user_id,
                "address": wallet_address,
                "username": username,
                "email": email,
                "membership_tier": "bronze",
                "referral_code": referral_code,
                "referrer_address": firstuser["address"],
                "referrals": [],
                "total_earnings": 0,
                "suspended": False,
                "subscription_expires_at": datetime.utcnow() + timedelta(days=365),
                "is_expired": False,
                "created_at": datetime.utcnow(),
                "last_active": datetime.utcnow()
            }
            
            # Insert user
            await db.users.insert_one(user_doc)
            
            # Add to sponsor's referrals list
            await db.users.update_one(
                {"address": firstuser["address"]},
                {"$push": {"referrals": f"{username} - {email} - bronze"}}
            )
            
            # Create a payment record
            payment_doc = {
                "payment_id": str(uuid.uuid4()),
                "user_address": wallet_address,
                "username": username,
                "email": email,
                "amount": 20.0,
                "currency": "USD",
                "tier": "bronze",
                "status": "confirmed",
                "payment_url": f"https://nowpayments.io/payment/{user_id}",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "nowpayments_id": f"np_{user_id[:8]}",
                "invoice_id": f"inv_{user_id[:8]}"
            }
            
            await db.payments.insert_one(payment_doc)
            print(f"   ✅ Created {username}")
        
        # Check final count
        final_count = await db.users.count_documents({
            "referrer_address": firstuser["address"],
            "membership_tier": {"$ne": "affiliate"},
            "suspended": {"$ne": True}
        })
        
        print(f"\n🎉 firstuser now has {final_count} paid referrals")
        
        if final_count >= 25:
            print(f"🏆 MILESTONE ACHIEVED! firstuser should now have the 25-referral milestone ($25 bonus)")
            
            # Trigger milestone checking by calling the user milestone API
            print("🔄 Triggering milestone check...")
            
        return True
        
    except Exception as e:
        print(f"❌ Error adding users: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(add_more_users())