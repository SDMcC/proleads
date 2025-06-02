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
            "wallet_address": self.wallet_address
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

    def test_register_user(self):
        """Test user registration"""
        return self.run_test(
            "Register User",
            "POST",
            "auth/register",
            201,
            data=self.test_user
        )

    def test_login_user(self):
        """Test user login with wallet"""
        success, response = self.run_test(
            "Login User",
            "POST",
            "auth/login",
            200,
            data={"wallet_address": self.wallet_address}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"🔑 Authenticated with token: {self.token[:10]}...")
        return success, response

    def test_get_user_profile(self):
        """Test getting user profile"""
        return self.run_test(
            "Get User Profile",
            "GET",
            "users/profile",
            200
        )

    def test_get_referral_code(self):
        """Test getting user's referral code"""
        return self.run_test(
            "Get Referral Code",
            "GET",
            "referrals/code",
            200
        )

    def test_get_referral_stats(self):
        """Test getting referral statistics"""
        return self.run_test(
            "Get Referral Stats",
            "GET",
            "referrals/stats",
            200
        )

    def test_get_payment_methods(self):
        """Test getting available payment methods"""
        return self.run_test(
            "Get Payment Methods",
            "GET",
            "payments/methods",
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
    
    # Test user registration
    tester.test_register_user()
    
    # Test user login
    tester.test_login_user()
    
    # If authenticated, test protected endpoints
    if tester.token:
        tester.test_get_user_profile()
        
        success, referral_data = tester.test_get_referral_code()
        if success and 'referral_code' in referral_data:
            print(f"📋 Referral Code: {referral_data['referral_code']}")
        
        tester.test_get_referral_stats()
        tester.test_get_payment_methods()
        tester.test_create_payment()
    
    # Print test results
    print("\n" + "=" * 60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📊 Success rate: {tester.tests_passed/tester.tests_run*100:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
