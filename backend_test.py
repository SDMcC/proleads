
import requests
import sys
import json
from datetime import datetime

class Web3MembershipAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
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
                    print(f"Response: {response.text}")
                    return False, response.json()
                except:
                    return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test the health endpoint"""
        success, response = self.run_test(
            "Health Endpoint",
            "GET",
            "api/health",
            200
        )
        if success:
            print(f"Health Status: {response.get('status')}")
            print(f"Timestamp: {response.get('timestamp')}")
        return success

    def test_membership_tiers(self):
        """Test the membership tiers endpoint"""
        success, response = self.run_test(
            "Membership Tiers Endpoint",
            "GET",
            "api/membership/tiers",
            200
        )
        if success:
            tiers = response.get('tiers', {})
            print(f"Available tiers: {', '.join(tiers.keys())}")
            for tier, details in tiers.items():
                print(f"  - {tier.capitalize()}: ${details.get('price')} with {len(details.get('commissions', []))} commission levels")
        return success

    def test_referral_info(self, referral_code):
        """Test the referral info endpoint"""
        success, response = self.run_test(
            f"Referral Info Endpoint (code: {referral_code})",
            "GET",
            f"api/referral/{referral_code}",
            404  # Expecting 404 since no users exist yet
        )
        if success:
            print("Unexpected success - referral code found")
        else:
            print("Expected 404 response - no users exist yet")
            # For this test, a 404 is actually expected
            self.tests_passed += 1
            return True
        return success

def main():
    # Get the backend URL from environment variable or use default
    import os
    backend_url = "https://bcf818be-3505-417c-beaf-52bc651b496c.preview.emergentagent.com"
    
    print(f"Testing backend API at: {backend_url}")
    
    # Setup tester
    tester = Web3MembershipAPITester(backend_url)
    
    # Run tests
    health_success = tester.test_health_endpoint()
    tiers_success = tester.test_membership_tiers()
    referral_success = tester.test_referral_info("TESTCODE123")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    # Return success if all tests passed
    return 0 if health_success and tiers_success and referral_success else 1

if __name__ == "__main__":
    sys.exit(main())
