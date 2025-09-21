#!/usr/bin/env python3
"""
Comprehensive Referral Registration Investigation
Based on the review request to investigate referral registration process failure
"""

import requests
import json
import time
import uuid
from datetime import datetime

class ComprehensiveReferralTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.investigation_results = {}
        
    def log_result(self, test_name, success, details):
        """Log investigation results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        self.investigation_results[test_name] = {
            "success": success,
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n{status} {test_name}")
        if isinstance(details, dict):
            for key, value in details.items():
                print(f"   {key}: {value}")
        else:
            print(f"   {details}")
    
    def admin_login(self):
        """Login as admin to access admin endpoints"""
        url = f"{self.base_url}/api/admin/login"
        data = {"username": "admin", "password": "admin123"}
        
        try:
            response = requests.post(url, json=data)
            if response.status_code == 200:
                result = response.json()
                self.admin_token = result.get('token')
                self.log_result("Admin Login", True, {"token_received": bool(self.admin_token)})
                return True
            else:
                self.log_result("Admin Login", False, {"status_code": response.status_code, "error": response.text})
                return False
        except Exception as e:
            self.log_result("Admin Login", False, {"error": str(e)})
            return False
    
    def get_admin_headers(self):
        """Get headers with admin authorization"""
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
    
    def get_all_users(self):
        """Get all users from the database"""
        if not self.admin_token:
            if not self.admin_login():
                return []
        
        url = f"{self.base_url}/api/admin/members?limit=200"
        headers = self.get_admin_headers()
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                members_data = response.json()
                return members_data.get('members', [])
            else:
                print(f"❌ Failed to get users: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ Error getting users: {e}")
            return []
    
    def find_user_by_username(self, username):
        """Find a specific user by username"""
        users = self.get_all_users()
        for user in users:
            if user.get('username') == username:
                return user
        return None
    
    def get_user_details(self, user_id):
        """Get detailed user information"""
        if not self.admin_token:
            if not self.admin_login():
                return None
        
        url = f"{self.base_url}/api/admin/members/{user_id}"
        headers = self.get_admin_headers()
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Failed to get user details: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error getting user details: {e}")
            return None
    
    def test_referral_code_lookup(self, referral_code):
        """Test the /api/referral/{code} endpoint"""
        url = f"{self.base_url}/api/referral/{referral_code}"
        
        try:
            response = requests.get(url)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.log_result(f"Referral Code Lookup: {referral_code}", True, {
                    "referral_code": referral_code,
                    "lookup_successful": True,
                    "returned_data": data
                })
                return data
            else:
                self.log_result(f"Referral Code Lookup: {referral_code}", False, {
                    "referral_code": referral_code,
                    "status_code": response.status_code,
                    "error": response.text
                })
                return None
        except Exception as e:
            self.log_result(f"Referral Code Lookup: {referral_code}", False, {
                "referral_code": referral_code,
                "error": str(e)
            })
            return None
    
    def test_registration_with_referral(self, referrer_code):
        """Test user registration with a referral code"""
        # Create test user data
        test_user = {
            "username": f"testuser_{int(time.time())}",
            "email": f"testuser_{int(time.time())}@test.com",
            "password": "password123",
            "wallet_address": f"0x{uuid.uuid4().hex[:40]}",
            "referrer_code": referrer_code
        }
        
        url = f"{self.base_url}/api/users/register"
        
        try:
            response = requests.post(url, json=test_user)
            
            if response.status_code == 200:
                result = response.json()
                
                # Wait for database to update
                time.sleep(2)
                
                # Check if user was created with proper referral relationship
                new_user = self.find_user_by_username(test_user['username'])
                if new_user:
                    user_details = self.get_user_details(new_user['id'])
                    
                    registration_result = {
                        "registration_successful": True,
                        "user_created": True,
                        "referral_code_used": referrer_code,
                        "new_user_has_sponsor": user_details.get('sponsor') is not None if user_details else False,
                        "sponsor_info": user_details.get('sponsor') if user_details else None,
                        "registration_response": result
                    }
                    
                    self.log_result(f"Registration Test with Referral: {referrer_code}", True, registration_result)
                    return registration_result
                else:
                    self.log_result(f"Registration Test with Referral: {referrer_code}", False, {
                        "error": "User not found after registration",
                        "registration_response": result
                    })
                    return None
            else:
                self.log_result(f"Registration Test with Referral: {referrer_code}", False, {
                    "status_code": response.status_code,
                    "error": response.text,
                    "test_data": test_user
                })
                return None
        except Exception as e:
            self.log_result(f"Registration Test with Referral: {referrer_code}", False, {
                "error": str(e),
                "test_data": test_user
            })
            return None
    
    def investigate_database_records(self):
        """Investigate all users in database for referral relationships"""
        print("\n🔍 INVESTIGATING DATABASE RECORDS")
        print("=" * 50)
        
        users = self.get_all_users()
        
        if not users:
            self.log_result("Database Investigation", False, {"error": "No users found in database"})
            return
        
        print(f"Found {len(users)} users in database")
        
        # Analyze referral relationships
        users_with_sponsors = 0
        users_with_referrals = 0
        referral_relationships = []
        
        for user in users:
            user_details = self.get_user_details(user['id'])
            if user_details:
                sponsor = user_details.get('sponsor')
                referrals_count = user_details.get('stats', {}).get('total_referrals', 0)
                
                if sponsor:
                    users_with_sponsors += 1
                    referral_relationships.append({
                        "referee": user['username'],
                        "referrer": sponsor.get('username'),
                        "referrer_address": sponsor.get('address')
                    })
                
                if referrals_count > 0:
                    users_with_referrals += 1
                
                print(f"   {user['username']}: sponsor={sponsor.get('username') if sponsor else 'None'}, referrals={referrals_count}")
        
        investigation_summary = {
            "total_users": len(users),
            "users_with_sponsors": users_with_sponsors,
            "users_with_referrals": users_with_referrals,
            "referral_relationships": referral_relationships
        }
        
        self.log_result("Database Investigation", True, investigation_summary)
        return investigation_summary
    
    def investigate_specific_users(self, user1, user2):
        """Investigate specific users mentioned in the review request"""
        print(f"\n🔍 INVESTIGATING SPECIFIC USERS: {user1} and {user2}")
        print("=" * 50)
        
        # Find both users
        user1_data = self.find_user_by_username(user1)
        user2_data = self.find_user_by_username(user2)
        
        if not user1_data:
            self.log_result(f"User Investigation: {user1}", False, {"error": f"User '{user1}' not found in database"})
            return False
        
        if not user2_data:
            self.log_result(f"User Investigation: {user2}", False, {"error": f"User '{user2}' not found in database"})
            return False
        
        # Get detailed information for both users
        user1_details = self.get_user_details(user1_data['id'])
        user2_details = self.get_user_details(user2_data['id'])
        
        if not user1_details or not user2_details:
            self.log_result("User Details Investigation", False, {"error": "Failed to get user details"})
            return False
        
        # Analyze the relationship
        user1_sponsor = user1_details.get('sponsor')
        user1_referrals = user1_details.get('stats', {}).get('total_referrals', 0)
        user1_referral_code = user1_details.get('member', {}).get('referral_code')
        
        user2_sponsor = user2_details.get('sponsor')
        user2_referrals = user2_details.get('stats', {}).get('total_referrals', 0)
        user2_referral_code = user2_details.get('member', {}).get('referral_code')
        
        relationship_analysis = {
            f"{user1}_info": {
                "username": user1,
                "wallet_address": user1_data['wallet_address'],
                "referral_code": user1_referral_code,
                "sponsor": user1_sponsor.get('username') if user1_sponsor else None,
                "total_referrals": user1_referrals,
                "created_at": user1_data.get('created_at')
            },
            f"{user2}_info": {
                "username": user2,
                "wallet_address": user2_data['wallet_address'],
                "referral_code": user2_referral_code,
                "sponsor": user2_sponsor.get('username') if user2_sponsor else None,
                "total_referrals": user2_referrals,
                "created_at": user2_data.get('created_at')
            },
            "relationship_exists": (
                (user1_sponsor and user1_sponsor.get('username') == user2) or
                (user2_sponsor and user2_sponsor.get('username') == user1)
            )
        }
        
        self.log_result("Specific Users Investigation", True, relationship_analysis)
        
        # Test referral code lookup for both users
        if user1_referral_code:
            self.test_referral_code_lookup(user1_referral_code)
        if user2_referral_code:
            self.test_referral_code_lookup(user2_referral_code)
        
        return relationship_analysis
    
    def test_registration_flow_debug(self):
        """Test the complete registration flow with debugging"""
        print("\n🔍 TESTING REGISTRATION FLOW WITH DEBUG")
        print("=" * 50)
        
        # Step 1: Create a referrer user
        referrer_data = {
            "username": f"referrer_{int(time.time())}",
            "email": f"referrer_{int(time.time())}@test.com",
            "password": "password123",
            "wallet_address": f"0x{uuid.uuid4().hex[:40]}"
        }
        
        url = f"{self.base_url}/api/users/register"
        
        try:
            # Register referrer
            response = requests.post(url, json=referrer_data)
            if response.status_code != 200:
                self.log_result("Registration Flow Debug", False, {
                    "error": "Failed to create referrer user",
                    "status_code": response.status_code,
                    "response": response.text
                })
                return False
            
            referrer_result = response.json()
            referrer_code = referrer_result.get('referral_code')
            
            if not referrer_code:
                self.log_result("Registration Flow Debug", False, {
                    "error": "Referrer user created but no referral code returned"
                })
                return False
            
            print(f"✅ Referrer created: {referrer_data['username']} with code: {referrer_code}")
            
            # Wait for database to update
            time.sleep(2)
            
            # Step 2: Test referral code lookup
            lookup_result = self.test_referral_code_lookup(referrer_code)
            if not lookup_result:
                self.log_result("Registration Flow Debug", False, {
                    "error": "Referral code lookup failed for newly created user"
                })
                return False
            
            # Step 3: Register a referee using the referral code
            referee_result = self.test_registration_with_referral(referrer_code)
            if not referee_result:
                self.log_result("Registration Flow Debug", False, {
                    "error": "Failed to register user with referral code"
                })
                return False
            
            # Step 4: Verify the relationship was established
            if referee_result.get('new_user_has_sponsor'):
                sponsor_username = referee_result.get('sponsor_info', {}).get('username')
                if sponsor_username == referrer_data['username']:
                    self.log_result("Registration Flow Debug", True, {
                        "referrer_created": True,
                        "referral_code_working": True,
                        "referee_registered": True,
                        "relationship_established": True,
                        "referrer_username": referrer_data['username'],
                        "referral_code": referrer_code
                    })
                    return True
                else:
                    self.log_result("Registration Flow Debug", False, {
                        "error": f"Relationship established but wrong referrer: expected {referrer_data['username']}, got {sponsor_username}"
                    })
                    return False
            else:
                self.log_result("Registration Flow Debug", False, {
                    "error": "Referee registered but no sponsor relationship established"
                })
                return False
                
        except Exception as e:
            self.log_result("Registration Flow Debug", False, {"error": str(e)})
            return False
    
    def run_comprehensive_investigation(self):
        """Run the complete comprehensive investigation"""
        print("🔍 COMPREHENSIVE REFERRAL REGISTRATION INVESTIGATION")
        print("=" * 70)
        
        # Step 1: Admin login
        if not self.admin_login():
            print("❌ Cannot proceed without admin access")
            return False
        
        # Step 2: Investigate database records
        db_investigation = self.investigate_database_records()
        
        # Step 3: Look for users that might match the review request
        # Since the exact users mentioned might not exist, let's find any users with referral relationships
        users = self.get_all_users()
        referral_pairs = []
        
        for user in users:
            user_details = self.get_user_details(user['id'])
            if user_details and user_details.get('sponsor'):
                sponsor_username = user_details.get('sponsor', {}).get('username')
                referral_pairs.append((sponsor_username, user['username']))
        
        if referral_pairs:
            print(f"\n🔍 Found {len(referral_pairs)} referral relationships:")
            for referrer, referee in referral_pairs:
                print(f"   {referrer} → {referee}")
                # Investigate the first pair in detail
                if referral_pairs.index((referrer, referee)) == 0:
                    self.investigate_specific_users(referrer, referee)
        else:
            print("\n⚠️ No existing referral relationships found in database")
        
        # Step 4: Test registration flow with debugging
        self.test_registration_flow_debug()
        
        # Step 5: Generate final report
        self.generate_final_report()
        
        return True
    
    def generate_final_report(self):
        """Generate comprehensive final report"""
        print("\n" + "=" * 70)
        print("📊 COMPREHENSIVE INVESTIGATION REPORT")
        print("=" * 70)
        
        print(f"\nTEST SUMMARY:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print(f"\nKEY FINDINGS:")
        
        # Analyze results for critical issues
        critical_issues = []
        working_features = []
        
        for test_name, result in self.investigation_results.items():
            if result['success']:
                working_features.append(test_name)
            else:
                critical_issues.append(f"{test_name}: {result['details']}")
        
        if critical_issues:
            print(f"\n❌ CRITICAL ISSUES FOUND:")
            for issue in critical_issues:
                print(f"   • {issue}")
        
        if working_features:
            print(f"\n✅ WORKING FEATURES:")
            for feature in working_features:
                print(f"   • {feature}")
        
        print(f"\nROOT CAUSE ANALYSIS:")
        
        # Check if registration flow is working
        registration_working = any("Registration Flow Debug" in test and result['success'] 
                                 for test, result in self.investigation_results.items())
        
        # Check if referral lookup is working
        lookup_working = any("Referral Code Lookup" in test and result['success'] 
                           for test, result in self.investigation_results.items())
        
        if registration_working and lookup_working:
            print(f"   ✅ Referral registration system is working correctly")
            print(f"   ✅ New referral relationships are being established properly")
            print(f"   ⚠️ The reported issue may be due to:")
            print(f"      - Historical data where referral relationships were not established")
            print(f"      - Specific edge cases or timing issues")
            print(f"      - Frontend issues not capturing referral codes properly")
        else:
            print(f"   ❌ Referral registration system has issues:")
            if not registration_working:
                print(f"      - Registration flow is broken")
            if not lookup_working:
                print(f"      - Referral code lookup is not working")
        
        print(f"\nRECOMMENDATIONS:")
        if critical_issues:
            print(f"   1. Fix the critical issues identified above")
            print(f"   2. Review the registration endpoint code for referral relationship creation")
            print(f"   3. Check database constraints and referral field updates")
            print(f"   4. Implement referral relationship repair tools for historical data")
        else:
            print(f"   1. The referral system appears to be working correctly for new registrations")
            print(f"   2. Review historical data for missing referral relationships")
            print(f"   3. Consider implementing a referral relationship repair tool")
            print(f"   4. Monitor new registrations to ensure continued proper operation")
        
        print("\n" + "=" * 70)

def main():
    if len(sys.argv) != 2:
        print("Usage: python comprehensive_referral_test.py <base_url>")
        sys.exit(1)
    
    base_url = sys.argv[1]
    
    print(f"🚀 Starting Comprehensive Referral Investigation")
    print(f"   Backend URL: {base_url}")
    
    tester = ComprehensiveReferralTester(base_url)
    success = tester.run_comprehensive_investigation()
    
    if success:
        print("\n✅ Investigation completed successfully")
    else:
        print("\n❌ Investigation encountered issues")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())