#!/usr/bin/env python3

import requests
import json

def trigger_milestones():
    # Get admin token
    admin_data = {'username': 'admin', 'password': 'admin123'}
    response = requests.post('https://membership-tier.preview.emergentagent.com/api/admin/login', json=admin_data)
    admin_token = response.json()['token']

    # Get firstuser details
    headers = {'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}
    response = requests.get('https://membership-tier.preview.emergentagent.com/api/admin/members?limit=50', headers=headers)
    members = response.json()['members']

    firstuser = None
    for member in members:
        if member['username'] == 'firstuser':
            firstuser = member
            break

    if firstuser:
        print(f'Found firstuser with {firstuser["total_referrals"]} referrals')
        print(f'Wallet address: {firstuser["wallet_address"]}')
        
        # Try to login as firstuser using simple login
        login_data = {
            'address': firstuser['wallet_address'],
            'username': firstuser['username']
        }
        
        login_response = requests.post('https://membership-tier.preview.emergentagent.com/api/auth/simple-login', json=login_data)
        if login_response.status_code == 200:
            user_token = login_response.json()['token']
            print('Successfully logged in as firstuser')
            
            # Call user milestones endpoint to trigger milestone creation
            user_headers = {'Authorization': f'Bearer {user_token}', 'Content-Type': 'application/json'}
            milestones_response = requests.get('https://membership-tier.preview.emergentagent.com/api/users/milestones', headers=user_headers)
            
            if milestones_response.status_code == 200:
                milestones_data = milestones_response.json()
                print(f'Paid downlines: {milestones_data["paid_downlines"]}')
                print(f'Achieved milestones: {len(milestones_data["achieved_milestones"])}')
                for milestone in milestones_data['achieved_milestones']:
                    print(f'  - {milestone["milestone_count"]} referrals = ${milestone["bonus_amount"]} ({milestone["status"]})')
                return True
            else:
                print(f'Failed to get milestones: {milestones_response.status_code} - {milestones_response.text}')
                return False
        else:
            print(f'Failed to login as firstuser: {login_response.status_code} - {login_response.text}')
            return False
    else:
        print('firstuser not found')
        return False

if __name__ == "__main__":
    trigger_milestones()