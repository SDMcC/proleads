import requests
import sys
import json
from datetime import datetime

class Web3MembershipAPITester:
    def __init__(self, base_url="https://affiliate-hub-80.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

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

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_membership_tiers(self):
        """Test membership tiers endpoint"""
        success, response = self.run_test("Get Membership Tiers", "GET", "membership/tiers", 200)
        
        if success:
            tiers = response.get("tiers", {})
            
            # Verify tier prices
            if tiers.get("affiliate", {}).get("price") != 0:
                print("❌ Affiliate tier price should be 0")
                return False
                
            if tiers.get("bronze", {}).get("price") != 20:
                print("❌ Bronze tier price should be 20")
                return False
                
            if tiers.get("silver", {}).get("price") != 50:
                print("❌ Silver tier price should be 50")
                return False
                
            if tiers.get("gold", {}).get("price") != 100:
                print("❌ Gold tier price should be 100")
                return False
            
            # Verify commission rates
            bronze_commissions = tiers.get("bronze", {}).get("commissions", [])
            if bronze_commissions != [0.25, 0.05, 0.03, 0.02]:
                print(f"❌ Bronze tier commissions don't match expected values: {bronze_commissions}")
                return False
                
            silver_commissions = tiers.get("silver", {}).get("commissions", [])
            if silver_commissions != [0.27, 0.1, 0.05, 0.03]:
                print(f"❌ Silver tier commissions don't match expected values: {silver_commissions}")
                return False
                
            gold_commissions = tiers.get("gold", {}).get("commissions", [])
            if gold_commissions != [0.3, 0.15, 0.1, 0.05]:
                print(f"❌ Gold tier commissions don't match expected values: {gold_commissions}")
                return False
                
            print("✅ All tier prices and commission rates match expected values")
            return True
            
        return False

    def test_user_registration(self):
        """Test user registration endpoint"""
        timestamp = int(datetime.utcnow().timestamp())
        user_address = f"0x{timestamp}abcdef1234567890"
        username = f"test_user_{timestamp}"
        email = f"{username}@test.com"
        
        success, response = self.run_test(
            "Register User",
            "POST",
            "users/register",
            200,
            data={"address": user_address, "username": username, "email": email}
        )
        
        if success and "referral_code" in response:
            print(f"✅ User registration successful with referral code: {response['referral_code']}")
            return True
        return False

def main():
    print("🚀 Starting Web3 Membership Platform API Tests")
    print("=============================")
    
    tester = Web3MembershipAPITester()
    
    # Test health check
    tester.test_health_check()
    
    # Test membership tiers
    tester.test_membership_tiers()
    
    # Test user registration
    tester.test_user_registration()
    
    # Print results
    print("\n=============================")
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📊 Success rate: {(tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())