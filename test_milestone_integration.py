#!/usr/bin/env python3

import requests
import json

def test_milestone_integration():
    print("🔗 Testing Milestone System Integration")
    print("=" * 50)
    
    # Get admin token
    admin_data = {'username': 'admin', 'password': 'admin123'}
    response = requests.post('https://affnet-dashboard.preview.emergentagent.com/api/admin/login', json=admin_data)
    admin_token = response.json()['token']

    # Get firstuser details
    headers = {'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}
    response = requests.get('https://affnet-dashboard.preview.emergentagent.com/api/admin/members?limit=50', headers=headers)
    members = response.json()['members']

    firstuser = None
    for member in members:
        if member['username'] == 'firstuser':
            firstuser = member
            break

    if not firstuser:
        print("❌ firstuser not found")
        return False

    print(f"✅ Found firstuser with {firstuser['total_referrals']} referrals")
    
    # Login as firstuser
    login_data = {
        'address': firstuser['wallet_address'],
        'username': firstuser['username']
    }
    
    login_response = requests.post('https://affnet-dashboard.preview.emergentagent.com/api/auth/simple-login', json=login_data)
    if login_response.status_code != 200:
        print(f"❌ Failed to login as firstuser: {login_response.status_code}")
        return False
    
    user_token = login_response.json()['token']
    print("✅ Successfully logged in as firstuser")
    
    # Test user milestones endpoint
    user_headers = {'Authorization': f'Bearer {user_token}', 'Content-Type': 'application/json'}
    milestones_response = requests.get('https://affnet-dashboard.preview.emergentagent.com/api/users/milestones', headers=user_headers)
    
    if milestones_response.status_code != 200:
        print(f"❌ Failed to get user milestones: {milestones_response.status_code}")
        return False
    
    milestones_data = milestones_response.json()
    print(f"✅ User milestones endpoint working")
    print(f"   Paid downlines: {milestones_data['paid_downlines']}")
    print(f"   Achieved milestones: {len(milestones_data['achieved_milestones'])}")
    
    # Test admin milestones endpoint
    admin_milestones_response = requests.get('https://affnet-dashboard.preview.emergentagent.com/api/admin/milestones', headers=headers)
    
    if admin_milestones_response.status_code != 200:
        print(f"❌ Failed to get admin milestones: {admin_milestones_response.status_code}")
        return False
    
    admin_milestones_data = admin_milestones_response.json()
    print(f"✅ Admin milestones endpoint working")
    print(f"   Total milestones in admin view: {admin_milestones_data['total_count']}")
    
    # Verify milestone bonus structure
    expected_bonuses = {25: 25, 100: 100, 250: 250, 1000: 1000, 5000: 2500, 10000: 5000}
    all_milestones = milestones_data.get('all_milestones', [])
    
    print("\n🎯 Milestone Bonus Structure Verification:")
    for milestone in all_milestones:
        count = milestone['milestone_count']
        amount = milestone['bonus_amount']
        expected = expected_bonuses.get(count, 0)
        
        if amount == expected:
            print(f"   ✅ {count} referrals = ${amount}")
        else:
            print(f"   ❌ {count} referrals = ${amount} (expected ${expected})")
            return False
    
    print("\n✅ All integration tests passed!")
    return True

if __name__ == "__main__":
    test_milestone_integration()