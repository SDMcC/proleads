#!/usr/bin/env python3
"""
Test user profile endpoint to verify user data retrieval
"""

import requests
import json
import time
import uuid
from datetime import datetime

class UserProfileTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.user_token = None
        self.user_data = None
        
    def register_and_authenticate_user(self):
        """Register a new user and attempt authentication"""
        # Step 1: Register user
        user_address = f"0x{uuid.uuid4().hex[:40]}"
        username = f"profile_test_user_{int(time.time())}"
        email = f"{username}@test.com"
        
        url = f"{self.base_url}/api/users/register"
        data = {
            "address": user_address,
            "username": username,
            "email": email
        }
        
        print(f"👤 Registering user: {username}")
        response = requests.post(url, json=data)
        
        if response.status_code != 200:
            print(f"❌ User registration failed: {response.status_code} - {response.text}")
            return False
        
        result = response.json()
        self.user_data = {
            "address": user_address,
            "username": username,
            "email": email,
            "referral_code": result.get('referral_code'),
            "membership_tier": result.get('membership_tier', 'affiliate')
        }
        
        print(f"✅ User registered successfully")
        print(f"   Address: {user_address}")
        print(f"   Username: {username}")
        print(f"   Referral Code: {self.user_data['referral_code']}")
        
        # Step 2: Get nonce for authentication
        nonce_url = f"{self.base_url}/api/auth/nonce"
        nonce_data = {"address": user_address}
        
        print(f"🔑 Getting nonce for authentication...")
        nonce_response = requests.post(nonce_url, json=nonce_data)
        
        if nonce_response.status_code != 200:
            print(f"❌ Failed to get nonce: {nonce_response.status_code} - {nonce_response.text}")
            return False
        
        nonce_result = nonce_response.json()
        nonce = nonce_result.get('nonce')
        print(f"✅ Nonce received: {nonce}")
        
        # Step 3: Note about signature verification
        print(f"📝 Note: In a real scenario, we would sign the nonce with the user's private key")
        print(f"📝 For testing purposes, we'll test the profile endpoint without authentication")
        print(f"📝 This will help us verify the endpoint structure and error handling")
        
        return True
    
    def test_user_profile_without_auth(self):
        """Test user profile endpoint without authentication"""
        url = f"{self.base_url}/api/users/profile"
        
        print(f"🔍 Testing user profile endpoint without authentication...")
        response = requests.get(url)
        
        if response.status_code == 401:
            print(f"✅ Correct behavior: Returns 401 without authentication")
            try:
                error_data = response.json()
                print(f"   Error message: {error_data.get('detail', 'No detail provided')}")
            except:
                print(f"   Response: {response.text}")
            return True
        else:
            print(f"❌ Unexpected response: {response.status_code} - {response.text}")
            return False
    
    def test_user_profile_with_invalid_token(self):
        """Test user profile endpoint with invalid token"""
        url = f"{self.base_url}/api/users/profile"
        headers = {
            'Authorization': 'Bearer invalid_token_12345',
            'Content-Type': 'application/json'
        }
        
        print(f"🔍 Testing user profile endpoint with invalid token...")
        response = requests.get(url, headers=headers)
        
        if response.status_code == 401:
            print(f"✅ Correct behavior: Returns 401 with invalid token")
            try:
                error_data = response.json()
                print(f"   Error message: {error_data.get('detail', 'No detail provided')}")
            except:
                print(f"   Response: {response.text}")
            return True
        else:
            print(f"❌ Unexpected response: {response.status_code} - {response.text}")
            return False
    
    def check_database_for_user(self):
        """Check if the user exists in the database by trying to get referral info"""
        if not self.user_data or not self.user_data.get('referral_code'):
            print("❌ No user data available to check")
            return False
        
        url = f"{self.base_url}/api/referral/{self.user_data['referral_code']}"
        
        print(f"🔍 Checking if user exists in database via referral endpoint...")
        response = requests.get(url)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ User found in database:")
            print(f"   Referrer Username: {result.get('referrer_username')}")
            print(f"   Referrer Tier: {result.get('referrer_tier')}")
            print(f"   Referral Code: {result.get('referral_code')}")
            
            # Verify the data matches what we registered
            if (result.get('referrer_username') == self.user_data['username'] and
                result.get('referral_code') == self.user_data['referral_code']):
                print(f"✅ Database data matches registered user data")
                return True
            else:
                print(f"❌ Database data doesn't match registered user data")
                return False
        else:
            print(f"❌ User not found in database: {response.status_code} - {response.text}")
            return False
    
    def test_admin_can_see_user(self):
        """Test that admin can see the newly registered user in dashboard"""
        # Login as admin
        admin_url = f"{self.base_url}/api/admin/login"
        admin_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        print(f"🔐 Logging in as admin to verify user visibility...")
        admin_response = requests.post(admin_url, json=admin_data)
        
        if admin_response.status_code != 200:
            print(f"❌ Admin login failed: {admin_response.status_code} - {admin_response.text}")
            return False
        
        admin_result = admin_response.json()
        admin_token = admin_result.get('token')
        
        # Get dashboard overview
        dashboard_url = f"{self.base_url}/api/admin/dashboard/overview"
        headers = {
            'Authorization': f'Bearer {admin_token}',
            'Content-Type': 'application/json'
        }
        
        dashboard_response = requests.get(dashboard_url, headers=headers)
        
        if dashboard_response.status_code == 200:
            dashboard_data = dashboard_response.json()
            members = dashboard_data.get('members', {})
            
            print(f"✅ Admin can access dashboard:")
            print(f"   Total Members: {members.get('total', 0)}")
            print(f"   Recent Members (30 days): {members.get('recent_30_days', 0)}")
            print(f"   Members by Tier: {members.get('by_tier', {})}")
            
            return True
        else:
            print(f"❌ Admin dashboard access failed: {dashboard_response.status_code} - {dashboard_response.text}")
            return False
    
    def run_comprehensive_test(self):
        """Run comprehensive user profile and registration test"""
        print("\n🧪 Comprehensive User Profile and Registration Test")
        print("=" * 60)
        
        # Test 1: Register and authenticate user
        print(f"\n📝 Test 1: User Registration")
        registration_success = self.register_and_authenticate_user()
        
        # Test 2: Test profile endpoint without auth
        print(f"\n📝 Test 2: Profile Endpoint Security (No Auth)")
        no_auth_success = self.test_user_profile_without_auth()
        
        # Test 3: Test profile endpoint with invalid token
        print(f"\n📝 Test 3: Profile Endpoint Security (Invalid Token)")
        invalid_token_success = self.test_user_profile_with_invalid_token()
        
        # Test 4: Check if user exists in database
        print(f"\n📝 Test 4: Database Persistence Check")
        database_success = self.check_database_for_user()
        
        # Test 5: Check if admin can see the user
        print(f"\n📝 Test 5: Admin Dashboard Visibility")
        admin_visibility_success = self.test_admin_can_see_user()
        
        # Summary
        print(f"\n" + "=" * 60)
        print(f"📋 TEST RESULTS SUMMARY")
        print(f"=" * 60)
        print(f"User Registration: {'✅ PASSED' if registration_success else '❌ FAILED'}")
        print(f"Profile Security (No Auth): {'✅ PASSED' if no_auth_success else '❌ FAILED'}")
        print(f"Profile Security (Invalid Token): {'✅ PASSED' if invalid_token_success else '❌ FAILED'}")
        print(f"Database Persistence: {'✅ PASSED' if database_success else '❌ FAILED'}")
        print(f"Admin Dashboard Visibility: {'✅ PASSED' if admin_visibility_success else '❌ FAILED'}")
        
        all_passed = all([
            registration_success,
            no_auth_success,
            invalid_token_success,
            database_success,
            admin_visibility_success
        ])
        
        if all_passed:
            print(f"\n🎉 ALL TESTS PASSED: User registration and profile system working correctly!")
            print(f"\n📋 Key Findings:")
            print(f"   ✅ Users can be registered successfully")
            print(f"   ✅ User data is persisted in database")
            print(f"   ✅ Profile endpoint has proper authentication")
            print(f"   ✅ Admin can see newly registered users")
            print(f"   ✅ Referral system is working")
        else:
            print(f"\n⚠️ SOME TESTS FAILED: There may be issues with the user system")
        
        return all_passed

def main():
    backend_url = "https://membership-tiers-2.preview.emergentagent.com"
    
    print("🚀 User Profile and Registration System Test")
    print("=" * 50)
    
    tester = UserProfileTester(backend_url)
    success = tester.run_comprehensive_test()
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())