import requests
import sys
import json
import time
from datetime import datetime
import uuid

class Web3MembershipTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_address = f"0x{uuid.uuid4().hex[:40]}"
        self.username = f"test_user_{int(time.time())}"
        self.email = f"{self.username}@test.com"
        self.referral_code = None
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        if not headers:
            headers = {'Content-Type': 'application/json'}
            if self.token:
                headers['Authorization'] = f'Bearer {self.token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
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
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'No detail provided')
                    print(f"Error: {error_detail}")
                except:
                    print(f"Response: {response.text}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}
    
    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)
    
    def test_get_membership_tiers(self):
        """Test getting membership tiers"""
        return self.run_test("Get Membership Tiers", "GET", "membership/tiers", 200)
    
    def test_register_user(self):
        """Test user registration"""
        data = {
            "address": self.user_address,
            "username": self.username,
            "email": self.email
        }
        success, response = self.run_test("Register User", "POST", "users/register", 200, data)
        if success and response.get('referral_code'):
            self.referral_code = response.get('referral_code')
        return success, response
    
    def test_get_nonce(self):
        """Test getting a nonce for authentication"""
        data = {"address": self.user_address}
        return self.run_test("Get Nonce", "POST", "auth/nonce", 200, data)
    
    def test_verify_signature(self):
        """Test verifying a signature (mocked)"""
        # In a real test, we would sign the nonce with a private key
        # For this test, we'll just mock it since we don't have a private key
        data = {
            "address": self.user_address,
            "signature": "0x1234567890abcdef"  # Mock signature
        }
        success, response = self.run_test("Verify Signature", "POST", "auth/verify", 200, data)
        if success and response.get('token'):
            self.token = response.get('token')
        return success, response
    
    def test_create_payment(self):
        """Test creating a payment"""
        data = {
            "tier": "bronze",
            "currency": "BTC"
        }
        return self.run_test("Create Payment", "POST", "payments/create", 201, data)
    
    def test_get_dashboard_stats(self):
        """Test getting dashboard stats"""
        return self.run_test("Get Dashboard Stats", "GET", "dashboard/stats", 200)
    
    def test_commission_calculation(self):
        """Test commission calculation logic"""
        # Create a test referral chain
        # Affiliate -> Bronze -> Silver -> Gold
        
        # First, check if the commission rates match what we expect
        success, tiers_response = self.test_get_membership_tiers()
        if not success:
            return False, {}
        
        tiers = tiers_response.get('tiers', {})
        
        # Verify commission rates
        expected_rates = {
            "affiliate": [0.25, 0.05],
            "bronze": [0.25, 0.05, 0.03, 0.02],
            "silver": [0.27, 0.10, 0.05, 0.03],
            "gold": [0.30, 0.15, 0.10, 0.05]
        }
        
        rates_correct = True
        for tier, rates in expected_rates.items():
            if tier not in tiers:
                print(f"❌ Tier {tier} not found in API response")
                rates_correct = False
                continue
                
            api_rates = tiers[tier].get('commissions', [])
            if api_rates != rates:
                print(f"❌ Commission rates for {tier} don't match: Expected {rates}, got {api_rates}")
                rates_correct = False
        
        if rates_correct:
            print("✅ Commission rates match expected values")
            self.tests_passed += 1
        else:
            print("❌ Commission rates don't match expected values")
        
        self.tests_run += 1
        
        # Test specific commission calculations
        test_cases = [
            {
                "referrer_tier": "bronze",
                "new_member_tier": "gold",
                "expected_commission": 25.00  # 25% of $100
            },
            {
                "referrer_tier": "silver",
                "new_member_tier": "bronze",
                "expected_commission": 5.40   # 27% of $20
            },
            {
                "referrer_tier": "gold",
                "new_member_tier": "gold",
                "expected_commission": 30.00  # 30% of $100
            }
        ]
        
        for case in test_cases:
            referrer_tier = case["referrer_tier"]
            new_member_tier = case["new_member_tier"]
            expected_commission = case["expected_commission"]
            
            referrer_rate = tiers[referrer_tier]["commissions"][0]
            new_member_price = tiers[new_member_tier]["price"]
            calculated_commission = round(referrer_rate * new_member_price, 2)
            
            if calculated_commission == expected_commission:
                print(f"✅ {referrer_tier} referrer → {new_member_tier} member: ${calculated_commission} (matches expected ${expected_commission})")
                self.tests_passed += 1
            else:
                print(f"❌ {referrer_tier} referrer → {new_member_tier} member: ${calculated_commission} (expected ${expected_commission})")
            
            self.tests_run += 1
        
        return rates_correct, {}

def main():
    # Get the backend URL from environment or use default
    backend_url = "https://bcf818be-3505-417c-beaf-52bc651b496c.preview.emergentagent.com"
    
    print("🚀 Starting Web3 Membership Platform API Tests")
    print("=============================")
    
    tester = Web3MembershipTester(backend_url)
    
    # Run tests
    tester.test_health_check()
    tester.test_get_membership_tiers()
    tester.test_register_user()
    tester.test_get_nonce()
    tester.test_verify_signature()
    
    # These tests require authentication
    if tester.token:
        tester.test_create_payment()
        tester.test_get_dashboard_stats()
    else:
        print("\n⚠️ Skipping authenticated tests because login failed")
        tester.tests_run += 2  # Count skipped tests
    
    # Test commission calculation
    tester.test_commission_calculation()
    
    # Print results
    print("\n================================")
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📊 Success rate: {tester.tests_passed/tester.tests_run*100:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
