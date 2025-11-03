#!/usr/bin/env python3

import requests
import json
from datetime import datetime
import uuid

def create_test_milestones():
    # Get admin token
    admin_data = {'username': 'admin', 'password': 'admin123'}
    response = requests.post('https://affnet-dashboard-1.preview.emergentagent.com/api/admin/login', json=admin_data)
    admin_token = response.json()['token']

    # Get some users to create milestones for
    headers = {'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}
    response = requests.get('https://affnet-dashboard-1.preview.emergentagent.com/api/admin/members?limit=10', headers=headers)
    members = response.json()['members']

    if len(members) < 3:
        print("Not enough members to create test milestones")
        return False

    # Create test milestones using MongoDB directly
    import os
    from motor.motor_asyncio import AsyncIOMotorClient
    import asyncio
    
    async def insert_milestones():
        client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
        db = client[os.getenv("DB_NAME", "test_database")]
        
        # Create test milestones for different users
        test_milestones = [
            {
                "milestone_id": str(uuid.uuid4()),
                "user_address": members[0]['wallet_address'],
                "milestone_count": 25,
                "bonus_amount": 25.0,
                "achieved_date": datetime.utcnow(),
                "status": "pending",
                "created_at": datetime.utcnow()
            },
            {
                "milestone_id": str(uuid.uuid4()),
                "user_address": members[1]['wallet_address'],
                "milestone_count": 100,
                "bonus_amount": 100.0,
                "achieved_date": datetime.utcnow(),
                "status": "pending",
                "created_at": datetime.utcnow()
            },
            {
                "milestone_id": str(uuid.uuid4()),
                "user_address": members[2]['wallet_address'],
                "milestone_count": 250,
                "bonus_amount": 250.0,
                "achieved_date": datetime.utcnow(),
                "status": "paid",
                "created_at": datetime.utcnow()
            }
        ]
        
        # Insert milestones
        result = await db.milestones.insert_many(test_milestones)
        print(f"Created {len(result.inserted_ids)} test milestones")
        
        # Verify insertion
        count = await db.milestones.count_documents({})
        print(f"Total milestones in database: {count}")
        
        client.close()
        return True
    
    # Run the async function
    return asyncio.run(insert_milestones())

if __name__ == "__main__":
    create_test_milestones()