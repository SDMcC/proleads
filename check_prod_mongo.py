#!/usr/bin/env python3
"""Check production MongoDB databases"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

PROD_MONGO_URL = "mongodb+srv://proleads-hub:d3vk62slqs2c73erkog0@customer-apps-pri.iell6r.mongodb.net/?appName=instant-payout-sys&maxPoolSize=5&retryWrites=true&w=majority"

async def check_databases():
    print("Connecting to production MongoDB...\n")
    
    try:
        client = AsyncIOMotorClient(PROD_MONGO_URL, serverSelectionTimeoutMS=10000)
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected successfully!\n")
        
        # List all databases
        print("📚 Available databases:")
        db_list = await client.list_database_names()
        for db in db_list:
            print(f"  - {db}")
        
        print("\n🔍 Testing write permissions on each database:\n")
        
        for db_name in db_list:
            if db_name not in ['admin', 'local', 'config']:
                db = client[db_name]
                try:
                    # Try to read
                    collections = await db.list_collection_names()
                    print(f"✅ {db_name}")
                    print(f"   Read: OK")
                    print(f"   Collections: {collections if collections else '(empty)'}")
                    
                    # Try to write
                    test_result = await db.test_write.insert_one({"test": "write"})
                    await db.test_write.delete_one({"_id": test_result.inserted_id})
                    print(f"   Write: OK")
                    
                    # Try to find users
                    user_count = await db.users.count_documents({})
                    print(f"   Users collection: {user_count} documents\n")
                    
                except Exception as e:
                    print(f"❌ {db_name}: {str(e)}\n")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_databases())
