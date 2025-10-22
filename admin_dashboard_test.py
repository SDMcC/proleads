#!/usr/bin/env python3
"""
Focused test for admin dashboard overview API to verify user registration tracking
"""

import requests
import json
import time
import uuid
from datetime import datetime

class AdminDashboardTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.admin_token = None
        
    def admin_login(self):
        """Login as admin and get token"""
        url = f"{self.base_url}/api/admin/login"
        data = {
            "username": "admin",
            "password": "admin123"
        }
        
        print("🔐 Logging in as admin...")
        response = requests.post(url, json=data)
        
        if response.status_code == 200:
            result = response.json()
            self.admin_token = result.get('token')
            print(f"✅ Admin login successful")
            return True
        else:
            print(f"❌ Admin login failed: {response.status_code} - {response.text}")
            return False
    
    def get_admin_dashboard_overview(self):
        """Get admin dashboard overview"""
        if not self.admin_token:
            print("❌ No admin token available")
            return None
            
        url = f"{self.base_url}/api/admin/dashboard/overview"
        headers = {
            'Authorization': f'Bearer {self.admin_token}',
            'Content-Type': 'application/json'
        }
        
        print("📊 Fetching admin dashboard overview...")
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Dashboard overview retrieved successfully")
            
            # Print key statistics
            members = data.get('members', {})
            payments = data.get('payments', {})
            commissions = data.get('commissions', {})
            
            print(f"   📈 Total Members: {members.get('total', 0)}")
            print(f"   📈 Members by Tier: {members.get('by_tier', {})}")
            print(f"   📈 Recent Members (30 days): {members.get('recent_30_days', 0)}")
            print(f"   💰 Total Payments: {payments.get('total', 0)}")
            print(f"   💰 Total Revenue: ${payments.get('total_revenue', 0)}")
            print(f"   🎯 Total Commissions: {commissions.get('total', 0)}")
            
            return data
        else:
            print(f"❌ Failed to get dashboard overview: {response.status_code} - {response.text}")
            return None
    
    def register_new_user(self):
        """Register a new user"""
        user_address = f"0x{uuid.uuid4().hex[:40]}"
        username = f"test_user_{int(time.time())}"
        email = f"{username}@test.com"
        
        url = f"{self.base_url}/api/users/register"
        data = {
            "address": user_address,
            "username": username,
            "email": email
        }
        
        print(f"👤 Registering new user: {username}")
        response = requests.post(url, json=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ User registered successfully")
            print(f"   Address: {user_address}")
            print(f"   Username: {username}")
            print(f"   Referral Code: {result.get('referral_code')}")
            return {
                "address": user_address,
                "username": username,
                "email": email,
                "referral_code": result.get('referral_code')
            }
        else:
            print(f"❌ User registration failed: {response.status_code} - {response.text}")
            return None
    
    def check_database_directly(self):
        """Check database directly for user count (if possible)"""
        # This would require database access, which we don't have in this test environment
        # But we can simulate by checking if the API reflects the changes
        print("📋 Note: Direct database access not available in test environment")
        print("📋 Relying on API responses to verify data consistency")
    
    def test_user_registration_tracking(self):
        """Test that newly registered users show up in admin dashboard"""
        print("\n🧪 Testing User Registration Tracking in Admin Dashboard")
        print("=" * 60)
        
        # Step 1: Login as admin
        if not self.admin_login():
            return False
        
        # Step 2: Get initial dashboard state
        print("\n📊 Step 1: Getting initial dashboard state...")
        initial_dashboard = self.get_admin_dashboard_overview()
        if not initial_dashboard:
            return False
        
        initial_total = initial_dashboard.get('members', {}).get('total', 0)
        initial_recent = initial_dashboard.get('members', {}).get('recent_30_days', 0)
        initial_by_tier = initial_dashboard.get('members', {}).get('by_tier', {})
        
        print(f"\n📋 Initial State:")
        print(f"   Total Members: {initial_total}")
        print(f"   Recent Members (30 days): {initial_recent}")
        print(f"   Members by Tier: {initial_by_tier}")
        
        # Step 3: Register a new user
        print(f"\n👤 Step 2: Registering new user...")
        new_user = self.register_new_user()
        if not new_user:
            return False
        
        # Step 4: Wait a moment for database to update
        print("\n⏳ Waiting 2 seconds for database to update...")
        time.sleep(2)
        
        # Step 5: Get updated dashboard state
        print("\n📊 Step 3: Getting updated dashboard state...")
        updated_dashboard = self.get_admin_dashboard_overview()
        if not updated_dashboard:
            return False
        
        updated_total = updated_dashboard.get('members', {}).get('total', 0)
        updated_recent = updated_dashboard.get('members', {}).get('recent_30_days', 0)
        updated_by_tier = updated_dashboard.get('members', {}).get('by_tier', {})
        
        print(f"\n📋 Updated State:")
        print(f"   Total Members: {updated_total}")
        print(f"   Recent Members (30 days): {updated_recent}")
        print(f"   Members by Tier: {updated_by_tier}")
        
        # Step 6: Verify the changes
        print(f"\n🔍 Step 4: Verifying changes...")
        
        total_increased = updated_total > initial_total
        recent_increased = updated_recent > initial_recent
        
        # Check if affiliate tier count increased (new users start as affiliate)
        initial_affiliate = initial_by_tier.get('affiliate', 0)
        updated_affiliate = updated_by_tier.get('affiliate', 0)
        affiliate_increased = updated_affiliate > initial_affiliate
        
        print(f"\n📈 Analysis:")
        print(f"   Total Members Changed: {initial_total} → {updated_total} ({'✅' if total_increased else '❌'})")
        print(f"   Recent Members Changed: {initial_recent} → {updated_recent} ({'✅' if recent_increased else '❌'})")
        print(f"   Affiliate Tier Changed: {initial_affiliate} → {updated_affiliate} ({'✅' if affiliate_increased else '❌'})")
        
        # Overall result
        if total_increased and recent_increased and affiliate_increased:
            print(f"\n✅ SUCCESS: New user registration is properly tracked in admin dashboard!")
            print(f"   - Total member count increased by {updated_total - initial_total}")
            print(f"   - Recent member count increased by {updated_recent - initial_recent}")
            print(f"   - Affiliate tier count increased by {updated_affiliate - initial_affiliate}")
            return True
        else:
            print(f"\n❌ ISSUE DETECTED: New user registration may not be properly tracked!")
            
            if not total_increased:
                print(f"   ⚠️ Total member count did not increase")
            if not recent_increased:
                print(f"   ⚠️ Recent member count did not increase")
            if not affiliate_increased:
                print(f"   ⚠️ Affiliate tier count did not increase")
            
            print(f"\n🔧 Possible causes:")
            print(f"   - Database connection issues")
            print(f"   - Caching issues in the API")
            print(f"   - Race condition between registration and dashboard query")
            print(f"   - Database aggregation query issues")
            
            return False
    
    def test_multiple_registrations(self):
        """Test multiple user registrations to verify consistent tracking"""
        print("\n🧪 Testing Multiple User Registrations")
        print("=" * 40)
        
        if not self.admin_token:
            if not self.admin_login():
                return False
        
        # Get initial state
        initial_dashboard = self.get_admin_dashboard_overview()
        if not initial_dashboard:
            return False
        
        initial_total = initial_dashboard.get('members', {}).get('total', 0)
        
        # Register 3 new users
        registered_users = []
        for i in range(3):
            print(f"\n👤 Registering user {i+1}/3...")
            user = self.register_new_user()
            if user:
                registered_users.append(user)
                time.sleep(1)  # Small delay between registrations
        
        if len(registered_users) != 3:
            print(f"❌ Failed to register all users. Only {len(registered_users)}/3 succeeded")
            return False
        
        # Wait for database to update
        print("\n⏳ Waiting 3 seconds for database to update...")
        time.sleep(3)
        
        # Check final state
        final_dashboard = self.get_admin_dashboard_overview()
        if not final_dashboard:
            return False
        
        final_total = final_dashboard.get('members', {}).get('total', 0)
        expected_total = initial_total + 3
        
        print(f"\n📈 Multiple Registration Analysis:")
        print(f"   Initial Total: {initial_total}")
        print(f"   Expected Total: {expected_total}")
        print(f"   Actual Total: {final_total}")
        print(f"   Users Registered: {len(registered_users)}")
        
        if final_total >= expected_total:
            print(f"✅ SUCCESS: Multiple user registrations tracked correctly!")
            return True
        else:
            print(f"❌ ISSUE: Expected at least {expected_total} users, but got {final_total}")
            print(f"   Missing {expected_total - final_total} users from count")
            return False

def main():
    backend_url = "https://membership-tier.preview.emergentagent.com"
    
    print("🚀 Admin Dashboard User Registration Tracking Test")
    print("=" * 55)
    
    tester = AdminDashboardTester(backend_url)
    
    # Test 1: Single user registration tracking
    single_test_result = tester.test_user_registration_tracking()
    
    # Test 2: Multiple user registration tracking
    multiple_test_result = tester.test_multiple_registrations()
    
    # Summary
    print("\n" + "=" * 55)
    print("📋 TEST SUMMARY")
    print("=" * 55)
    print(f"Single User Registration Test: {'✅ PASSED' if single_test_result else '❌ FAILED'}")
    print(f"Multiple User Registration Test: {'✅ PASSED' if multiple_test_result else '❌ FAILED'}")
    
    if single_test_result and multiple_test_result:
        print(f"\n🎉 ALL TESTS PASSED: Admin dashboard correctly tracks new user registrations!")
        return 0
    else:
        print(f"\n⚠️ SOME TESTS FAILED: There may be issues with user registration tracking in the admin dashboard.")
        return 1

if __name__ == "__main__":
    exit(main())