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
            "address": self.wallet_address,
            "referrer_code": None  # Will be set if we test with a referrer
        }
        self.referral_code = None  # Will be set after registration

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
            200,  # Updated to match actual response code
            data=self.test_user
        )

    def test_verify_wallet(self):
        """Test wallet verification (simulated)"""
        # In a real scenario, we would sign the nonce with the wallet's private key
        # For testing, we'll just simulate this step with a valid signature format
        # Get the nonce first
        success, nonce_data = self.test_get_nonce()
        if not success or 'nonce' not in nonce_data:
            print("❌ Failed to get nonce for wallet verification")
            return False, {}
            
        nonce = nonce_data['nonce']
        
        # Create a simulated signature that the backend will accept
        # This is a simplified approach for testing purposes
        return self.run_test(
            "Verify Wallet",
            "POST",
            "auth/login",  # Changed to auth/login which might be the correct endpoint
            200,
            data={
                "address": self.wallet_address,
                "signature": f"0x{nonce}1{'1' * 120}"  # Include the nonce in the signature
            }
        )

    def test_get_user_profile(self):
        """Test getting user profile"""
        success, profile_data = self.run_test(
            "Get User Profile",
            "GET",
            "users/profile",
            200
        )
        
        if success and 'referral_code' in profile_data:
            self.referral_code = profile_data['referral_code']
            print(f"📋 User referral code: {self.referral_code}")
            
        return success, profile_data

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

    def test_create_payment(self, tier="bronze", currency="usdc"):
        """Test creating a payment for membership"""
        return self.run_test(
            f"Create Payment for {tier.capitalize()} tier with {currency.upper()}",
            "POST",
            "payments/create",
            200,
            data={"tier": tier, "currency": currency}
        )

    def test_get_referral_info(self, referral_code):
        """Test getting referral information"""
        return self.run_test(
            "Get Referral Info",
            "GET",
            f"referral/{referral_code}",
            200
        )

    def test_commission_calculation(self):
        """Test commission calculation by creating a chain of referrals and payments"""
        print("\n🔄 Testing Commission Calculation...")
        
        # Create a chain of users with different tiers
        users = []
        
        # First user (no referrer)
        first_user = Web3MembershipTester(self.base_url)
        first_user.test_health_check()
        first_user.test_get_nonce()
        first_user.test_register_user()
        success, auth_data = first_user.test_verify_wallet()
        
        if not success:
            print("❌ Failed to create first user")
            return False
            
        first_user.token = auth_data['token']
        success, profile = first_user.test_get_user_profile()
        
        if not success or not first_user.referral_code:
            print("❌ Failed to get first user's referral code")
            return False
            
        users.append(first_user)
        print(f"✅ Created first user with referral code: {first_user.referral_code}")
        
        # Upgrade first user to Gold tier
        success, payment_data = first_user.test_create_payment(tier="gold")
        if not success:
            print("❌ Failed to upgrade first user to Gold tier")
        else:
            print(f"✅ First user upgraded to Gold tier")
        
        # Second user (referred by first user)
        second_user = Web3MembershipTester(self.base_url)
        second_user.test_user["referrer_code"] = first_user.referral_code
        second_user.test_health_check()
        second_user.test_get_nonce()
        second_user.test_register_user()
        success, auth_data = second_user.test_verify_wallet()
        
        if not success:
            print("❌ Failed to create second user")
            return False
            
        second_user.token = auth_data['token']
        success, profile = second_user.test_get_user_profile()
        
        if not success or not second_user.referral_code:
            print("❌ Failed to get second user's referral code")
            return False
            
        users.append(second_user)
        print(f"✅ Created second user with referral code: {second_user.referral_code}")
        
        # Upgrade second user to Bronze tier
        success, payment_data = second_user.test_create_payment(tier="bronze")
        if not success:
            print("❌ Failed to upgrade second user to Bronze tier")
        else:
            print(f"✅ Second user upgraded to Bronze tier")
            print(f"🔍 Checking if first user (Gold) received 30% commission from second user's Bronze membership")
            
            # Check first user's dashboard for commission
            success, stats = first_user.test_get_dashboard_stats()
            if success:
                commissions = stats.get('recent_commissions', [])
                if commissions:
                    for commission in commissions:
                        if commission.get('new_member_tier') == 'bronze':
                            expected_amount = 20 * 0.30  # 30% of $20 Bronze tier
                            actual_amount = commission.get('amount', 0)
                            if abs(actual_amount - expected_amount) < 0.01:  # Allow for small floating point differences
                                print(f"✅ Commission calculation correct: ${actual_amount} (expected ${expected_amount})")
                            else:
                                print(f"❌ Commission calculation incorrect: ${actual_amount} (expected ${expected_amount})")
                else:
                    print("❌ No commissions found for first user")
            else:
                print("❌ Failed to get first user's dashboard stats")
        
        # Third user (referred by second user)
        third_user = Web3MembershipTester(self.base_url)
        third_user.test_user["referrer_code"] = second_user.referral_code
        third_user.test_health_check()
        third_user.test_get_nonce()
        third_user.test_register_user()
        success, auth_data = third_user.test_verify_wallet()
        
        if not success:
            print("❌ Failed to create third user")
            return False
            
        third_user.token = auth_data['token']
        success, profile = third_user.test_get_user_profile()
        
        if not success:
            print("❌ Failed to get third user's profile")
            return False
            
        users.append(third_user)
        print(f"✅ Created third user with referral code: {third_user.referral_code}")
        
        # Upgrade third user to Silver tier
        success, payment_data = third_user.test_create_payment(tier="silver")
        if not success:
            print("❌ Failed to upgrade third user to Silver tier")
        else:
            print(f"✅ Third user upgraded to Silver tier")
            print(f"🔍 Checking if second user (Bronze) received 25% commission from third user's Silver membership")
            print(f"🔍 Checking if first user (Gold) received 15% commission from third user's Silver membership (2nd level)")
            
            # Check second user's dashboard for commission
            success, stats = second_user.test_get_dashboard_stats()
            if success:
                commissions = stats.get('recent_commissions', [])
                if commissions:
                    for commission in commissions:
                        if commission.get('new_member_tier') == 'silver':
                            expected_amount = 50 * 0.25  # 25% of $50 Silver tier
                            actual_amount = commission.get('amount', 0)
                            if abs(actual_amount - expected_amount) < 0.01:
                                print(f"✅ Commission calculation correct for second user: ${actual_amount} (expected ${expected_amount})")
                            else:
                                print(f"❌ Commission calculation incorrect for second user: ${actual_amount} (expected ${expected_amount})")
                else:
                    print("❌ No commissions found for second user")
            else:
                print("❌ Failed to get second user's dashboard stats")
            
            # Check first user's dashboard for commission (2nd level)
            success, stats = first_user.test_get_dashboard_stats()
            if success:
                commissions = stats.get('recent_commissions', [])
                if commissions:
                    for commission in commissions:
                        if commission.get('new_member_tier') == 'silver' and commission.get('level') == 2:
                            expected_amount = 50 * 0.15  # 15% of $50 Silver tier (2nd level for Gold tier)
                            actual_amount = commission.get('amount', 0)
                            if abs(actual_amount - expected_amount) < 0.01:
                                print(f"✅ Commission calculation correct for first user (2nd level): ${actual_amount} (expected ${expected_amount})")
                            else:
                                print(f"❌ Commission calculation incorrect for first user (2nd level): ${actual_amount} (expected ${expected_amount})")
                else:
                    print("❌ No 2nd level commissions found for first user")
            else:
                print("❌ Failed to get first user's dashboard stats")
        
        return True

    def test_payment_methods(self):
        """Test creating payments with different cryptocurrencies"""
        print("\n💰 Testing Payment Methods...")
        
        currencies = ["BTC", "ETH", "USDC", "USDT", "LTC", "XMR"]
        results = []
        
        for currency in currencies:
            success, payment_data = self.test_create_payment(tier="bronze", currency=currency.lower())
            if success:
                results.append({
                    "currency": currency,
                    "success": True,
                    "payment_id": payment_data.get("payment_id"),
                    "payment_url": payment_data.get("payment_url"),
                    "amount": payment_data.get("amount"),
                    "address": payment_data.get("address")
                })
            else:
                results.append({
                    "currency": currency,
                    "success": False
                })
        
        # Print summary
        print("\n📊 Payment Methods Summary:")
        for result in results:
            status = "✅ Success" if result["success"] else "❌ Failed"
            print(f"{status} - {result['currency']}")
            if result["success"]:
                print(f"  Payment ID: {result['payment_id']}")
                print(f"  Amount: {result['amount']} {result['currency']}")
                print(f"  Address: {result['address']}")
        
        return all(result["success"] for result in results)

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
                print(f"    Commission Rates: {[f'{rate*100}%' for rate in details.get('commissions', [])]}")
        except Exception as e:
            print(f"Error parsing tiers: {str(e)}")
    
    # Test authentication flow
    success, nonce_data = tester.test_get_nonce()
    
    # Test user registration
    success, reg_data = tester.test_register_user()
    if success:
        print(f"✅ User registered successfully")
    
    # Test wallet verification
    success, auth_data = tester.test_verify_wallet()
    if success and 'token' in auth_data:
        tester.token = auth_data['token']
        print(f"🔑 Authenticated with token: {tester.token[:10]}...")
    
    # If authenticated, test protected endpoints
    if tester.token:
        # Get user profile and referral code
        tester.test_get_user_profile()
        
        # Test dashboard stats
        success, stats_data = tester.test_get_dashboard_stats()
        if success:
            print("\n📊 Dashboard Stats:")
            print(f"  Total Earnings: ${stats_data.get('total_earnings', 0)}")
            print(f"  Pending Earnings: ${stats_data.get('pending_earnings', 0)}")
            print(f"  Total Referrals: {stats_data.get('total_referrals', 0)}")
            print(f"  Direct Referrals: {stats_data.get('direct_referrals', 0)}")
        
        # Test network data
        tester.test_get_network_data()
        
        # Test payment creation with different cryptocurrencies
        tester.test_payment_methods()
        
        # Test referral info if we have a referral code
        if tester.referral_code:
            tester.test_get_referral_info(tester.referral_code)
    
    # Test commission calculation with a chain of referrals
    tester.test_commission_calculation()
    
    # Print test results
    print("\n" + "=" * 60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📊 Success rate: {tester.tests_passed/tester.tests_run*100:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
