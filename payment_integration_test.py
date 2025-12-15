import requests
import sys
import uuid
import json
from datetime import datetime

class Web3MembershipPaymentTester:
    def __init__(self, base_url="https://proleads-refactor.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.user_address = None
        self.token = None
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
                if response.text:
                    try:
                        print(f"   Response: {json.dumps(response.json())[:200]}...")
                    except:
                        print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    try:
                        print(f"   Error: {json.dumps(response.json())}")
                    except:
                        print(f"   Error: {response.text}")

            return success, response.json() if response.text and "application/json" in response.headers.get('Content-Type', '') else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def register_user(self):
        """Register a test user"""
        timestamp = int(datetime.utcnow().timestamp())
        self.user_address = f"0x{uuid.uuid4().hex.replace('-', '')[:32]}"
        username = f"test_user_{timestamp}"
        email = f"{username}@test.com"
        
        success, response = self.run_test(
            "Register User",
            "POST",
            "users/register",
            200,
            data={"address": self.user_address, "username": username, "email": email}
        )
        
        if success and "referral_code" in response:
            self.referral_code = response["referral_code"]
            print(f"✅ User registered with address: {self.user_address}")
            print(f"✅ Referral code: {self.referral_code}")
            return True
        return False

    def authenticate_user(self):
        """Get nonce and simulate authentication"""
        # Get nonce
        success, nonce_response = self.run_test(
            "Get Nonce",
            "POST",
            "auth/nonce",
            200,
            data={"address": self.user_address}
        )
        
        if not success:
            return False
            
        # In a real scenario, we would sign the nonce with the wallet
        # For testing, we'll use a mock signature
        mock_signature = "0x1234567890abcdef"
        
        # Verify signature (this will fail in the real API but we're testing the flow)
        success, auth_response = self.run_test(
            "Verify Signature",
            "POST",
            "auth/verify",
            200,  # We expect 200 in our test but it would be 401 in real API
            data={"address": self.user_address, "signature": mock_signature}
        )
        
        # For testing purposes, we'll use a mock token
        self.token = "mock_token_for_testing"
        print("⚠️ Using mock authentication token for testing")
        
        return True

    def test_affiliate_upgrade(self):
        """Test affiliate tier upgrade (free)"""
        success, response = self.run_test(
            "Affiliate Tier Upgrade",
            "POST",
            "payments/create",
            200,
            data={"tier": "affiliate", "currency": "BTC"}
        )
        
        if success:
            print("✅ Affiliate tier upgrade successful (free tier)")
            return True
        return False

    def test_paid_tier_upgrade(self, tier, currency):
        """Test paid tier upgrade"""
        success, response = self.run_test(
            f"{tier.title()} Tier Upgrade with {currency}",
            "POST",
            "payments/create",
            200,
            data={"tier": tier, "currency": currency}
        )
        
        if success and "payment_url" in response:
            print(f"✅ {tier.title()} tier upgrade payment created")
            print(f"✅ Payment URL: {response['payment_url']}")
            print(f"✅ Payment amount: {response['amount']} {response['currency']}")
            return response
        else:
            print(f"❌ Failed to create payment for {tier} tier")
            return None

    def test_commission_rates(self):
        """Test commission rates match expected values"""
        success, response = self.run_test(
            "Get Membership Tiers",
            "GET",
            "membership/tiers",
            200
        )
        
        if not success:
            return False
            
        tiers = response.get("tiers", {})
        
        # Check bronze tier commissions
        bronze_commissions = tiers.get("bronze", {}).get("commissions", [])
        if bronze_commissions != [0.25, 0.05, 0.03, 0.02]:
            print(f"❌ Bronze tier commissions don't match expected values: {bronze_commissions}")
            return False
            
        # Check silver tier commissions
        silver_commissions = tiers.get("silver", {}).get("commissions", [])
        if silver_commissions != [0.27, 0.1, 0.05, 0.03]:
            print(f"❌ Silver tier commissions don't match expected values: {silver_commissions}")
            return False
            
        # Check gold tier commissions
        gold_commissions = tiers.get("gold", {}).get("commissions", [])
        if gold_commissions != [0.3, 0.15, 0.1, 0.05]:
            print(f"❌ Gold tier commissions don't match expected values: {gold_commissions}")
            return False
            
        print("✅ All commission rates match expected values")
        return True

def main():
    print("🚀 Starting Web3 Membership Platform Payment Integration Tests")
    print("===========================================================")
    
    tester = Web3MembershipPaymentTester()
    
    # Test health check
    tester.run_test("Health Check", "GET", "health", 200)
    
    # Test membership tiers
    tester.run_test("Get Membership Tiers", "GET", "membership/tiers", 200)
    
    # Register a test user
    if not tester.register_user():
        print("❌ User registration failed, stopping tests")
        return 1
        
    # Authenticate user (mock)
    if not tester.authenticate_user():
        print("❌ Authentication failed, stopping tests")
        return 1
    
    # Test affiliate tier upgrade (free)
    if not tester.test_affiliate_upgrade():
        print("❌ Affiliate tier upgrade failed, stopping tests")
        return 1
    
    # Test bronze tier upgrade with BTC
    bronze_payment = tester.test_paid_tier_upgrade("bronze", "BTC")
    if not bronze_payment:
        print("❌ Bronze tier upgrade failed")
    
    # Test silver tier upgrade with ETH
    silver_payment = tester.test_paid_tier_upgrade("silver", "ETH")
    if not silver_payment:
        print("❌ Silver tier upgrade failed")
    
    # Test gold tier upgrade with USDC
    gold_payment = tester.test_paid_tier_upgrade("gold", "USDC")
    if not gold_payment:
        print("❌ Gold tier upgrade failed")
    
    # Test commission rates
    tester.test_commission_rates()
    
    # Print results
    print("\n===========================================================")
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📊 Success rate: {(tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())