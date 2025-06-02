import requests
import sys
import json
import uuid
from datetime import datetime

class Web3MembershipTester:
    def __init__(self, base_url="https://bcf818be-3505-417c-beaf-52bc651b496c.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.wallet_address = f"0x{uuid.uuid4().hex[:40]}"  # Generate a random wallet address for testing
        self.test_user = {
            "username": f"test_user_{datetime.now().strftime('%H%M%S')}",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "address": self.wallet_address
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
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
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check endpoint"""
        return self.run_test(
            "API Health Check",
            "GET",
            "health",
            200
        )

    def test_get_membership_tiers(self):
        """Test getting membership tiers"""
        return self.run_test(
            "Get Membership Tiers",
            "GET",
            "membership/tiers",
            200
        )

    def test_get_nonce(self):
        """Test getting a nonce for wallet authentication"""
        return self.run_test(
            "Get Authentication Nonce",
            "POST",
            "auth/nonce",
            200,
            data={"address": self.wallet_address}
        )

    def test_register_user(self):
        """Test user registration"""
        return self.run_test(
            "Register User",
            "POST",
            "users/register",
            201,
            data=self.test_user
        )

    def test_verify_wallet(self):
        """Test wallet verification (simulated)"""
        # In a real scenario, we would sign the nonce with the wallet's private key
        # For testing, we'll just simulate this step
        return self.run_test(
            "Verify Wallet",
            "POST",
            "auth/verify",
            200,
            data={
                "address": self.wallet_address,
                "signature": "0x" + "1" * 130  # Simulated signature
            }
        )

    def test_get_user_profile(self):
        """Test getting user profile"""
        return self.run_test(
            "Get User Profile",
            "GET",
            "users/profile",
            200
        )

    def test_get_dashboard_stats(self):
        """Test getting dashboard statistics"""
        return self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )

    def test_get_network_data(self):
        """Test getting network data"""
        return self.run_test(
            "Get Network Data",
            "GET",
            "dashboard/network",
            200
        )

    def test_create_payment(self):
        """Test creating a payment for membership"""
        return self.run_test(
            "Create Payment",
            "POST",
            "payments/create",
            200,
            data={"tier": "bronze", "payment_method": "usdc"}
        )

    def test_get_referral_info(self):
        """Test getting referral information"""
        return self.run_test(
            "Get Referral Info",
            "GET",
            "referral/TEST123",  # Test referral code
            200
        )

def main():
    print("🚀 Starting Web3 Membership Platform API Tests")
    print("=" * 60)
    
    tester = Web3MembershipTester()
    
    # Test health check
    tester.test_health_check()
    
    # Test membership tiers
    success, tiers_data = tester.test_get_membership_tiers()
    if success:
        print("\n📊 Membership Tiers:")
        try:
            tiers = tiers_data.get('tiers', {})
            for tier, details in tiers.items():
                print(f"  - {tier.capitalize()}: ${details.get('price', 'N/A')}")
                print(f"    Commission Levels: {len(details.get('commissions', []))}")
        except Exception as e:
            print(f"Error parsing tiers: {str(e)}")
    
    # Test authentication flow
    success, nonce_data = tester.test_get_nonce()
    
    # Test user registration
    tester.test_register_user()
    
    # Test wallet verification
    success, auth_data = tester.test_verify_wallet()
    if success and 'token' in auth_data:
        tester.token = auth_data['token']
        print(f"🔑 Authenticated with token: {tester.token[:10]}...")
    
    # If authenticated, test protected endpoints
    if tester.token:
        tester.test_get_user_profile()
        tester.test_get_dashboard_stats()
        tester.test_get_network_data()
        tester.test_create_payment()
    
    # Test referral info (doesn't require authentication)
    tester.test_get_referral_info()
    
    # Print test results
    print("\n" + "=" * 60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📊 Success rate: {tester.tests_passed/tester.tests_run*100:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
