#!/usr/bin/env python3
"""
Referral System Fix Verification Test
=====================================

This test specifically addresses the review request to:
1. Verify Dashboard Stats API Fix (GET /api/dashboard/stats)
2. Check Historical Data for thirduser/fourthuser
3. Test New Referral Registration Flow
4. Database Integrity Check

Based on previous testing findings from test_result.md:
- Dashboard stats API had ObjectId serialization issues (500 error)
- Historical data problem: thirduser/fourthuser relationship was never properly established
- Referral system works correctly for NEW registrations
"""

import requests
import json
import time
import uuid
from datetime import datetime

class ReferralSystemTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.findings = []
        
    def log_finding(self, category, message, status="INFO"):
        """Log important findings for the final report"""
        finding = {
            "category": category,
            "message": message,
            "status": status,
            "timestamp": datetime.now().isoformat()
        }
        self.findings.append(finding)
        print(f"📋 {status}: {message}")
    
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
                    return False, {"error": error_detail, "status_code": response.status_code}
                except:
                    print(f"   Response: {response.text}")
                    return False, {"error": response.text, "status_code": response.status_code}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {"error": str(e)}
    
    def admin_login(self):
        """Login as admin to get admin token"""
        data = {
            "username": "admin",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data)
        
        if success and response.get('token'):
            self.admin_token = response.get('token')
            self.log_finding("ADMIN_AUTH", "Admin authentication successful", "SUCCESS")
            return True
        else:
            self.log_finding("ADMIN_AUTH", "Admin authentication failed", "CRITICAL")
            return False
    
    def test_dashboard_stats_api_fix(self):
        """
        PRIMARY OBJECTIVE 1: Verify Dashboard Stats API Fix
        Test the previously failing dashboard stats endpoint
        """
        print("\n" + "="*60)
        print("🎯 PRIMARY OBJECTIVE 1: VERIFY DASHBOARD STATS API FIX")
        print("="*60)
        
        # First, we need a user token to test the dashboard stats
        # Let's create a test user and authenticate
        test_user_address = f"0x{uuid.uuid4().hex[:40]}"
        test_username = f"statstest_{int(time.time())}"
        test_email = f"{test_username}@test.com"
        
        # Register test user
        reg_data = {
            "username": test_username,
            "email": test_email,
            "password": "testpass123",
            "wallet_address": test_user_address
        }
        
        reg_success, reg_response = self.run_test("Register Test User for Stats", "POST", "users/register", 200, reg_data)
        
        if not reg_success:
            self.log_finding("DASHBOARD_STATS", "Failed to create test user for dashboard stats test", "CRITICAL")
            return False
        
        # Login the test user
        login_data = {
            "username": test_username,
            "password": "testpass123"
        }
        
        login_success, login_response = self.run_test("Login Test User for Stats", "POST", "auth/login", 200, login_data)
        
        if not login_success or not login_response.get('token'):
            self.log_finding("DASHBOARD_STATS", "Failed to authenticate test user for dashboard stats test", "CRITICAL")
            return False
        
        user_token = login_response.get('token')
        
        # Now test the dashboard stats endpoint
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {user_token}'
        }
        
        stats_success, stats_response = self.run_test("Dashboard Stats API", "GET", "dashboard/stats", 200, headers=headers)
        
        if stats_success:
            # Verify the response structure
            required_fields = ['total_earnings', 'pending_earnings', 'total_referrals', 'direct_referrals', 'recent_commissions', 'referral_network']
            missing_fields = [field for field in required_fields if field not in stats_response]
            
            if not missing_fields:
                self.log_finding("DASHBOARD_STATS", "✅ Dashboard stats API working correctly - returns 200 status with proper JSON serialization", "SUCCESS")
                
                # Check if referral_network data is included
                if 'referral_network' in stats_response:
                    self.log_finding("DASHBOARD_STATS", "✅ Dashboard stats includes referral_network data as required", "SUCCESS")
                else:
                    self.log_finding("DASHBOARD_STATS", "❌ Dashboard stats missing referral_network data", "WARNING")
                
                return True
            else:
                self.log_finding("DASHBOARD_STATS", f"❌ Dashboard stats API missing required fields: {missing_fields}", "CRITICAL")
                return False
        else:
            error_msg = stats_response.get('error', 'Unknown error')
            status_code = stats_response.get('status_code', 'Unknown')
            self.log_finding("DASHBOARD_STATS", f"❌ Dashboard stats API still failing - Status: {status_code}, Error: {error_msg}", "CRITICAL")
            return False
    
    def test_historical_data_thirduser_fourthuser(self):
        """
        PRIMARY OBJECTIVE 2: Check Historical Data for thirduser/fourthuser
        Investigate the specific users mentioned in the review request
        """
        print("\n" + "="*60)
        print("🎯 PRIMARY OBJECTIVE 2: CHECK HISTORICAL DATA - THIRDUSER/FOURTHUSER")
        print("="*60)
        
        if not self.admin_token:
            if not self.admin_login():
                return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Get all members to search for thirduser and fourthuser
        members_success, members_response = self.run_test("Get All Members for Historical Check", "GET", "admin/members?limit=100", 200, headers=headers)
        
        if not members_success:
            self.log_finding("HISTORICAL_DATA", "Failed to retrieve members list for historical data check", "CRITICAL")
            return False
        
        members = members_response.get('members', [])
        
        # Search for thirduser and fourthuser
        thirduser = None
        fourthuser = None
        
        for member in members:
            if member.get('username') == 'thirduser':
                thirduser = member
            elif member.get('username') == 'fourthuser':
                fourthuser = member
        
        # Report findings
        if thirduser:
            self.log_finding("HISTORICAL_DATA", f"✅ Found thirduser: {thirduser['username']} ({thirduser['wallet_address']})", "INFO")
            
            # Get detailed info about thirduser
            thirduser_details_success, thirduser_details = self.run_test("Get thirduser Details", "GET", f"admin/members/{thirduser['id']}", 200, headers=headers)
            
            if thirduser_details_success:
                referrals = thirduser_details.get('referrals', [])
                stats = thirduser_details.get('stats', {})
                
                self.log_finding("HISTORICAL_DATA", f"thirduser referral count: {stats.get('total_referrals', 0)}", "INFO")
                self.log_finding("HISTORICAL_DATA", f"thirduser referral code: {thirduser.get('referral_code', 'N/A')}", "INFO")
                
                if referrals:
                    referral_usernames = [r.get('username') for r in referrals]
                    self.log_finding("HISTORICAL_DATA", f"thirduser referrals: {referral_usernames}", "INFO")
                else:
                    self.log_finding("HISTORICAL_DATA", "thirduser has 0 referrals in system", "WARNING")
        else:
            self.log_finding("HISTORICAL_DATA", "❌ thirduser not found in database", "CRITICAL")
        
        if fourthuser:
            self.log_finding("HISTORICAL_DATA", f"✅ Found fourthuser: {fourthuser['username']} ({fourthuser['wallet_address']})", "INFO")
            
            # Get detailed info about fourthuser
            fourthuser_details_success, fourthuser_details = self.run_test("Get fourthuser Details", "GET", f"admin/members/{fourthuser['id']}", 200, headers=headers)
            
            if fourthuser_details_success:
                sponsor = fourthuser_details.get('sponsor')
                member_info = fourthuser_details.get('member', {})
                
                if sponsor:
                    self.log_finding("HISTORICAL_DATA", f"fourthuser sponsor: {sponsor.get('username')} ({sponsor.get('address')})", "INFO")
                    
                    if sponsor.get('username') == 'thirduser':
                        self.log_finding("HISTORICAL_DATA", "✅ fourthuser correctly shows thirduser as sponsor", "SUCCESS")
                    else:
                        self.log_finding("HISTORICAL_DATA", f"❌ fourthuser sponsor is {sponsor.get('username')}, not thirduser", "CRITICAL")
                else:
                    self.log_finding("HISTORICAL_DATA", "❌ fourthuser has NO SPONSOR - referral relationship missing", "CRITICAL")
        else:
            self.log_finding("HISTORICAL_DATA", "❌ fourthuser not found in database", "CRITICAL")
        
        # Summary of historical data findings
        if thirduser and fourthuser:
            # Check if the referral relationship exists
            if thirduser and fourthuser:
                fourthuser_details_success, fourthuser_details = self.run_test("Verify Referral Relationship", "GET", f"admin/members/{fourthuser['id']}", 200, headers=headers)
                if fourthuser_details_success:
                    sponsor = fourthuser_details.get('sponsor')
                    if sponsor and sponsor.get('username') == 'thirduser':
                        self.log_finding("HISTORICAL_DATA", "✅ HISTORICAL DATA VERIFIED: thirduser → fourthuser referral relationship exists", "SUCCESS")
                        return True
                    else:
                        self.log_finding("HISTORICAL_DATA", "❌ HISTORICAL DATA ISSUE CONFIRMED: thirduser → fourthuser referral relationship MISSING", "CRITICAL")
                        return False
        
        return False
    
    def test_new_referral_registration_flow(self):
        """
        PRIMARY OBJECTIVE 3: Test New Referral Registration Flow
        Create a test user and a referral to confirm the current system works
        """
        print("\n" + "="*60)
        print("🎯 PRIMARY OBJECTIVE 3: TEST NEW REFERRAL REGISTRATION FLOW")
        print("="*60)
        
        # Step 1: Register new main user
        main_user_address = f"0x{uuid.uuid4().hex[:40]}"
        main_username = f"mainuser_{int(time.time())}"
        main_email = f"{main_username}@test.com"
        
        main_reg_data = {
            "username": main_username,
            "email": main_email,
            "password": "testpass123",
            "wallet_address": main_user_address
        }
        
        main_reg_success, main_reg_response = self.run_test("Register Main User", "POST", "users/register", 200, main_reg_data)
        
        if not main_reg_success:
            self.log_finding("NEW_REFERRAL_FLOW", "Failed to register main user", "CRITICAL")
            return False
        
        main_referral_code = main_reg_response.get('referral_code')
        if not main_referral_code:
            self.log_finding("NEW_REFERRAL_FLOW", "Main user registration did not return referral code", "CRITICAL")
            return False
        
        self.log_finding("NEW_REFERRAL_FLOW", f"✅ Main user registered with referral code: {main_referral_code}", "SUCCESS")
        
        # Step 2: Register referral user with that code
        referral_user_address = f"0x{uuid.uuid4().hex[:40]}"
        referral_username = f"refuser_{int(time.time())}"
        referral_email = f"{referral_username}@test.com"
        
        referral_reg_data = {
            "username": referral_username,
            "email": referral_email,
            "password": "testpass123",
            "wallet_address": referral_user_address,
            "referrer_code": main_referral_code
        }
        
        referral_reg_success, referral_reg_response = self.run_test("Register Referral User", "POST", "users/register", 200, referral_reg_data)
        
        if not referral_reg_success:
            self.log_finding("NEW_REFERRAL_FLOW", "Failed to register referral user with referral code", "CRITICAL")
            return False
        
        self.log_finding("NEW_REFERRAL_FLOW", f"✅ Referral user registered successfully", "SUCCESS")
        
        # Step 3: Verify the relationship is properly established
        if not self.admin_token:
            if not self.admin_login():
                return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Get main user details to check referrals
        main_user_details_success, main_user_details = self.run_test("Get Main User Details", "GET", f"admin/members/{main_user_address}", 200, headers=headers)
        
        if main_user_details_success:
            referrals = main_user_details.get('referrals', [])
            stats = main_user_details.get('stats', {})
            
            if stats.get('total_referrals', 0) > 0:
                self.log_finding("NEW_REFERRAL_FLOW", f"✅ Main user now has {stats.get('total_referrals')} referrals", "SUCCESS")
                
                # Check if our referral user is in the list
                referral_found = False
                for referral in referrals:
                    if referral.get('username') == referral_username:
                        referral_found = True
                        break
                
                if referral_found:
                    self.log_finding("NEW_REFERRAL_FLOW", "✅ Referral user found in main user's referral list", "SUCCESS")
                else:
                    self.log_finding("NEW_REFERRAL_FLOW", "❌ Referral user NOT found in main user's referral list", "CRITICAL")
                    return False
            else:
                self.log_finding("NEW_REFERRAL_FLOW", "❌ Main user shows 0 referrals after referral registration", "CRITICAL")
                return False
        
        # Get referral user details to check sponsor
        referral_user_details_success, referral_user_details = self.run_test("Get Referral User Details", "GET", f"admin/members/{referral_user_address}", 200, headers=headers)
        
        if referral_user_details_success:
            sponsor = referral_user_details.get('sponsor')
            
            if sponsor and sponsor.get('username') == main_username:
                self.log_finding("NEW_REFERRAL_FLOW", "✅ Referral user correctly shows main user as sponsor", "SUCCESS")
            else:
                self.log_finding("NEW_REFERRAL_FLOW", f"❌ Referral user sponsor is incorrect: {sponsor}", "CRITICAL")
                return False
        
        self.log_finding("NEW_REFERRAL_FLOW", "✅ NEW REFERRAL SYSTEM WORKING CORRECTLY", "SUCCESS")
        return True
    
    def test_database_integrity_check(self):
        """
        PRIMARY OBJECTIVE 4: Database Integrity Check
        Query the database directly for referral relationships
        """
        print("\n" + "="*60)
        print("🎯 PRIMARY OBJECTIVE 4: DATABASE INTEGRITY CHECK")
        print("="*60)
        
        if not self.admin_token:
            if not self.admin_login():
                return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Get all members to analyze referral relationships
        members_success, members_response = self.run_test("Get All Members for Integrity Check", "GET", "admin/members?limit=200", 200, headers=headers)
        
        if not members_success:
            self.log_finding("DATABASE_INTEGRITY", "Failed to retrieve members for integrity check", "CRITICAL")
            return False
        
        members = members_response.get('members', [])
        total_members = len(members)
        
        self.log_finding("DATABASE_INTEGRITY", f"Total members in database: {total_members}", "INFO")
        
        # Count users with referrer_address set
        users_with_referrers = 0
        referral_relationships = []
        
        for member in members:
            member_details_success, member_details = self.run_test(f"Get Details for {member['username']}", "GET", f"admin/members/{member['id']}", 200, headers=headers)
            
            if member_details_success:
                sponsor = member_details.get('sponsor')
                if sponsor:
                    users_with_referrers += 1
                    referral_relationships.append({
                        'referral': member['username'],
                        'referrer': sponsor.get('username'),
                        'referral_address': member['wallet_address'],
                        'referrer_address': sponsor.get('address')
                    })
        
        self.log_finding("DATABASE_INTEGRITY", f"Users with referrer_address set: {users_with_referrers}", "INFO")
        self.log_finding("DATABASE_INTEGRITY", f"Total referral relationships found: {len(referral_relationships)}", "INFO")
        
        # Check for thirduser/fourthuser relationship specifically
        thirduser_fourthuser_relationship = False
        for relationship in referral_relationships:
            if relationship['referral'] == 'fourthuser' and relationship['referrer'] == 'thirduser':
                thirduser_fourthuser_relationship = True
                self.log_finding("DATABASE_INTEGRITY", "✅ thirduser → fourthuser relationship found in database", "SUCCESS")
                break
        
        if not thirduser_fourthuser_relationship:
            self.log_finding("DATABASE_INTEGRITY", "❌ thirduser → fourthuser relationship NOT found in database", "CRITICAL")
        
        # Display all referral relationships for analysis
        if referral_relationships:
            self.log_finding("DATABASE_INTEGRITY", "Current referral relationships in database:", "INFO")
            for rel in referral_relationships:
                self.log_finding("DATABASE_INTEGRITY", f"  {rel['referrer']} → {rel['referral']}", "INFO")
        else:
            self.log_finding("DATABASE_INTEGRITY", "No referral relationships found in database", "WARNING")
        
        return True
    
    def generate_final_report(self):
        """Generate final report with recommendations"""
        print("\n" + "="*80)
        print("📊 REFERRAL SYSTEM FIX VERIFICATION - FINAL REPORT")
        print("="*80)
        
        print(f"\n📈 TEST SUMMARY:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print(f"\n🔍 DETAILED FINDINGS:")
        
        # Group findings by category
        categories = {}
        for finding in self.findings:
            category = finding['category']
            if category not in categories:
                categories[category] = []
            categories[category].append(finding)
        
        for category, findings in categories.items():
            print(f"\n   {category}:")
            for finding in findings:
                status_icon = "✅" if finding['status'] == "SUCCESS" else "❌" if finding['status'] == "CRITICAL" else "⚠️"
                print(f"     {status_icon} {finding['message']}")
        
        print(f"\n🎯 CONCLUSIONS:")
        
        # Analyze findings to provide conclusions
        dashboard_working = any(f['category'] == 'DASHBOARD_STATS' and f['status'] == 'SUCCESS' for f in self.findings)
        historical_issue_confirmed = any(f['category'] == 'HISTORICAL_DATA' and 'MISSING' in f['message'] for f in self.findings)
        new_system_working = any(f['category'] == 'NEW_REFERRAL_FLOW' and f['status'] == 'SUCCESS' for f in self.findings)
        
        if dashboard_working:
            print("   ✅ Dashboard Stats API Fix: VERIFIED - API now returns 200 status with proper JSON serialization")
        else:
            print("   ❌ Dashboard Stats API Fix: FAILED - API still returning errors")
        
        if historical_issue_confirmed:
            print("   ❌ Historical Data Issue: CONFIRMED - thirduser/fourthuser relationship missing from database")
        else:
            print("   ✅ Historical Data: OK - thirduser/fourthuser relationship exists")
        
        if new_system_working:
            print("   ✅ New Referral System: WORKING - Current referral tracking is functional")
        else:
            print("   ❌ New Referral System: ISSUES - Current referral tracking has problems")
        
        print(f"\n💡 RECOMMENDATIONS:")
        
        if historical_issue_confirmed:
            print("   🔧 Manual database update needed for thirduser/fourthuser relationship")
            print("   📝 Consider implementing data migration script for historical referral relationships")
        
        if dashboard_working and new_system_working:
            print("   ✅ Referral system is now functional for new users")
            print("   📊 Monitor system for continued proper operation")
        
        if not dashboard_working:
            print("   🚨 Dashboard stats API requires immediate attention")
            print("   🔍 Investigate ObjectId serialization issues")
        
        print("\n" + "="*80)
        
        return {
            "dashboard_stats_working": dashboard_working,
            "historical_data_issue": historical_issue_confirmed,
            "new_system_working": new_system_working,
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed
        }

def main():
    """Main test execution"""
    # Use the backend URL from environment
    base_url = "https://marketing-hub-162.preview.emergentagent.com"
    
    print("🚀 Starting Referral System Fix Verification")
    print(f"🌐 Testing against: {base_url}")
    
    tester = ReferralSystemTester(base_url)
    
    # Execute all primary objectives
    print("\n🎯 EXECUTING PRIMARY OBJECTIVES...")
    
    # Objective 1: Verify Dashboard Stats API Fix
    dashboard_result = tester.test_dashboard_stats_api_fix()
    
    # Objective 2: Check Historical Data
    historical_result = tester.test_historical_data_thirduser_fourthuser()
    
    # Objective 3: Test New Referral Registration Flow
    new_flow_result = tester.test_new_referral_registration_flow()
    
    # Objective 4: Database Integrity Check
    integrity_result = tester.test_database_integrity_check()
    
    # Generate final report
    final_report = tester.generate_final_report()
    
    return final_report

if __name__ == "__main__":
    main()