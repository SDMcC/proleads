import requests
import sys
import json
import time
from datetime import datetime
import uuid

class SpecificReferralInvestigator:
    def __init__(self, base_url):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.findings = []
        
    def log_finding(self, finding):
        """Log investigation findings"""
        self.findings.append(finding)
        print(f"🔍 FINDING: {finding}")
    
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
    
    def admin_login(self):
        """Login as admin to access admin endpoints"""
        data = {
            "username": "admin",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data)
        
        if success and response.get('token'):
            self.admin_token = response.get('token')
            print("✅ Admin login successful")
            return True
        return False
    
    def search_user_by_username(self, username):
        """Search for a user by username in the admin members list"""
        if not self.admin_token:
            if not self.admin_login():
                return None
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Get all members and search for the username
        success, response = self.run_test(f"Search for user '{username}'", "GET", "admin/members?limit=1000", 200, headers=headers)
        
        if success:
            members = response.get('members', [])
            for member in members:
                if member.get('username') == username:
                    print(f"✅ Found user '{username}': {member.get('wallet_address')}")
                    return member
            
            print(f"❌ User '{username}' not found in database")
            self.log_finding(f"User '{username}' not found in database")
            return None
        
        return None
    
    def get_member_details(self, member_id):
        """Get detailed member information"""
        if not self.admin_token:
            if not self.admin_login():
                return None
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        success, response = self.run_test(f"Get member details for {member_id}", "GET", f"admin/members/{member_id}", 200, headers=headers)
        
        if success:
            return response
        return None
    
    def test_referral_code_lookup(self, referral_code):
        """Test the referral code lookup endpoint"""
        success, response = self.run_test(f"Referral code lookup: {referral_code}", "GET", f"referral/{referral_code}", 200)
        
        if success:
            print(f"✅ Referral code lookup successful for {referral_code}")
            return response
        else:
            print(f"❌ Referral code lookup failed for {referral_code}")
            self.log_finding(f"Referral code lookup failed for {referral_code}")
            return None
    
    def test_registration_with_referral_code(self, referral_code):
        """Test registration process with a referral code"""
        test_address = f"0x{uuid.uuid4().hex[:40]}"
        test_username = f"test_referral_{int(time.time())}"
        test_email = f"{test_username}@test.com"
        test_password = "testpassword123"
        
        data = {
            "username": test_username,
            "email": test_email,
            "password": test_password,
            "wallet_address": test_address,
            "referrer_code": referral_code
        }
        
        success, response = self.run_test(f"Registration with referral code {referral_code}", "POST", "users/register", 200, data)
        
        if success:
            print(f"✅ Registration successful with referral code {referral_code}")
            # Check if the new user was created with proper referrer relationship
            new_user = self.search_user_by_username(test_username)
            if new_user:
                sponsor = new_user.get('sponsor')
                if sponsor:
                    print(f"✅ New user has sponsor: {sponsor.get('username')}")
                    return {"success": True, "new_user": new_user, "sponsor": sponsor}
                else:
                    print(f"❌ New user has no sponsor despite using referral code")
                    self.log_finding(f"Registration with referral code {referral_code} did not establish sponsor relationship")
                    return {"success": False, "new_user": new_user, "sponsor": None}
            return {"success": True, "response": response}
        else:
            print(f"❌ Registration failed with referral code {referral_code}")
            self.log_finding(f"Registration failed with referral code {referral_code}")
            return {"success": False}
    
    def investigate_specific_case(self):
        """Investigate the specific case: fifthuser registered under firstuser's affiliate link"""
        print("\n" + "="*80)
        print("🔍 REFERRAL TRACKING INVESTIGATION")
        print("Case: fifthuser registered under firstuser's affiliate link")
        print("Issue: fifthuser appears in admin dashboard but not in firstuser's referral dashboard")
        print("="*80)
        
        # 1. Database Investigation
        print("\n📊 1. DATABASE INVESTIGATION")
        print("-" * 40)
        
        # Find firstuser
        firstuser = self.search_user_by_username("firstuser")
        if not firstuser:
            self.log_finding("❌ CRITICAL: firstuser not found in database")
            return False
        
        # Find fifthuser
        fifthuser = self.search_user_by_username("fifthuser")
        if not fifthuser:
            self.log_finding("❌ CRITICAL: fifthuser not found in database")
            return False
        
        # Check firstuser's referral code
        firstuser_code = firstuser.get('referral_code')
        expected_code = "REFFIRSTUSER5DCBEE"
        
        print(f"\n📋 firstuser details:")
        print(f"   - Username: {firstuser.get('username')}")
        print(f"   - Wallet: {firstuser.get('wallet_address')}")
        print(f"   - Referral Code: {firstuser_code}")
        print(f"   - Expected Code: {expected_code}")
        print(f"   - Total Referrals: {firstuser.get('total_referrals', 0)}")
        
        if firstuser_code == expected_code:
            self.log_finding(f"✅ firstuser has expected referral code: {expected_code}")
        else:
            self.log_finding(f"❌ firstuser referral code mismatch: expected {expected_code}, got {firstuser_code}")
        
        # Check fifthuser's sponsor relationship
        fifthuser_sponsor = fifthuser.get('sponsor')
        
        print(f"\n📋 fifthuser details:")
        print(f"   - Username: {fifthuser.get('username')}")
        print(f"   - Wallet: {fifthuser.get('wallet_address')}")
        print(f"   - Sponsor: {fifthuser_sponsor}")
        
        if fifthuser_sponsor:
            sponsor_username = fifthuser_sponsor.get('username')
            if sponsor_username == 'firstuser':
                self.log_finding("✅ fifthuser has firstuser as sponsor - relationship correctly established")
            else:
                self.log_finding(f"❌ fifthuser has wrong sponsor: expected firstuser, got {sponsor_username}")
        else:
            self.log_finding("❌ CRITICAL: fifthuser has no sponsor despite expected referral relationship")
        
        # Get detailed firstuser information to check referrals array
        firstuser_details = self.get_member_details(firstuser.get('id'))
        if firstuser_details:
            referrals_list = firstuser_details.get('referrals', [])
            print(f"\n📋 firstuser's referrals list: {len(referrals_list)} referrals")
            
            # Check if fifthuser is in the referrals list
            fifthuser_in_list = any(ref.get('username') == 'fifthuser' for ref in referrals_list)
            if fifthuser_in_list:
                self.log_finding("✅ fifthuser found in firstuser's referrals array")
            else:
                self.log_finding("❌ CRITICAL: fifthuser NOT found in firstuser's referrals array")
                
            # Print all referrals for debugging
            print("   Referrals:")
            for ref in referrals_list:
                print(f"     - {ref.get('username')} ({ref.get('email')})")
        
        # 2. Referral Code Lookup Test
        print("\n📊 2. REFERRAL CODE LOOKUP TEST")
        print("-" * 40)
        
        if firstuser_code:
            referral_lookup = self.test_referral_code_lookup(firstuser_code)
            if referral_lookup:
                lookup_username = referral_lookup.get('username')
                if lookup_username == 'firstuser':
                    self.log_finding("✅ Referral code lookup working correctly")
                else:
                    self.log_finding(f"❌ Referral code lookup returned wrong user: expected firstuser, got {lookup_username}")
            else:
                self.log_finding("❌ CRITICAL: Referral code lookup failed")
        
        # Test the expected referral code specifically
        if expected_code != firstuser_code:
            print(f"\n🧪 Testing expected referral code: {expected_code}")
            expected_lookup = self.test_referral_code_lookup(expected_code)
            if expected_lookup:
                self.log_finding(f"✅ Expected referral code {expected_code} exists and works")
            else:
                self.log_finding(f"❌ Expected referral code {expected_code} does not exist")
        
        # 3. Registration Flow Debug
        print("\n📊 3. REGISTRATION FLOW DEBUG")
        print("-" * 40)
        
        if firstuser_code:
            print(f"🧪 Testing new registration with firstuser's referral code: {firstuser_code}")
            registration_test = self.test_registration_with_referral_code(firstuser_code)
            if registration_test.get('success') and registration_test.get('sponsor'):
                sponsor_username = registration_test.get('sponsor', {}).get('username')
                if sponsor_username == 'firstuser':
                    self.log_finding("✅ New registration with referral code works correctly")
                else:
                    self.log_finding(f"❌ New registration established wrong sponsor: expected firstuser, got {sponsor_username}")
            else:
                self.log_finding("❌ CRITICAL: New registration with referral code failed to establish relationship")
        
        return True
    
    def generate_investigation_report(self):
        """Generate a comprehensive investigation report"""
        print("\n" + "="*80)
        print("📋 INVESTIGATION REPORT")
        print("="*80)
        
        print(f"\n📊 Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "   Success Rate: 0%")
        
        print(f"\n🔍 Key Findings:")
        for i, finding in enumerate(self.findings, 1):
            print(f"   {i}. {finding}")
        
        print(f"\n💡 Diagnosis & Recommendations:")
        
        # Analyze findings and provide specific recommendations
        critical_issues = [f for f in self.findings if "CRITICAL" in f]
        if critical_issues:
            print("   🚨 CRITICAL ISSUES FOUND:")
            for issue in critical_issues:
                print(f"     - {issue}")
        
        if any("not found in database" in finding for finding in self.findings):
            print("   📝 RECOMMENDATION: Verify user existence")
            print("     - Check if users were deleted during database cleanup")
            print("     - Confirm user registration was completed successfully")
        
        if any("has no sponsor" in finding for finding in self.findings):
            print("   📝 RECOMMENDATION: Fix referral relationship")
            print("     - The referral relationship was not established during registration")
            print("     - Check registration logic for referrer_code processing")
            print("     - Consider manual database update to fix historical data")
        
        if any("NOT found in firstuser's referrals array" in finding for finding in self.findings):
            print("   📝 RECOMMENDATION: Fix referrals array")
            print("     - The referrer's referrals array is not being updated")
            print("     - Check user registration logic for referrals array updates")
            print("     - Consider manual database update to add missing referral")
        
        if any("Referral code lookup failed" in finding for finding in self.findings):
            print("   📝 RECOMMENDATION: Fix referral code lookup")
            print("     - The /api/referral/{code} endpoint is not working")
            print("     - Check if referral codes are stored correctly")
            print("     - Verify endpoint implementation")
        
        if any("Registration with referral code failed" in finding for finding in self.findings):
            print("   📝 RECOMMENDATION: Fix registration flow")
            print("     - The registration process with referral codes is broken")
            print("     - Check for validation errors or database constraints")
            print("     - Test with different referral codes")
        
        # Provide specific SQL/MongoDB commands if needed
        if any("has no sponsor" in finding for finding in self.findings) and any("NOT found in firstuser's referrals array" in finding for finding in self.findings):
            print("\n   🔧 MANUAL FIX COMMANDS (if needed):")
            print("     # Update fifthuser to have firstuser as sponsor:")
            print("     db.users.updateOne(")
            print("       {username: 'fifthuser'},")
            print("       {$set: {referrer_address: '<firstuser_wallet_address>'}}")
            print("     )")
            print("     # Add fifthuser to firstuser's referrals count:")
            print("     # This should be handled automatically by the application logic")
        
        print("\n" + "="*80)

def main():
    if len(sys.argv) != 2:
        print("Usage: python specific_referral_test.py <base_url>")
        print("Example: python specific_referral_test.py https://network-tree-vis.preview.emergentagent.com")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    
    print("🔍 Starting Specific Referral Tracking Investigation...")
    print(f"Base URL: {base_url}")
    print("Case: fifthuser registered under firstuser's affiliate link")
    
    investigator = SpecificReferralInvestigator(base_url)
    
    # Run the investigation
    success = investigator.investigate_specific_case()
    
    # Generate report
    investigator.generate_investigation_report()
    
    if success:
        print(f"\n🏁 Investigation completed successfully!")
    else:
        print(f"\n❌ Investigation encountered critical issues!")

if __name__ == "__main__":
    main()