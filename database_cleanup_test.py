import requests
import sys
import json
import time
from datetime import datetime
import uuid

class DatabaseCleanupVerificationTester:
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
            if self.admin_token:
                headers['Authorization'] = f'Bearer {self.admin_token}'
        
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
    
    def test_admin_login(self):
        """Test admin authentication with admin/admin123"""
        print("\n🔐 Testing Admin Login...")
        data = {
            "username": "admin",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data)
        
        if success and response.get('token'):
            self.admin_token = response.get('token')
            # Verify token contains admin role
            if response.get('role') == 'admin' and response.get('username') == 'admin':
                print("✅ Admin token contains correct role and username")
                return True, response
            else:
                print("❌ Admin token missing role or username")
                return False, {}
        return success, response
    
    def test_database_state_verification(self):
        """Verify database state - only admin user should exist"""
        print("\n🗄️ Testing Database State Verification...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Get admin dashboard overview to check database state
        success, response = self.run_test("Database State Check", "GET", "admin/dashboard/overview", 200, headers=headers)
        
        if success:
            members_data = response.get('members', {})
            payments_data = response.get('payments', {})
            commissions_data = response.get('commissions', {})
            leads_data = response.get('leads', {})
            
            total_members = members_data.get('total', 0)
            total_payments = payments_data.get('total', 0)
            total_commissions = commissions_data.get('total', 0)
            total_leads = leads_data.get('total', 0)
            
            print(f"📊 Database State:")
            print(f"   Total Members: {total_members}")
            print(f"   Total Payments: {total_payments}")
            print(f"   Total Commissions: {total_commissions}")
            print(f"   Total Leads: {total_leads}")
            
            # Check if only admin user exists (total_members should be 1)
            if total_members == 1:
                print("✅ Database contains only 1 user (admin)")
                admin_verified = True
            else:
                print(f"❌ Database contains {total_members} users, expected 1 (admin only)")
                admin_verified = False
            
            # Check if other collections are empty
            collections_empty = (total_payments == 0 and total_commissions == 0 and total_leads == 0)
            if collections_empty:
                print("✅ All other collections are empty")
            else:
                print(f"❌ Other collections not empty - Payments: {total_payments}, Commissions: {total_commissions}, Leads: {total_leads}")
            
            return admin_verified and collections_empty, response
        
        return False, {}
    
    def test_admin_dashboard_functionality(self):
        """Test admin dashboard functionality"""
        print("\n📊 Testing Admin Dashboard Functionality...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        success, response = self.run_test("Admin Dashboard Overview", "GET", "admin/dashboard/overview", 200, headers=headers)
        
        if success:
            # Verify response structure
            required_keys = ['members', 'payments', 'commissions', 'leads', 'milestones']
            missing_keys = [key for key in required_keys if key not in response]
            
            if not missing_keys:
                print("✅ Dashboard overview contains all required sections")
                
                # Verify clean state indicators
                members = response.get('members', {})
                payments = response.get('payments', {})
                commissions = response.get('commissions', {})
                
                clean_state_indicators = []
                clean_state_indicators.append(f"Members: {members.get('total', 0)}")
                clean_state_indicators.append(f"Payments: {payments.get('total', 0)}")
                clean_state_indicators.append(f"Commissions: {commissions.get('total', 0)}")
                clean_state_indicators.append(f"Revenue: ${payments.get('total_revenue', 0)}")
                clean_state_indicators.append(f"Payouts: ${commissions.get('total_payouts', 0)}")
                
                print("✅ Clean state dashboard shows:")
                for indicator in clean_state_indicators:
                    print(f"   - {indicator}")
                
                return True, response
            else:
                print(f"❌ Dashboard overview missing required keys: {missing_keys}")
                return False, {}
        
        return success, response
    
    def test_new_user_registration(self):
        """Test that new user registration works correctly"""
        print("\n👤 Testing New User Registration...")
        
        # Generate unique test user data
        test_user_address = f"0x{uuid.uuid4().hex[:40]}"
        test_username = f"testuser_{int(time.time())}"
        test_email = f"{test_username}@example.com"
        
        data = {
            "username": test_username,
            "email": test_email,
            "password": "password123",
            "wallet_address": test_user_address
        }
        
        success, response = self.run_test("New User Registration", "POST", "users/register", 200, data)
        
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
                
                # Verify user appears in admin dashboard
                if self.admin_token:
                    self.verify_user_in_admin_dashboard(test_user_address)
                
                return True, response
            else:
                print(f"❌ Registration response missing required fields: {missing_fields}")
                return False, {}
        
        return success, response
    
    def verify_user_in_admin_dashboard(self, user_address):
        """Verify the newly registered user appears in admin dashboard"""
        print("\n🔍 Verifying user appears in admin dashboard...")
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Check updated member count in dashboard
        success, response = self.run_test("Updated Dashboard Check", "GET", "admin/dashboard/overview", 200, headers=headers)
        
        if success:
            members_data = response.get('members', {})
            total_members = members_data.get('total', 0)
            
            if total_members == 2:  # Should now be 2 (admin + new user)
                print("✅ New user registration reflected in admin dashboard")
                
                # Also check members list
                members_success, members_response = self.run_test("Check Members List", "GET", "admin/members", 200, headers=headers)
                if members_success:
                    members_list = members_response.get('members', [])
                    user_found = any(member.get('wallet_address') == user_address for member in members_list)
                    
                    if user_found:
                        print("✅ New user found in admin members list")
                        return True
                    else:
                        print("❌ New user not found in admin members list")
                        return False
            else:
                print(f"❌ Expected 2 total members after registration, got {total_members}")
                return False
        
        return False
    
    def run_comprehensive_verification(self):
        """Run all verification tests for database cleanup and admin functionality"""
        print("🧹 DATABASE CLEANUP VERIFICATION TEST SUITE")
        print("=" * 60)
        print("Verifying clean database state and admin functionality")
        print("=" * 60)
        
        # Test 1: Admin Login
        print("\n1️⃣ ADMIN AUTHENTICATION TEST")
        admin_login_success, _ = self.test_admin_login()
        if not admin_login_success:
            print("❌ CRITICAL: Admin login failed - cannot proceed with other tests")
            return False
        
        # Test 2: Database State Verification
        print("\n2️⃣ DATABASE STATE VERIFICATION")
        db_state_success, _ = self.test_database_state_verification()
        if not db_state_success:
            print("❌ CRITICAL: Database state verification failed")
            return False
        
        # Test 3: Admin Dashboard Functionality
        print("\n3️⃣ ADMIN DASHBOARD FUNCTIONALITY TEST")
        dashboard_success, _ = self.test_admin_dashboard_functionality()
        if not dashboard_success:
            print("❌ CRITICAL: Admin dashboard functionality failed")
            return False
        
        # Test 4: New User Registration
        print("\n4️⃣ NEW USER REGISTRATION TEST")
        registration_success, _ = self.test_new_user_registration()
        if not registration_success:
            print("❌ CRITICAL: New user registration failed")
            return False
        
        # Final Summary
        print("\n" + "=" * 60)
        print("🎯 VERIFICATION RESULTS SUMMARY")
        print("=" * 60)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        all_critical_tests_passed = (admin_login_success and db_state_success and 
                                   dashboard_success and registration_success)
        
        if all_critical_tests_passed:
            print("\n✅ ALL CRITICAL VERIFICATION TESTS PASSED")
            print("✅ Database cleanup was successful")
            print("✅ Admin functionality is preserved")
            print("✅ New user registration system is functional")
            print("✅ System is ready for fresh testing")
        else:
            print("\n❌ SOME CRITICAL TESTS FAILED")
            print("❌ Database cleanup verification incomplete")
            
        return all_critical_tests_passed

def main():
    if len(sys.argv) != 2:
        print("Usage: python database_cleanup_test.py <base_url>")
        print("Example: python database_cleanup_test.py https://affiliate-hub-80.preview.emergentagent.com")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    
    print(f"🚀 Starting Database Cleanup Verification Tests")
    print(f"🌐 Base URL: {base_url}")
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tester = DatabaseCleanupVerificationTester(base_url)
    success = tester.run_comprehensive_verification()
    
    print(f"\n⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if success:
        print("🎉 Database cleanup verification completed successfully!")
        sys.exit(0)
    else:
        print("💥 Database cleanup verification failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()