import requests
import sys
import json
import time
from datetime import datetime
import uuid

class DetailedReferralTester:
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
    
    def test_referral_registration_flow(self):
        """Test the complete referral registration flow"""
        print("\n🎯 TESTING REFERRAL REGISTRATION FLOW")
        print("="*80)
        
        if not self.admin_login():
            print("❌ Failed to login as admin")
            return False
        
        # Create test users
        referrer_address = f"0x{uuid.uuid4().hex[:40]}"
        referred_address = f"0x{uuid.uuid4().hex[:40]}"
        
        referrer_username = f"test_referrer_{int(time.time())}"
        referred_username = f"test_referred_{int(time.time())}"
        
        print(f"Creating test users:")
        print(f"  Referrer: {referrer_username} ({referrer_address})")
        print(f"  Referred: {referred_username} ({referred_address})")
        
        # 1. Register referrer user
        referrer_data = {
            "username": referrer_username,
            "email": f"{referrer_username}@test.com",
            "password": "testpass123",
            "wallet_address": referrer_address
        }
        
        success, referrer_response = self.run_test("Register Referrer User", "POST", "users/register", 200, referrer_data)
        
        if not success:
            print("❌ Failed to register referrer user")
            return False
        
        referrer_code = referrer_response.get('referral_code')
        print(f"✅ Referrer registered with code: {referrer_code}")
        
        # 2. Register referred user with referrer code
        referred_data = {
            "username": referred_username,
            "email": f"{referred_username}@test.com", 
            "password": "testpass123",
            "wallet_address": referred_address,
            "referrer_code": referrer_code
        }
        
        success, referred_response = self.run_test("Register Referred User", "POST", "users/register", 200, referred_data)
        
        if not success:
            print("❌ Failed to register referred user")
            return False
        
        print(f"✅ Referred user registered")
        
        # 3. Wait a moment for database consistency
        time.sleep(2)
        
        # 4. Check if referral relationship was created
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Get referrer details
        success, referrer_details = self.run_test("Get Referrer Details", "GET", f"admin/members/{referrer_address}", 200, headers=headers)
        
        if success:
            referrer_stats = referrer_details.get('stats', {})
            referrer_referrals = referrer_details.get('referrals', [])
            
            print(f"Referrer stats: {referrer_stats.get('total_referrals', 0)} referrals")
            print(f"Referrer referral list: {[r.get('username') for r in referrer_referrals]}")
            
            if referred_username in [r.get('username') for r in referrer_referrals]:
                print("✅ REFERRAL RELATIONSHIP CREATED SUCCESSFULLY")
                return True
            else:
                print("❌ REFERRAL RELATIONSHIP NOT CREATED")
        
        # Get referred user details
        success, referred_details = self.run_test("Get Referred User Details", "GET", f"admin/members/{referred_address}", 200, headers=headers)
        
        if success:
            referred_sponsor = referred_details.get('sponsor')
            print(f"Referred user sponsor: {referred_sponsor}")
            
            if referred_sponsor and referred_sponsor.get('username') == referrer_username:
                print("✅ SPONSOR RELATIONSHIP FOUND")
            else:
                print("❌ SPONSOR RELATIONSHIP MISSING")
        
        return False
    
    def check_existing_users_referral_data(self):
        """Check the referral data for existing thirduser and fourthuser"""
        print("\n🔍 CHECKING EXISTING USERS REFERRAL DATA")
        print("="*80)
        
        if not self.admin_login():
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Get all members to find thirduser and fourthuser
        success, response = self.run_test("Get All Members", "GET", "admin/members?limit=100", 200, headers=headers)
        
        if not success:
            return False
        
        members = response.get('members', [])
        thirduser = None
        fourthuser = None
        
        for member in members:
            if member.get('username') == 'thirduser':
                thirduser = member
            elif member.get('username') == 'fourthuser':
                fourthuser = member
        
        if not thirduser:
            print("❌ thirduser not found")
            return False
        
        if not fourthuser:
            print("❌ fourthuser not found")
            return False
        
        print(f"✅ Found both users:")
        print(f"  thirduser: {thirduser['wallet_address']}")
        print(f"  fourthuser: {fourthuser['wallet_address']}")
        
        # Get detailed information
        success, thirduser_details = self.run_test("Get thirduser Details", "GET", f"admin/members/{thirduser['wallet_address']}", 200, headers=headers)
        success, fourthuser_details = self.run_test("Get fourthuser Details", "GET", f"admin/members/{fourthuser['wallet_address']}", 200, headers=headers)
        
        if thirduser_details and fourthuser_details:
            print(f"\n📊 THIRDUSER DATA:")
            thirduser_member = thirduser_details.get('member', {})
            print(f"  Username: {thirduser_member.get('username')}")
            print(f"  Email: {thirduser_member.get('email')}")
            print(f"  Wallet: {thirduser_member.get('wallet_address')}")
            print(f"  Referral Code: {thirduser_member.get('referral_code')}")
            print(f"  Created: {thirduser_member.get('created_at')}")
            
            thirduser_stats = thirduser_details.get('stats', {})
            print(f"  Total Referrals: {thirduser_stats.get('total_referrals', 0)}")
            
            thirduser_referrals = thirduser_details.get('referrals', [])
            print(f"  Referral List: {[r.get('username') for r in thirduser_referrals]}")
            
            print(f"\n📊 FOURTHUSER DATA:")
            fourthuser_member = fourthuser_details.get('member', {})
            print(f"  Username: {fourthuser_member.get('username')}")
            print(f"  Email: {fourthuser_member.get('email')}")
            print(f"  Wallet: {fourthuser_member.get('wallet_address')}")
            print(f"  Referral Code: {fourthuser_member.get('referral_code')}")
            print(f"  Created: {fourthuser_member.get('created_at')}")
            
            fourthuser_sponsor = fourthuser_details.get('sponsor')
            print(f"  Sponsor: {fourthuser_sponsor}")
            
            # Check if fourthuser was created after thirduser
            thirduser_created = datetime.fromisoformat(thirduser_member.get('created_at', '').replace('Z', '+00:00'))
            fourthuser_created = datetime.fromisoformat(fourthuser_member.get('created_at', '').replace('Z', '+00:00'))
            
            print(f"\n⏰ TIMING ANALYSIS:")
            print(f"  thirduser created: {thirduser_created}")
            print(f"  fourthuser created: {fourthuser_created}")
            
            if fourthuser_created > thirduser_created:
                print("✅ fourthuser was created after thirduser (correct order)")
            else:
                print("❌ fourthuser was created before thirduser (incorrect order)")
            
            # Check if fourthuser should have thirduser as referrer
            if not fourthuser_sponsor:
                print("❌ ISSUE CONFIRMED: fourthuser has no sponsor despite being registered after thirduser")
                print("🔍 This suggests the referral code was not properly processed during registration")
                return False
            elif fourthuser_sponsor.get('username') != 'thirduser':
                print(f"❌ ISSUE: fourthuser has wrong sponsor: {fourthuser_sponsor.get('username')} (expected: thirduser)")
                return False
            else:
                print("✅ fourthuser has correct sponsor: thirduser")
                return True
        
        return False
    
    def test_referral_code_lookup(self):
        """Test if referral code lookup is working"""
        print("\n🔍 TESTING REFERRAL CODE LOOKUP")
        print("="*80)
        
        if not self.admin_login():
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Get thirduser's referral code
        success, response = self.run_test("Get All Members", "GET", "admin/members?limit=100", 200, headers=headers)
        
        if not success:
            return False
        
        members = response.get('members', [])
        thirduser = None
        
        for member in members:
            if member.get('username') == 'thirduser':
                thirduser = member
                break
        
        if not thirduser:
            print("❌ thirduser not found")
            return False
        
        # Get thirduser's details to get referral code
        success, thirduser_details = self.run_test("Get thirduser Details", "GET", f"admin/members/{thirduser['wallet_address']}", 200, headers=headers)
        
        if not success:
            return False
        
        referral_code = thirduser_details.get('member', {}).get('referral_code')
        print(f"thirduser's referral code: {referral_code}")
        
        # Test registration with this referral code
        test_address = f"0x{uuid.uuid4().hex[:40]}"
        test_username = f"test_referral_lookup_{int(time.time())}"
        
        test_data = {
            "username": test_username,
            "email": f"{test_username}@test.com",
            "password": "testpass123",
            "wallet_address": test_address,
            "referrer_code": referral_code
        }
        
        success, response = self.run_test("Test Registration with thirduser's Code", "POST", "users/register", 200, test_data)
        
        if success:
            print("✅ Registration with referral code successful")
            
            # Wait and check if relationship was created
            time.sleep(2)
            
            # Check if thirduser now has this user as referral
            success, updated_thirduser = self.run_test("Get Updated thirduser Details", "GET", f"admin/members/{thirduser['wallet_address']}", 200, headers=headers)
            
            if success:
                updated_referrals = updated_thirduser.get('referrals', [])
                updated_stats = updated_thirduser.get('stats', {})
                
                print(f"Updated referral count: {updated_stats.get('total_referrals', 0)}")
                print(f"Updated referral list: {[r.get('username') for r in updated_referrals]}")
                
                if test_username in [r.get('username') for r in updated_referrals]:
                    print("✅ REFERRAL CODE LOOKUP IS WORKING - New referral relationship created")
                    return True
                else:
                    print("❌ REFERRAL CODE LOOKUP FAILED - No referral relationship created")
                    return False
        else:
            print("❌ Registration with referral code failed")
            return False
    
    def run_comprehensive_test(self):
        """Run comprehensive referral system test"""
        print("🎯 COMPREHENSIVE REFERRAL SYSTEM TEST")
        print("="*80)
        
        # 1. Check existing users data
        existing_data_ok = self.check_existing_users_referral_data()
        
        # 2. Test referral code lookup functionality
        referral_lookup_ok = self.test_referral_code_lookup()
        
        # 3. Test complete referral registration flow
        registration_flow_ok = self.test_referral_registration_flow()
        
        print(f"\n📊 TEST RESULTS SUMMARY")
        print("="*80)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print(f"\n🔍 COMPONENT RESULTS:")
        print(f"  Existing Data Check: {'✅ PASS' if existing_data_ok else '❌ FAIL'}")
        print(f"  Referral Code Lookup: {'✅ PASS' if referral_lookup_ok else '❌ FAIL'}")
        print(f"  Registration Flow: {'✅ PASS' if registration_flow_ok else '❌ FAIL'}")
        
        if not existing_data_ok:
            print(f"\n❌ ROOT CAUSE: The referral relationship between thirduser and fourthuser was never properly established during registration")
            print(f"   This could be due to:")
            print(f"   1. fourthuser was not registered with thirduser's referral code")
            print(f"   2. The referral code lookup failed during registration")
            print(f"   3. The referral relationship creation logic has a bug")
        
        if referral_lookup_ok and registration_flow_ok:
            print(f"\n✅ CONCLUSION: Referral system is working correctly for new registrations")
            print(f"   The issue with thirduser/fourthuser appears to be historical data problem")
        else:
            print(f"\n❌ CONCLUSION: Referral system has functional issues that need to be fixed")
        
        return existing_data_ok and referral_lookup_ok and registration_flow_ok

def main():
    if len(sys.argv) != 2:
        print("Usage: python detailed_referral_test.py <base_url>")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    print(f"🔍 Starting Detailed Referral System Test against: {base_url}")
    
    tester = DetailedReferralTester(base_url)
    result = tester.run_comprehensive_test()
    
    if result:
        print(f"\n✅ All tests passed")
        sys.exit(0)
    else:
        print(f"\n❌ Some tests failed")
        sys.exit(1)

if __name__ == "__main__":
    main()