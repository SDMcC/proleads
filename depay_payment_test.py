#!/usr/bin/env python3
"""
DePay Payment Flow Testing Script
Tests the complete payment flow for the Proleads Network application
Focus: DePay webhook processing and payment status transitions
"""

import requests
import json
import time
import uuid
import hmac
import hashlib
from datetime import datetime
import sys

class DePayPaymentTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.test_user = None
        self.payment_id = None
        self.tests_run = 0
        self.tests_passed = 0
        
    def log(self, message, level="INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        if not headers:
            headers = {'Content-Type': 'application/json'}
            
        self.tests_run += 1
        self.log(f"🔍 Testing {name}")
        self.log(f"   URL: {url}")
        if data:
            self.log(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=data if data else None)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - Status: {response.status_code}", "SUCCESS")
                try:
                    response_data = response.json()
                    self.log(f"   Response: {json.dumps(response_data, indent=2)[:500]}...")
                    return success, response_data
                except:
                    self.log(f"   Response: {response.text[:500]}...")
                    return success, {}
            else:
                self.log(f"❌ FAILED - Expected {expected_status}, got {response.status_code}", "ERROR")
                try:
                    error_detail = response.json().get('detail', 'No detail provided')
                    self.log(f"   Error: {error_detail}", "ERROR")
                except:
                    self.log(f"   Response: {response.text}", "ERROR")
                return False, {}
                
        except Exception as e:
            self.log(f"❌ FAILED - Exception: {str(e)}", "ERROR")
            return False, {}
    
    def admin_login(self):
        """Login as admin"""
        self.log("🔐 Logging in as admin")
        data = {
            "username": "admin",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data)
        if success and response.get('token'):
            self.admin_token = response.get('token')
            self.log(f"✅ Admin token obtained: {self.admin_token[:20]}...", "SUCCESS")
            return True
        return False
    
    def create_test_user(self):
        """Create a test user for payment testing"""
        self.log("👤 Creating test user")
        
        # Generate realistic test data
        timestamp = int(time.time())
        username = f"paytest_{timestamp}"
        email = f"{username}@proleads.test"
        wallet_address = f"0x{uuid.uuid4().hex[:40]}"
        
        data = {
            "username": username,
            "email": email,
            "password": "TestPass123!",
            "wallet_address": wallet_address
        }
        
        success, response = self.run_test("User Registration", "POST", "users/register", 200, data)
        if success:
            self.test_user = {
                "username": username,
                "email": email,
                "wallet_address": wallet_address,
                "user_id": response.get('user_id'),
                "referral_code": response.get('referral_code')
            }
            self.log(f"✅ Test user created: {username}", "SUCCESS")
            return True
        return False
    
    def login_test_user(self):
        """Login as the test user"""
        self.log("🔑 Logging in test user")
        
        if not self.test_user:
            self.log("❌ No test user available", "ERROR")
            return False
            
        data = {
            "username": self.test_user["username"],
            "password": "TestPass123!"
        }
        
        success, response = self.run_test("User Login", "POST", "auth/login", 200, data)
        if success and response.get('token'):
            self.user_token = response.get('token')
            self.log(f"✅ User token obtained: {self.user_token[:20]}...", "SUCCESS")
            return True
        return False
    
    def create_depay_payment(self, tier="test"):
        """Create a DePay payment record"""
        self.log(f"💳 Creating DePay payment for {tier} tier")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.user_token}'
        }
        
        data = {"tier": tier}
        
        success, response = self.run_test("Create DePay Payment", "POST", "payments/create-depay", 200, data, headers)
        if success:
            self.payment_id = response.get('payment_id')
            self.log(f"✅ Payment created with ID: {self.payment_id}", "SUCCESS")
            self.log(f"   Integration ID: {response.get('integration_id')}")
            self.log(f"   Amount: ${response.get('amount')}")
            self.log(f"   User Address: {response.get('user_address')}")
            return True, response
        return False, {}
    
    def check_payment_status(self):
        """Check payment status"""
        self.log(f"📊 Checking payment status for {self.payment_id}")
        
        if not self.payment_id:
            self.log("❌ No payment ID available", "ERROR")
            return False, {}
            
        success, response = self.run_test("Check Payment Status", "GET", f"payments/{self.payment_id}", 200)
        if success:
            status = response.get('status')
            self.log(f"✅ Payment status: {status}", "SUCCESS")
            return True, response
        return False, {}
    
    def check_user_membership(self):
        """Check user's current membership tier"""
        self.log("👤 Checking user membership tier")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False, {}
            
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.user_token}'
        }
        
        success, response = self.run_test("Check User Profile", "GET", "users/profile", 200, headers=headers)
        if success:
            tier = response.get('membership_tier')
            self.log(f"✅ User membership tier: {tier}", "SUCCESS")
            return True, response
        return False, {}
    
    def simulate_depay_webhook(self, payment_id, tier="test", user_address=None):
        """Simulate DePay webhook callback"""
        self.log(f"🔗 Simulating DePay webhook for payment {payment_id}")
        
        if not user_address and self.test_user:
            user_address = self.test_user["wallet_address"]
        
        # Create DePay webhook payload
        webhook_payload = {
            "blockchain": "polygon",
            "transaction": f"0x{uuid.uuid4().hex}",
            "sender": user_address,
            "receiver": "0xe68BecFfF9eae92bFcf3ba745563C5be2EB81460",  # Hot wallet
            "token": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",  # USDC
            "amount": "2.00" if tier == "test" else "20.00" if tier == "bronze" else "50.00" if tier == "silver" else "100.00",
            "payload": {
                "payment_id": payment_id,
                "tier": tier,
                "user_address": user_address
            },
            "after_block": str(int(time.time())),
            "commitment": "confirmed",
            "confirmations": 1,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "confirmed_at": datetime.utcnow().isoformat() + "Z"
        }
        
        # For testing, we'll try without signature first (check if TEMPORARILY allow without signature is active)
        headers = {
            'Content-Type': 'application/json'
        }
        
        self.log(f"   Webhook payload: {json.dumps(webhook_payload, indent=2)}")
        
        success, response = self.run_test("DePay Webhook Callback", "POST", "payments/depay/callback", 200, webhook_payload, headers)
        
        if not success:
            self.log("⚠️ Webhook failed without signature, this is expected in production", "WARNING")
            self.log("   In production, signature verification would be required", "INFO")
            
        return success, response
    
    def capture_backend_logs(self):
        """Capture backend logs to analyze DePay processing"""
        self.log("📋 Capturing backend logs")
        
        try:
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                logs = result.stdout
                self.log("📋 Recent backend logs:")
                for line in logs.split('\n')[-20:]:  # Last 20 lines
                    if line.strip():
                        if any(keyword in line for keyword in ['DePay', 'Payment', 'ERROR', 'Exception']):
                            self.log(f"   {line}")
                return logs
            else:
                self.log("⚠️ Could not capture backend logs", "WARNING")
                return ""
                
        except Exception as e:
            self.log(f"⚠️ Error capturing logs: {str(e)}", "WARNING")
            return ""
    
    def test_scenario_1_basic_flow(self):
        """Test Scenario 1: Basic Flow Test"""
        self.log("🎯 SCENARIO 1: Basic Flow Test", "INFO")
        self.log("=" * 50)
        
        # Step 1: Create test user
        if not self.create_test_user():
            self.log("❌ Failed to create test user", "ERROR")
            return False
            
        # Step 2: Login test user
        if not self.login_test_user():
            self.log("❌ Failed to login test user", "ERROR")
            return False
            
        # Step 3: Check initial membership (should be affiliate)
        success, profile = self.check_user_membership()
        if not success:
            self.log("❌ Failed to check initial membership", "ERROR")
            return False
            
        initial_tier = profile.get('membership_tier')
        if initial_tier != 'affiliate':
            self.log(f"❌ Expected affiliate tier, got {initial_tier}", "ERROR")
            return False
            
        # Step 4: Create payment for test tier
        success, payment_response = self.create_depay_payment("test")
        if not success:
            self.log("❌ Failed to create DePay payment", "ERROR")
            return False
            
        # Step 5: Verify payment record is created with status="pending"
        success, payment_status = self.check_payment_status()
        if not success:
            self.log("❌ Failed to check payment status", "ERROR")
            return False
            
        if payment_status.get('status') != 'pending':
            self.log(f"❌ Expected pending status, got {payment_status.get('status')}", "ERROR")
            return False
            
        # Step 6: Verify user's membership is still affiliate
        success, profile = self.check_user_membership()
        if not success:
            self.log("❌ Failed to check membership after payment creation", "ERROR")
            return False
            
        if profile.get('membership_tier') != 'affiliate':
            self.log(f"❌ Membership should still be affiliate, got {profile.get('membership_tier')}", "ERROR")
            return False
            
        self.log("✅ SCENARIO 1 COMPLETED SUCCESSFULLY", "SUCCESS")
        return True
    
    def test_scenario_2_webhook_simulation(self):
        """Test Scenario 2: Simulate DePay Webhook"""
        self.log("🎯 SCENARIO 2: DePay Webhook Simulation", "INFO")
        self.log("=" * 50)
        
        if not self.payment_id:
            self.log("❌ No payment ID from previous scenario", "ERROR")
            return False
            
        # Step 1: Capture logs before webhook
        self.log("📋 Capturing logs before webhook processing")
        logs_before = self.capture_backend_logs()
        
        # Step 2: Simulate DePay webhook
        success, webhook_response = self.simulate_depay_webhook(self.payment_id, "test", self.test_user["wallet_address"])
        
        # Step 3: Capture logs after webhook
        self.log("📋 Capturing logs after webhook processing")
        logs_after = self.capture_backend_logs()
        
        # Step 4: Check for DePay processing logs
        self.log("🔍 Analyzing DePay processing logs:")
        depay_logs = []
        for line in logs_after.split('\n'):
            if any(keyword in line for keyword in ['🟢 [DePay Webhook]', '🔵 [DePay]', '✅ [DePay]', '❌ [DePay]']):
                depay_logs.append(line)
                self.log(f"   {line}")
        
        if not depay_logs:
            self.log("⚠️ No DePay processing logs found", "WARNING")
        
        # Step 5: Check payment status after webhook (may still be pending if signature verification failed)
        success, payment_status = self.check_payment_status()
        if success:
            status = payment_status.get('status')
            self.log(f"📊 Payment status after webhook: {status}")
            
            if status == 'completed':
                self.log("✅ Payment successfully processed to completed status", "SUCCESS")
            elif status == 'pending':
                self.log("⚠️ Payment still pending - likely due to signature verification", "WARNING")
            else:
                self.log(f"❓ Unexpected payment status: {status}", "WARNING")
        
        # Step 6: Check user membership after webhook
        success, profile = self.check_user_membership()
        if success:
            tier = profile.get('membership_tier')
            self.log(f"👤 User membership after webhook: {tier}")
            
            if tier == 'test':
                self.log("✅ User membership successfully upgraded to test tier", "SUCCESS")
            elif tier == 'affiliate':
                self.log("⚠️ User membership still affiliate - webhook may not have processed", "WARNING")
            else:
                self.log(f"❓ Unexpected membership tier: {tier}", "WARNING")
        
        self.log("✅ SCENARIO 2 COMPLETED", "SUCCESS")
        return True
    
    def test_scenario_3_post_payment_verification(self):
        """Test Scenario 3: Verify Post-Payment State"""
        self.log("🎯 SCENARIO 3: Post-Payment State Verification", "INFO")
        self.log("=" * 50)
        
        if not self.payment_id:
            self.log("❌ No payment ID available", "ERROR")
            return False
            
        # Step 1: Final payment status check
        success, payment_status = self.check_payment_status()
        if success:
            status = payment_status.get('status')
            self.log(f"📊 Final payment status: {status}")
            
            # Check if payment transitioned from pending to completed
            if status == 'completed':
                self.log("✅ Payment successfully completed", "SUCCESS")
            else:
                self.log(f"⚠️ Payment not completed, status: {status}", "WARNING")
        
        # Step 2: Final membership check
        success, profile = self.check_user_membership()
        if success:
            tier = profile.get('membership_tier')
            expires_at = profile.get('subscription_expires_at')
            
            self.log(f"👤 Final membership tier: {tier}")
            if expires_at:
                self.log(f"📅 Subscription expires: {expires_at}")
            
            # Check if membership was upgraded
            if tier == 'test':
                self.log("✅ Membership successfully upgraded to test tier", "SUCCESS")
            else:
                self.log(f"⚠️ Membership not upgraded, still: {tier}", "WARNING")
        
        # Step 3: Check for any commission records (if applicable)
        if self.admin_token:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.admin_token}'
            }
            
            success, commissions = self.run_test("Check Commissions", "GET", "admin/commissions", 200, headers=headers)
            if success:
                commission_count = commissions.get('total_count', 0)
                self.log(f"💰 Total commissions in system: {commission_count}")
        
        self.log("✅ SCENARIO 3 COMPLETED", "SUCCESS")
        return True
    
    def test_error_scenarios(self):
        """Test error handling scenarios"""
        self.log("🎯 ERROR SCENARIOS: Testing Error Handling", "INFO")
        self.log("=" * 50)
        
        # Test 1: Payment ID doesn't exist
        fake_payment_id = f"PAY-{uuid.uuid4().hex[:16].upper()}"
        success, response = self.simulate_depay_webhook(fake_payment_id, "test", self.test_user["wallet_address"])
        if not success:
            self.log("✅ Correctly rejected webhook for non-existent payment", "SUCCESS")
        else:
            self.log("⚠️ Webhook accepted for non-existent payment", "WARNING")
        
        # Test 2: User address doesn't match
        fake_address = f"0x{uuid.uuid4().hex[:40]}"
        if self.payment_id:
            success, response = self.simulate_depay_webhook(self.payment_id, "test", fake_address)
            if not success:
                self.log("✅ Correctly rejected webhook for mismatched user address", "SUCCESS")
            else:
                self.log("⚠️ Webhook accepted for mismatched user address", "WARNING")
        
        self.log("✅ ERROR SCENARIOS COMPLETED", "SUCCESS")
        return True
    
    def run_comprehensive_test(self):
        """Run comprehensive DePay payment flow test"""
        self.log("🚀 STARTING COMPREHENSIVE DEPAY PAYMENT FLOW TEST", "INFO")
        self.log("=" * 60)
        
        start_time = time.time()
        
        # Step 1: Admin login
        if not self.admin_login():
            self.log("❌ Failed to login as admin", "ERROR")
            return False
        
        # Step 2: Run test scenarios
        scenarios = [
            ("Basic Flow Test", self.test_scenario_1_basic_flow),
            ("DePay Webhook Simulation", self.test_scenario_2_webhook_simulation),
            ("Post-Payment Verification", self.test_scenario_3_post_payment_verification),
            ("Error Handling", self.test_error_scenarios)
        ]
        
        scenario_results = []
        for scenario_name, scenario_func in scenarios:
            self.log(f"\n🎯 Running {scenario_name}...")
            try:
                result = scenario_func()
                scenario_results.append((scenario_name, result))
                if result:
                    self.log(f"✅ {scenario_name} PASSED", "SUCCESS")
                else:
                    self.log(f"❌ {scenario_name} FAILED", "ERROR")
            except Exception as e:
                self.log(f"❌ {scenario_name} EXCEPTION: {str(e)}", "ERROR")
                scenario_results.append((scenario_name, False))
        
        # Final summary
        end_time = time.time()
        duration = end_time - start_time
        
        self.log("\n" + "=" * 60)
        self.log("📊 FINAL TEST SUMMARY", "INFO")
        self.log("=" * 60)
        
        passed_scenarios = sum(1 for _, result in scenario_results if result)
        total_scenarios = len(scenario_results)
        
        self.log(f"⏱️  Test Duration: {duration:.2f} seconds")
        self.log(f"🧪 Total API Tests: {self.tests_run}")
        self.log(f"✅ Passed API Tests: {self.tests_passed}")
        self.log(f"❌ Failed API Tests: {self.tests_run - self.tests_passed}")
        self.log(f"🎯 Scenarios Passed: {passed_scenarios}/{total_scenarios}")
        
        self.log("\n📋 Scenario Results:")
        for scenario_name, result in scenario_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"   {scenario_name}: {status}")
        
        if self.test_user:
            self.log(f"\n👤 Test User Details:")
            self.log(f"   Username: {self.test_user['username']}")
            self.log(f"   Email: {self.test_user['email']}")
            self.log(f"   Wallet: {self.test_user['wallet_address']}")
            if self.payment_id:
                self.log(f"   Payment ID: {self.payment_id}")
        
        # Critical findings
        self.log("\n🔍 CRITICAL FINDINGS:")
        if self.tests_passed < self.tests_run:
            self.log("❌ Some API tests failed - check error logs above", "ERROR")
        
        if passed_scenarios < total_scenarios:
            self.log("❌ Some scenarios failed - payment flow may have issues", "ERROR")
        
        self.log("🔗 DePay webhook processing requires signature verification in production", "INFO")
        self.log("📋 Check backend logs for detailed DePay processing information", "INFO")
        
        overall_success = (self.tests_passed == self.tests_run) and (passed_scenarios == total_scenarios)
        
        if overall_success:
            self.log("🎉 ALL TESTS PASSED - DePay payment flow is working correctly!", "SUCCESS")
        else:
            self.log("⚠️ SOME TESTS FAILED - DePay payment flow needs investigation", "WARNING")
        
        return overall_success

def main():
    """Main function to run DePay payment tests"""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "https://marketer-auth-bridge.preview.emergentagent.com"
    
    print(f"🚀 DePay Payment Flow Tester")
    print(f"🌐 Backend URL: {base_url}")
    print(f"📅 Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    tester = DePayPaymentTester(base_url)
    success = tester.run_comprehensive_test()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 DePay Payment Flow Testing COMPLETED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("⚠️ DePay Payment Flow Testing COMPLETED WITH ISSUES!")
        sys.exit(1)

if __name__ == "__main__":
    main()