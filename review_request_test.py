import requests
import sys
import json
import time
from datetime import datetime
import uuid

class ReviewRequestTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        if not headers:
            headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data)[:300]}...")
                    return success, response_data
                except:
                    print(f"   Response: {response.text[:300]}...")
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'No detail provided')
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}
    
    def test_admin_login_exact_spec(self):
        """Test exact admin login as specified in review request"""
        print("\n🔐 Testing Admin Login (Exact Specification)...")
        
        data = {
            "username": "admin",
            "password": "admin123"
        }
        
        headers = {'Content-Type': 'application/json'}
        success, response = self.run_test("POST /api/admin/login", "POST", "admin/login", 200, data, headers)
        
        if success and response.get('token'):
            self.admin_token = response.get('token')
            print(f"✅ Admin JWT token received: {self.admin_token[:30]}...")
            
            # Verify token structure
            if response.get('role') == 'admin' and response.get('username') == 'admin':
                print("✅ Token contains correct admin role and username")
                return True, response
            else:
                print("❌ Token missing required admin role or username")
                return False, {}
        
        return success, response
    
    def test_admin_dashboard_exact_spec(self):
        """Test exact admin dashboard as specified in review request"""
        print("\n📊 Testing Admin Dashboard (Exact Specification)...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False, {}
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        success, response = self.run_test("GET /api/admin/dashboard/overview", "GET", "admin/dashboard/overview", 200, headers=headers)
        
        if success:
            # Verify clean state as expected after database cleanup
            members_data = response.get('members', {})
            payments_data = response.get('payments', {})
            commissions_data = response.get('commissions', {})
            
            print("📊 Dashboard Clean State Verification:")
            print(f"   Members: {members_data.get('total', 0)} (should be 1 - admin only)")
            print(f"   Payments: {payments_data.get('total', 0)} (should be 0)")
            print(f"   Commissions: {commissions_data.get('total', 0)} (should be 0)")
            print(f"   Revenue: ${payments_data.get('total_revenue', 0)} (should be $0)")
            print(f"   Payouts: ${commissions_data.get('total_payouts', 0)} (should be $0)")
            
            # Verify expected clean state
            expected_clean_state = (
                members_data.get('total', 0) == 1 and  # Only admin
                payments_data.get('total', 0) == 0 and  # No payments
                commissions_data.get('total', 0) == 0 and  # No commissions
                payments_data.get('total_revenue', 0) == 0 and  # No revenue
                commissions_data.get('total_payouts', 0) == 0  # No payouts
            )
            
            if expected_clean_state:
                print("✅ Dashboard shows expected clean state (0 members, 0 payments, etc.)")
            else:
                print("❌ Dashboard does not show expected clean state")
                
            return expected_clean_state, response
        
        return success, response
    
    def test_user_registration_exact_spec(self):
        """Test exact user registration as specified in review request"""
        print("\n👤 Testing User Registration (Exact Specification)...")
        
        data = {
            "username": "testuser1",
            "email": "test1@example.com",
            "password": "password123",
            "wallet_address": "0x1234567890123456789012345678901234567890"
        }
        
        headers = {'Content-Type': 'application/json'}
        success, response = self.run_test("POST /api/users/register", "POST", "users/register", 200, data, headers)
        
        if success:
            # Verify response contains expected fields
            required_fields = ['user_id', 'username', 'email', 'referral_code', 'membership_tier']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                print("✅ Registration response contains all required fields")
                print(f"   Username: {response.get('username')}")
                print(f"   Email: {response.get('email')}")
                print(f"   Referral Code: {response.get('referral_code')}")
                print(f"   Membership Tier: {response.get('membership_tier')}")
                
                # Verify specific values match request
                values_match = (
                    response.get('username') == data['username'] and
                    response.get('email') == data['email'] and
                    response.get('membership_tier') == 'affiliate'  # Default tier
                )
                
                if values_match:
                    print("✅ Registration values match request data")
                else:
                    print("❌ Registration values don't match request data")
                    
                return values_match, response
            else:
                print(f"❌ Registration response missing required fields: {missing_fields}")
                return False, {}
        
        return success, response
    
    def test_database_state_after_registration(self):
        """Verify database state after new registration"""
        print("\n🗄️ Testing Database State After Registration...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False, {}
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        success, response = self.run_test("Database State After Registration", "GET", "admin/dashboard/overview", 200, headers=headers)
        
        if success:
            members_data = response.get('members', {})
            total_members = members_data.get('total', 0)
            
            print(f"📊 Updated Database State:")
            print(f"   Total Members: {total_members} (should be 2 - admin + new user)")
            
            if total_members == 2:
                print("✅ Database correctly shows 2 members after registration")
                
                # Check member breakdown by tier
                by_tier = members_data.get('by_tier', {})
                admin_count = by_tier.get('admin', 0)
                affiliate_count = by_tier.get('affiliate', 0)
                
                print(f"   Admin users: {admin_count}")
                print(f"   Affiliate users: {affiliate_count}")
                
                if admin_count == 1 and affiliate_count == 1:
                    print("✅ Member tier breakdown is correct")
                    return True, response
                else:
                    print("❌ Member tier breakdown is incorrect")
                    return False, {}
            else:
                print(f"❌ Expected 2 members after registration, got {total_members}")
                return False, {}
        
        return success, response
    
    def run_review_request_tests(self):
        """Run all tests specified in the review request"""
        print("🎯 REVIEW REQUEST VERIFICATION TEST SUITE")
        print("=" * 60)
        print("Verify Clean Database State and Admin Functionality")
        print("=" * 60)
        
        all_tests_passed = True
        
        # Test 1: Database State Verification (initial check)
        print("\n1️⃣ DATABASE STATE VERIFICATION")
        print("Confirm only 1 user exists (admin)")
        print("Verify all other collections are empty")
        
        # First get admin token
        admin_login_success, _ = self.test_admin_login_exact_spec()
        if not admin_login_success:
            print("❌ CRITICAL: Admin login failed")
            all_tests_passed = False
        
        # Check initial database state
        if admin_login_success:
            dashboard_success, _ = self.test_admin_dashboard_exact_spec()
            if not dashboard_success:
                print("❌ CRITICAL: Database state verification failed")
                all_tests_passed = False
        
        # Test 2: Admin Login Test
        print("\n2️⃣ ADMIN LOGIN TEST")
        print("Test admin authentication: POST /api/admin/login")
        print("Credentials: admin/admin123")
        
        if admin_login_success:
            print("✅ Admin login test already passed")
        else:
            print("❌ Admin login test failed")
            all_tests_passed = False
        
        # Test 3: Admin Dashboard Test
        print("\n3️⃣ ADMIN DASHBOARD TEST")
        print("Test admin dashboard functionality: GET /api/admin/dashboard/overview")
        
        if admin_login_success and dashboard_success:
            print("✅ Admin dashboard test already passed")
        else:
            print("❌ Admin dashboard test failed")
            all_tests_passed = False
        
        # Test 4: Basic User Registration Test
        print("\n4️⃣ BASIC USER REGISTRATION TEST")
        print("Test that new user registration works: POST /api/users/register")
        
        registration_success, _ = self.test_user_registration_exact_spec()
        if not registration_success:
            print("❌ CRITICAL: User registration failed")
            all_tests_passed = False
        
        # Test 5: Verify database state after registration
        if registration_success:
            db_after_reg_success, _ = self.test_database_state_after_registration()
            if not db_after_reg_success:
                print("❌ Database state after registration verification failed")
                all_tests_passed = False
        
        # Final Summary
        print("\n" + "=" * 60)
        print("🎯 REVIEW REQUEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if all_tests_passed:
            print("\n✅ ALL REVIEW REQUEST TESTS PASSED")
            print("✅ Admin authentication working")
            print("✅ Admin dashboard accessible")
            print("✅ Clean database state confirmed")
            print("✅ New registration system functional")
            print("✅ Database is ready for fresh testing")
        else:
            print("\n❌ SOME REVIEW REQUEST TESTS FAILED")
            print("❌ Review request verification incomplete")
            
        return all_tests_passed

def main():
    if len(sys.argv) != 2:
        print("Usage: python review_request_test.py <base_url>")
        print("Example: python review_request_test.py https://membership-tiers-2.preview.emergentagent.com")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    
    print(f"🚀 Starting Review Request Verification Tests")
    print(f"🌐 Base URL: {base_url}")
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tester = ReviewRequestTester(base_url)
    success = tester.run_review_request_tests()
    
    print(f"\n⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if success:
        print("🎉 Review request verification completed successfully!")
        sys.exit(0)
    else:
        print("💥 Review request verification failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()