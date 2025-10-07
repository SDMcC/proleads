#!/usr/bin/env python3

import asyncio
import os
import uuid
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")

async def create_bronze_users():
    """Create 14 new Bronze users distributed among sponsors"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Get sponsor information
        sponsors = {}
        sponsor_names = ["firstuser", "seconduser", "thirduser"]
        
        for name in sponsor_names:
            user = await db.users.find_one({"username": name})
            if user:
                sponsors[name] = {
                    "address": user["address"],
                    "referral_code": user["referral_code"]
                }
                # Count current referrals
                referral_count = await db.users.count_documents({
                    "referrer_address": user["address"],
                    "membership_tier": {"$ne": "affiliate"},
                    "suspended": {"$ne": True}
                })
                print(f"✅ Found {name}: {referral_count} current paid referrals")
            else:
                print(f"❌ {name} not found")
        
        if len(sponsors) < 3:
            print("❌ Not all sponsors found")
            return False
        
        # User distribution: 6 under firstuser, 5 under seconduser, 3 under thirduser
        user_distribution = [
            ("firstuser", 6),
            ("seconduser", 5), 
            ("thirduser", 3)
        ]
        
        created_users = []
        
        for sponsor_name, count in user_distribution:
            sponsor = sponsors[sponsor_name]
            print(f"\n🔥 Creating {count} Bronze users under {sponsor_name}")
            
            for i in range(count):
                # Generate user data
                user_id = str(uuid.uuid4())
                wallet_address = f"0x{user_id.replace('-', '')[:40]}"
                username = f"bronze_user_{sponsor_name}_{i+1}_{int(datetime.now().timestamp())}"
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
                    "referrer_address": sponsor["address"],
                    "referrals": [],
                    "total_earnings": 0,
                    "suspended": False,
                    "subscription_expires_at": datetime.utcnow() + timedelta(days=365),
                    "is_expired": False,
                    "created_at": datetime.utcnow(),
                    "last_active": datetime.utcnow()
                }
                
                # Insert user
                result = await db.users.insert_one(user_doc)
                
                # Add to sponsor's referrals list
                await db.users.update_one(
                    {"address": sponsor["address"]},
                    {"$push": {"referrals": f"{username} - {email} - bronze"}}
                )
                
                # Create a payment record to make them "paid" Bronze members
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
                
                created_users.append({
                    "username": username,
                    "email": email,
                    "sponsor": sponsor_name,
                    "tier": "bronze"
                })
                
                print(f"   ✅ Created {username} under {sponsor_name}")
        
        print(f"\n🎉 Successfully created {len(created_users)} Bronze users")
        
        # Check final referral counts and milestone eligibility
        print(f"\n📊 Final Referral Counts:")
        for sponsor_name in sponsor_names:
            user = await db.users.find_one({"username": sponsor_name})
            if user:
                referral_count = await db.users.count_documents({
                    "referrer_address": user["address"],
                    "membership_tier": {"$ne": "affiliate"},
                    "suspended": {"$ne": True}
                })
                print(f"   {sponsor_name}: {referral_count} paid referrals")
                
                # Check for milestone achievement
                if referral_count >= 25:
                    print(f"   🏆 {sponsor_name} has achieved 25+ milestone!")
                elif referral_count >= 100:
                    print(f"   🏆🏆 {sponsor_name} has achieved 100+ milestone!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating Bronze users: {str(e)}")
        return False
    finally:
        client.close()

async def main():
    print("🚀 Creating Bronze Users for Milestone Testing")
    print("=" * 50)
    
    success = await create_bronze_users()
    
    if success:
        print("\n✅ All Bronze users created successfully!")
        print("🔔 Milestone achievements should now be visible in both admin and user dashboards")
    else:
        print("\n❌ Failed to create Bronze users")

if __name__ == "__main__":
    asyncio.run(main())