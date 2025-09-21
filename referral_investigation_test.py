import requests
import sys
import json
import time
from datetime import datetime
import uuid

class ReferralSystemInvestigator:
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
        """Login as admin"""
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
        success, response = self.run_test(f"Search for user: {username}", "GET", "admin/members?limit=100", 200, headers=headers)
        
        if success:
            members = response.get('members', [])
            for member in members:
                if member.get('username') == username:
                    return member
            
            # If not found in first page, try more pages
            total_pages = response.get('total_pages', 1)
            for page in range(2, min(total_pages + 1, 6)):  # Check up to 5 pages
                success, response = self.run_test(f"Search for user: {username} (page {page})", "GET", f"admin/members?limit=100&page={page}", 200, headers=headers)
                if success:
                    members = response.get('members', [])
                    for member in members:
                        if member.get('username') == username:
                            return member
        
        return None
    
    def get_user_details(self, user_address):
        """Get detailed user information"""
        if not self.admin_token:
            if not self.admin_login():
                return None
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        success, response = self.run_test(f"Get user details: {user_address}", "GET", f"admin/members/{user_address}", 200, headers=headers)
        
        if success:
            return response
        return None
    
    def check_referral_relationship(self, referrer_username, referred_username):
        """Check if referral relationship exists between two users"""
        print(f"\n🔍 INVESTIGATING REFERRAL RELATIONSHIP: {referrer_username} → {referred_username}")
        
        # 1. Find both users
        referrer = self.search_user_by_username(referrer_username)
        referred = self.search_user_by_username(referred_username)
        
        if not referrer:
            self.log_finding(f"❌ REFERRER NOT FOUND: User '{referrer_username}' does not exist in database")
            return False
        
        if not referred:
            self.log_finding(f"❌ REFERRED USER NOT FOUND: User '{referred_username}' does not exist in database")
            return False
        
        print(f"✅ Both users found in database")
        print(f"   Referrer: {referrer['username']} ({referrer['wallet_address']})")
        print(f"   Referred: {referred['username']} ({referred['wallet_address']})")
        
        # 2. Get detailed information for both users
        referrer_details = self.get_user_details(referrer['wallet_address'])
        referred_details = self.get_user_details(referred['wallet_address'])
        
        if not referrer_details or not referred_details:
            self.log_finding("❌ Failed to get detailed user information")
            return False
        
        # 3. Check referral code
        referrer_code = referrer_details['member'].get('referral_code')
        print(f"   Referrer's referral code: {referrer_code}")
        
        # 4. Check if referred user has referrer_address pointing to referrer
        referred_referrals = referred_details.get('referrals', [])
        referred_sponsor = referred_details.get('sponsor')
        
        print(f"   Referred user's sponsor: {referred_sponsor}")
        
        # 5. Check referrer's referral count and list
        referrer_stats = referrer_details.get('stats', {})
        referrer_referrals = referrer_details.get('referrals', [])
        
        print(f"   Referrer's total referrals: {referrer_stats.get('total_referrals', 0)}")
        print(f"   Referrer's referral list: {[r.get('username') for r in referrer_referrals]}")
        
        # 6. Analyze the relationship
        relationship_exists = False
        
        if referred_sponsor and referred_sponsor.get('username') == referrer_username:
            self.log_finding(f"✅ SPONSOR RELATIONSHIP FOUND: {referred_username} has {referrer_username} as sponsor")
            relationship_exists = True
        else:
            self.log_finding(f"❌ SPONSOR RELATIONSHIP MISSING: {referred_username} does not have {referrer_username} as sponsor")
        
        if referred_username in [r.get('username') for r in referrer_referrals]:
            self.log_finding(f"✅ REFERRAL LIST CONTAINS: {referrer_username}'s referral list includes {referred_username}")
        else:
            self.log_finding(f"❌ REFERRAL LIST MISSING: {referrer_username}'s referral list does not include {referred_username}")
        
        return relationship_exists
    
    def test_dashboard_stats_for_user(self, username):
        """Test dashboard stats for a specific user"""
        print(f"\n🔍 TESTING DASHBOARD STATS FOR: {username}")
        
        user = self.search_user_by_username(username)
        if not user:
            self.log_finding(f"❌ Cannot test dashboard stats - user {username} not found")
            return False
        
        # For this test, we would need the user's token
        # Since we don't have it, we'll check the admin view of their stats
        user_details = self.get_user_details(user['wallet_address'])
        if user_details:
            stats = user_details.get('stats', {})
            referrals = user_details.get('referrals', [])
            
            print(f"   Total referrals: {stats.get('total_referrals', 0)}")
            print(f"   Referral usernames: {[r.get('username') for r in referrals]}")
            
            self.log_finding(f"DASHBOARD STATS for {username}: {stats.get('total_referrals', 0)} referrals")
            return True
        
        return False
    
    def test_network_tree_for_user(self, username):
        """Test network tree for a specific user"""
        print(f"\n🔍 TESTING NETWORK TREE FOR: {username}")
        
        user = self.search_user_by_username(username)
        if not user:
            self.log_finding(f"❌ Cannot test network tree - user {username} not found")
            return False
        
        # Test the network tree endpoint (this would require user authentication)
        # For now, we'll analyze the referral structure from admin data
        user_details = self.get_user_details(user['wallet_address'])
        if user_details:
            referrals = user_details.get('referrals', [])
            
            print(f"   Direct referrals in network: {len(referrals)}")
            for referral in referrals:
                print(f"     - {referral.get('username')} ({referral.get('membership_tier')})")
            
            self.log_finding(f"NETWORK TREE for {username}: {len(referrals)} direct referrals")
            return True
        
        return False
    
    def check_database_consistency(self):
        """Check for database consistency issues"""
        print(f"\n🔍 CHECKING DATABASE CONSISTENCY")
        
        if not self.admin_token:
            if not self.admin_login():
                return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Get all members
        success, response = self.run_test("Get all members for consistency check", "GET", "admin/members?limit=100", 200, headers=headers)
        
        if not success:
            return False
        
        members = response.get('members', [])
        total_members = response.get('total_count', 0)
        
        print(f"   Total members in database: {total_members}")
        
        # Check for orphaned records
        orphaned_payments = 0
        members_with_referrals = 0
        
        for member in members:
            # Check if member has referrals
            if member.get('total_referrals', 0) > 0:
                members_with_referrals += 1
        
        print(f"   Members with referrals: {members_with_referrals}")
        
        # Get payments to check for orphaned records
        success, payments_response = self.run_test("Get all payments for consistency check", "GET", "admin/payments?limit=100", 200, headers=headers)
        
        if success:
            payments = payments_response.get('payments', [])
            member_addresses = {m['wallet_address'] for m in members}
            
            for payment in payments:
                if payment.get('user_address') not in member_addresses:
                    orphaned_payments += 1
                    self.log_finding(f"❌ ORPHANED PAYMENT: Payment {payment.get('id')} for user {payment.get('user_address')} has no corresponding member record")
        
        if orphaned_payments == 0:
            self.log_finding("✅ NO ORPHANED PAYMENTS FOUND")
        else:
            self.log_finding(f"❌ FOUND {orphaned_payments} ORPHANED PAYMENTS")
        
        return True
    
    def investigate_specific_case(self, referrer_username, referred_username):
        """Investigate the specific referral case mentioned in the review"""
        print(f"\n🎯 INVESTIGATING SPECIFIC CASE: {referrer_username} → {referred_username}")
        print("="*80)
        
        # 1. Check if both users exist
        referrer_exists = self.search_user_by_username(referrer_username) is not None
        referred_exists = self.search_user_by_username(referred_username) is not None
        
        print(f"   {referrer_username} exists: {referrer_exists}")
        print(f"   {referred_username} exists: {referred_exists}")
        
        if not referrer_exists:
            self.log_finding(f"❌ CRITICAL: Referrer '{referrer_username}' not found in database")
            return False
        
        if not referred_exists:
            self.log_finding(f"❌ CRITICAL: Referred user '{referred_username}' not found in database")
            return False
        
        # 2. Check referral relationship
        relationship_exists = self.check_referral_relationship(referrer_username, referred_username)
        
        # 3. Test dashboard stats
        self.test_dashboard_stats_for_user(referrer_username)
        
        # 4. Test network tree
        self.test_network_tree_for_user(referrer_username)
        
        # 5. Check database consistency
        self.check_database_consistency()
        
        return relationship_exists
    
    def run_full_investigation(self):
        """Run the complete referral system investigation"""
        print("🔍 STARTING REFERRAL SYSTEM INVESTIGATION")
        print("="*80)
        
        # Test the specific case mentioned in the review
        case_result = self.investigate_specific_case("thirduser", "fourthuser")
        
        # Generate summary report
        print(f"\n📊 INVESTIGATION SUMMARY")
        print("="*80)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print(f"\n🔍 KEY FINDINGS:")
        for i, finding in enumerate(self.findings, 1):
            print(f"{i}. {finding}")
        
        if case_result:
            print(f"\n✅ CONCLUSION: Referral relationship exists and is working correctly")
        else:
            print(f"\n❌ CONCLUSION: Referral relationship issue confirmed - needs investigation")
        
        return case_result

def main():
    if len(sys.argv) != 2:
        print("Usage: python referral_investigation_test.py <base_url>")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    print(f"🔍 Starting Referral System Investigation against: {base_url}")
    
    investigator = ReferralSystemInvestigator(base_url)
    result = investigator.run_full_investigation()
    
    if result:
        print(f"\n✅ Investigation completed successfully")
        sys.exit(0)
    else:
        print(f"\n❌ Investigation found issues")
        sys.exit(1)

if __name__ == "__main__":
    main()