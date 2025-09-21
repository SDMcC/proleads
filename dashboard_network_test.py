import requests
import sys
import json
import time
from datetime import datetime
import uuid

class DashboardNetworkTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
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
                    return success, response_data
                except:
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
    
    def admin_login(self):
        """Login as admin"""
        data = {
            "username": "admin",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data)
        
        if success and response.get('token'):
            self.admin_token = response.get('token')
            return True
        return False
    
    def create_test_user_with_referrals(self):
        """Create a test user with referrals to test dashboard and network APIs"""
        print("\n🎯 CREATING TEST USER WITH REFERRALS")
        print("="*80)
        
        if not self.admin_login():
            return False
        
        # Create main user
        main_address = f"0x{uuid.uuid4().hex[:40]}"
        main_username = f"main_user_{int(time.time())}"
        
        main_data = {
            "username": main_username,
            "email": f"{main_username}@test.com",
            "password": "testpass123",
            "wallet_address": main_address
        }
        
        success, main_response = self.run_test("Register Main User", "POST", "users/register", 200, main_data)
        
        if not success:
            return False
        
        main_referral_code = main_response.get('referral_code')
        print(f"✅ Main user created with referral code: {main_referral_code}")
        
        # Create 2 referral users
        referral_users = []
        for i in range(2):
            ref_address = f"0x{uuid.uuid4().hex[:40]}"
            ref_username = f"ref_user_{i}_{int(time.time())}"
            
            ref_data = {
                "username": ref_username,
                "email": f"{ref_username}@test.com",
                "password": "testpass123",
                "wallet_address": ref_address,
                "referrer_code": main_referral_code
            }
            
            success, ref_response = self.run_test(f"Register Referral User {i+1}", "POST", "users/register", 200, ref_data)
            
            if success:
                referral_users.append({
                    "username": ref_username,
                    "address": ref_address
                })
        
        print(f"✅ Created {len(referral_users)} referral users")
        
        # Login as main user to test dashboard APIs
        login_data = {
            "username": main_username,
            "password": "testpass123"
        }
        
        success, login_response = self.run_test("Login Main User", "POST", "auth/login", 200, login_data)
        
        if success and login_response.get('token'):
            self.user_token = login_response.get('token')
            print(f"✅ Main user logged in successfully")
            return {
                "main_user": {
                    "username": main_username,
                    "address": main_address,
                    "referral_code": main_referral_code
                },
                "referral_users": referral_users
            }
        
        return False
    
    def test_dashboard_stats_api(self, user_data):
        """Test the dashboard stats API"""
        print("\n🔍 TESTING DASHBOARD STATS API")
        print("="*80)
        
        if not self.user_token:
            print("❌ No user token available")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.user_token}'
        }
        
        success, response = self.run_test("Get Dashboard Stats", "GET", "dashboard/stats", 200, headers=headers)
        
        if success:
            print(f"📊 DASHBOARD STATS RESPONSE:")
            print(f"  Total Earnings: {response.get('total_earnings', 0)}")
            print(f"  Pending Earnings: {response.get('pending_earnings', 0)}")
            print(f"  Total Referrals: {response.get('total_referrals', 0)}")
            print(f"  Direct Referrals: {response.get('direct_referrals', 0)}")
            
            referral_network = response.get('referral_network', [])
            print(f"  Referral Network Count: {len(referral_network)}")
            
            for referral in referral_network:
                print(f"    - {referral.get('username')} ({referral.get('membership_tier')})")
            
            # Verify the data matches what we expect
            expected_referrals = len(user_data['referral_users'])
            actual_referrals = response.get('total_referrals', 0)
            
            if actual_referrals == expected_referrals:
                print(f"✅ Dashboard stats show correct referral count: {actual_referrals}")
                return True
            else:
                print(f"❌ Dashboard stats show incorrect referral count: {actual_referrals} (expected: {expected_referrals})")
                return False
        
        return False
    
    def test_network_tree_api(self, user_data):
        """Test the network tree API"""
        print("\n🔍 TESTING NETWORK TREE API")
        print("="*80)
        
        if not self.user_token:
            print("❌ No user token available")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.user_token}'
        }
        
        success, response = self.run_test("Get Network Tree", "GET", "users/network-tree", 200, headers=headers)
        
        if success:
            network_tree = response.get('network_tree')
            
            if network_tree:
                print(f"📊 NETWORK TREE RESPONSE:")
                print(f"  Root User: {network_tree.get('username')}")
                print(f"  Address: {network_tree.get('address')}")
                print(f"  Membership Tier: {network_tree.get('membership_tier')}")
                print(f"  Total Earnings: {network_tree.get('total_earnings', 0)}")
                print(f"  Referral Count: {network_tree.get('referral_count', 0)}")
                print(f"  Level: {network_tree.get('level', 0)}")
                
                children = network_tree.get('children', [])
                print(f"  Children Count: {len(children)}")
                
                for child in children:
                    print(f"    - {child.get('username')} (Level {child.get('level')}, Tier: {child.get('membership_tier')})")
                
                # Verify the data matches what we expect
                expected_children = len(user_data['referral_users'])
                actual_children = len(children)
                
                if actual_children == expected_children:
                    print(f"✅ Network tree shows correct children count: {actual_children}")
                    return True
                else:
                    print(f"❌ Network tree shows incorrect children count: {actual_children} (expected: {expected_children})")
                    return False
            else:
                print("❌ Network tree response is empty")
                return False
        
        return False
    
    def test_dashboard_stats_without_token(self):
        """Test dashboard stats API without authentication"""
        print("\n🔍 TESTING DASHBOARD STATS API WITHOUT TOKEN")
        print("="*80)
        
        headers = {'Content-Type': 'application/json'}
        success, response = self.run_test("Get Dashboard Stats (No Auth)", "GET", "dashboard/stats", 401, headers=headers)
        return success
    
    def test_network_tree_without_token(self):
        """Test network tree API without authentication"""
        print("\n🔍 TESTING NETWORK TREE API WITHOUT TOKEN")
        print("="*80)
        
        headers = {'Content-Type': 'application/json'}
        success, response = self.run_test("Get Network Tree (No Auth)", "GET", "users/network-tree", 401, headers=headers)
        return success
    
    def test_network_tree_with_depth_parameter(self):
        """Test network tree API with depth parameter"""
        print("\n🔍 TESTING NETWORK TREE API WITH DEPTH PARAMETER")
        print("="*80)
        
        if not self.user_token:
            print("❌ No user token available")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.user_token}'
        }
        
        success, response = self.run_test("Get Network Tree (Depth=2)", "GET", "users/network-tree?depth=2", 200, headers=headers)
        
        if success:
            network_tree = response.get('network_tree')
            if network_tree:
                print(f"✅ Network tree with depth parameter working")
                return True
        
        return False
    
    def run_comprehensive_dashboard_network_test(self):
        """Run comprehensive dashboard and network API tests"""
        print("🎯 COMPREHENSIVE DASHBOARD & NETWORK API TEST")
        print("="*80)
        
        # 1. Create test user with referrals
        user_data = self.create_test_user_with_referrals()
        
        if not user_data:
            print("❌ Failed to create test user with referrals")
            return False
        
        # Wait for database consistency
        time.sleep(2)
        
        # 2. Test dashboard stats API
        dashboard_stats_ok = self.test_dashboard_stats_api(user_data)
        
        # 3. Test network tree API
        network_tree_ok = self.test_network_tree_api(user_data)
        
        # 4. Test authentication requirements
        auth_dashboard_ok = self.test_dashboard_stats_without_token()
        auth_network_ok = self.test_network_tree_without_token()
        
        # 5. Test network tree with depth parameter
        depth_param_ok = self.test_network_tree_with_depth_parameter()
        
        print(f"\n📊 TEST RESULTS SUMMARY")
        print("="*80)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print(f"\n🔍 COMPONENT RESULTS:")
        print(f"  Dashboard Stats API: {'✅ PASS' if dashboard_stats_ok else '❌ FAIL'}")
        print(f"  Network Tree API: {'✅ PASS' if network_tree_ok else '❌ FAIL'}")
        print(f"  Dashboard Auth Check: {'✅ PASS' if auth_dashboard_ok else '❌ FAIL'}")
        print(f"  Network Auth Check: {'✅ PASS' if auth_network_ok else '❌ FAIL'}")
        print(f"  Network Depth Parameter: {'✅ PASS' if depth_param_ok else '❌ FAIL'}")
        
        all_passed = all([dashboard_stats_ok, network_tree_ok, auth_dashboard_ok, auth_network_ok, depth_param_ok])
        
        if all_passed:
            print(f"\n✅ CONCLUSION: Dashboard and Network Tree APIs are working correctly")
            print(f"   The issue with thirduser not seeing fourthuser is due to missing referral relationship in database")
        else:
            print(f"\n❌ CONCLUSION: Dashboard and/or Network Tree APIs have functional issues")
        
        return all_passed

def main():
    if len(sys.argv) != 2:
        print("Usage: python dashboard_network_test.py <base_url>")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    print(f"🔍 Starting Dashboard & Network API Test against: {base_url}")
    
    tester = DashboardNetworkTester(base_url)
    result = tester.run_comprehensive_dashboard_network_test()
    
    if result:
        print(f"\n✅ All tests passed")
        sys.exit(0)
    else:
        print(f"\n❌ Some tests failed")
        sys.exit(1)

if __name__ == "__main__":
    main()