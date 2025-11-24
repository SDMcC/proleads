#!/usr/bin/env python3

import requests
import json

def trigger_milestone():
    """Trigger milestone check by calling user milestone API"""
    
    try:
        # Get firstuser's wallet address first
        admin_data = {'username': 'admin', 'password': 'admin123'}
        admin_response = requests.post('https://smartlead-hub-2.preview.emergentagent.com/api/admin/login', json=admin_data)
        admin_token = admin_response.json()['token']
        
        # Get firstuser details
        headers = {'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}
        members_response = requests.get('https://smartlead-hub-2.preview.emergentagent.com/api/admin/members?limit=50', headers=headers)
        members = members_response.json()['members']
        
        firstuser = None
        for member in members:
            if member['username'] == 'firstuser':
                firstuser = member
                break
        
        if not firstuser:
            print("❌ firstuser not found")
            return False
        
        print(f"✅ Found firstuser with {firstuser['total_referrals']} total referrals")
        
        # Login as firstuser to trigger milestone check
        login_data = {
            'address': firstuser['wallet_address'],
            'username': 'firstuser'
        }
        
        login_response = requests.post('https://smartlead-hub-2.preview.emergentagent.com/api/auth/simple-login', json=login_data)
        if login_response.status_code != 200:
            print(f"❌ Failed to login as firstuser: {login_response.text}")
            return False
        
        user_token = login_response.json()['token']
        print("✅ Logged in as firstuser")
        
        # Call user milestones API to trigger milestone creation
        user_headers = {'Authorization': f'Bearer {user_token}', 'Content-Type': 'application/json'}
        milestones_response = requests.get('https://smartlead-hub-2.preview.emergentagent.com/api/users/milestones', headers=user_headers)
        
        if milestones_response.status_code != 200:
            print(f"❌ Failed to get milestones: {milestones_response.text}")
            return False
        
        milestone_data = milestones_response.json()
        print(f"✅ Milestone API called successfully")
        print(f"   Paid downlines: {milestone_data['paid_downlines']}")
        print(f"   Achieved milestones: {len(milestone_data['achieved_milestones'])}")
        
        # Print achieved milestones details
        if milestone_data['achieved_milestones']:
            print("\n🏆 ACHIEVED MILESTONES:")
            for milestone in milestone_data['achieved_milestones']:
                print(f"   - {milestone['milestone_count']} referrals: ${milestone['bonus_amount']} ({milestone['status']})")
        else:
            print("\n⏳ No milestones achieved yet (milestone may be created on next check)")
        
        # Check admin milestones view
        print("\n🔍 Checking admin milestones view...")
        admin_milestones_response = requests.get('https://smartlead-hub-2.preview.emergentagent.com/api/admin/milestones', headers=headers)
        
        if admin_milestones_response.status_code == 200:
            admin_data = admin_milestones_response.json()
            print(f"✅ Admin milestones: {admin_data['total_count']} total milestones")
            
            if admin_data['milestones']:
                print("\n📋 ADMIN MILESTONE VIEW:")
                for milestone in admin_data['milestones']:
                    print(f"   - {milestone['username']}: {milestone['milestone_count']} referrals, ${milestone['bonus_amount']} ({milestone['status']})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error triggering milestone: {str(e)}")
        return False

if __name__ == "__main__":
    print("🎯 Triggering Milestone Check for firstuser")
    print("=" * 40)
    trigger_milestone()