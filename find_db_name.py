#!/usr/bin/env python3
"""
Script to discover the correct MongoDB database name in production
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import urlparse

async def find_database_name():
    """Find the correct database name for production"""
    
    # Get MongoDB URL from environment
    mongo_url = os.getenv("MONGO_URL")
    
    if not mongo_url:
        print("❌ MONGO_URL not found in environment variables")
        return
    
    print(f"✓ MongoDB URL found")
    print(f"  URL: {mongo_url[:50]}...")
    
    # Try to extract database name from connection string
    parsed = urlparse(mongo_url)
    db_from_url = parsed.path.strip('/')
    
    if db_from_url:
        print(f"\n✓ Database name found in connection string: '{db_from_url}'")
        print(f"\n>>> Use this in your .env file: DB_NAME=\"{db_from_url}\"")
    else:
        print("\n⚠ No database name in connection string")
    
    # Try to connect and list databases
    print("\n🔍 Attempting to connect to MongoDB...")
    
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        
        # Test connection
        await client.admin.command('ping')
        print("✓ MongoDB connection successful!")
        
        # List all databases
        print("\n📚 Databases you have access to:")
        db_list = await client.list_database_names()
        
        for idx, db_name in enumerate(db_list, 1):
            print(f"  {idx}. {db_name}")
        
        # Try to find the most likely production database
        production_dbs = [db for db in db_list if db not in ['admin', 'local', 'config', 'test_database']]
        
        if production_dbs:
            print(f"\n✅ Recommended database name: '{production_dbs[0]}'")
            print(f"\n>>> Update your .env file with: DB_NAME=\"{production_dbs[0]}\"")
            
            # Try to access the recommended database
            print(f"\n🔍 Testing access to '{production_dbs[0]}'...")
            test_db = client[production_dbs[0]]
            collections = await test_db.list_collection_names()
            print(f"✓ Database accessible! Collections: {collections if collections else '(empty)'}")
        elif db_from_url:
            print(f"\n✅ Use database name from URL: '{db_from_url}'")
            print(f"\n>>> Update your .env file with: DB_NAME=\"{db_from_url}\"")
        else:
            print("\n⚠ No suitable database found. You may need to create one.")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {str(e)}")
        print(f"\nIf database name was found in URL, try using: DB_NAME=\"{db_from_url}\"")

if __name__ == "__main__":
    asyncio.run(find_database_name())
