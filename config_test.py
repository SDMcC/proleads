import requests
import sys
import json
import time
from datetime import datetime
import uuid

class AdminConfigTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        if not headers:
            headers = {'Content-Type': 'application/json'}
            if self.admin_token:
                headers['Authorization'] = f'Bearer {self.admin_token}'
        
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
                    print(f"   Response: {json.dumps(response_data)[:200]}...")
                    return success, response_data
                except:
                    print(f"   Response: {response.text[:200]}...")
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'No detail provided')
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        data = {
            "username": "admin",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login (Success)", "POST", "admin/login", 200, data)
        
        if success and response.get('token'):
            self.admin_token = response.get('token')
            # Verify token contains admin role
            if response.get('role') == 'admin' and response.get('username') == 'admin':
                print("✅ Admin token contains correct role and username")
                return True, response
            else:
                print("❌ Admin token missing role or username")
                return False, {}
        return success, response
    
    def test_get_system_config_success(self):
        """Test GET /api/admin/config/system with admin token"""
        if not self.admin_token:
            print("⚠️ No admin token available, running admin login first")
            login_success, _ = self.test_admin_login_success()
            if not login_success:
                print("❌ Failed to get admin token")
                return False, {}
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        success, response = self.run_test("Get System Config (Success)", "GET", "admin/config/system", 200, headers=headers)
        
        if success:
            # Verify response structure
            required_keys = ['config', 'current_membership_tiers']
            missing_keys = [key for key in required_keys if key not in response]
            
            if not missing_keys:
                print("✅ System config contains all required sections")
                
                # Verify config structure
                config = response.get('config', {})
                if 'membership_tiers' in config and 'payment_processors' in config:
                    print("✅ Config contains membership tiers and payment processors")
                    
                    # Verify sensitive data is hidden
                    payment_processors = config.get('payment_processors', {})
                    for processor_name, processor_config in payment_processors.items():
                        if processor_config.get('api_key') == '***HIDDEN***':
                            print("✅ Sensitive API key data is properly hidden")
                        if processor_config.get('ipn_secret') == '***HIDDEN***':
                            print("✅ Sensitive IPN secret data is properly hidden")
                    
                    return True, response
                else:
                    print("❌ Config missing required sections")
                    return False, {}
            else:
                print(f"❌ System config missing required keys: {missing_keys}")
                return False, {}
        
        return success, response
    
    def test_get_system_config_unauthorized(self):
        """Test GET /api/admin/config/system without admin token"""
        headers = {'Content-Type': 'application/json'}
        success, response = self.run_test("Get System Config (Unauthorized)", "GET", "admin/config/system", 401, headers=headers)
        return success, response
    
    def test_update_membership_tiers_success(self):
        """Test PUT /api/admin/config/membership-tiers with valid data"""
        if not self.admin_token:
            print("⚠️ No admin token available, running admin login first")
            login_success, _ = self.test_admin_login_success()
            if not login_success:
                print("❌ Failed to get admin token")
                return False, {}
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Test data with updated tier configuration
        update_data = {
            "bronze": {
                "tier_name": "bronze",
                "price": 25.0,  # Updated price
                "commissions": [0.30, 0.10, 0.05, 0.02],  # Updated commissions
                "enabled": True,
                "description": "Updated Bronze membership tier"
            },
            "silver": {
                "tier_name": "silver",
                "price": 60.0,  # Updated price
                "commissions": [0.35, 0.15, 0.08, 0.04],  # Updated commissions
                "enabled": True,
                "description": "Updated Silver membership tier"
            }
        }
        
        success, response = self.run_test("Update Membership Tiers (Success)", "PUT", "admin/config/membership-tiers", 200, update_data, headers)
        
        if success:
            if response.get('message') and 'successfully' in response.get('message', '').lower():
                print("✅ Membership tiers update successful")
                
                # Verify the updated tiers are returned
                updated_tiers = response.get('updated_tiers', {})
                if 'bronze' in updated_tiers and updated_tiers['bronze']['price'] == 25.0:
                    print("✅ Bronze tier price updated correctly")
                if 'silver' in updated_tiers and updated_tiers['silver']['price'] == 60.0:
                    print("✅ Silver tier price updated correctly")
                
                return True, response
            else:
                print("❌ Update response doesn't contain success message")
                return False, {}
        
        return success, response
    
    def test_update_membership_tiers_invalid_price(self):
        """Test PUT /api/admin/config/membership-tiers with invalid price"""
        if not self.admin_token:
            print("⚠️ No admin token available, running admin login first")
            login_success, _ = self.test_admin_login_success()
            if not login_success:
                print("❌ Failed to get admin token")
                return False, {}
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Test data with invalid negative price
        update_data = {
            "bronze": {
                "tier_name": "bronze",
                "price": -10.0,  # Invalid negative price
                "commissions": [0.25, 0.05, 0.03, 0.02],
                "enabled": True,
                "description": "Bronze membership tier"
            }
        }
        
        success, response = self.run_test("Update Membership Tiers (Invalid Price)", "PUT", "admin/config/membership-tiers", 400, update_data, headers)
        return success, response
    
    def test_update_membership_tiers_invalid_commission(self):
        """Test PUT /api/admin/config/membership-tiers with invalid commission rates"""
        if not self.admin_token:
            print("⚠️ No admin token available, running admin login first")
            login_success, _ = self.test_admin_login_success()
            if not login_success:
                print("❌ Failed to get admin token")
                return False, {}
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Test data with invalid commission rate > 1
        update_data = {
            "bronze": {
                "tier_name": "bronze",
                "price": 20.0,
                "commissions": [1.5, 0.05, 0.03, 0.02],  # Invalid commission > 1
                "enabled": True,
                "description": "Bronze membership tier"
            }
        }
        
        success, response = self.run_test("Update Membership Tiers (Invalid Commission)", "PUT", "admin/config/membership-tiers", 400, update_data, headers)
        return success, response
    
    def test_update_membership_tiers_unauthorized(self):
        """Test PUT /api/admin/config/membership-tiers without admin token"""
        headers = {'Content-Type': 'application/json'}
        update_data = {
            "bronze": {
                "tier_name": "bronze",
                "price": 20.0,
                "commissions": [0.25, 0.05, 0.03, 0.02],
                "enabled": True,
                "description": "Bronze membership tier"
            }
        }
        
        success, response = self.run_test("Update Membership Tiers (Unauthorized)", "PUT", "admin/config/membership-tiers", 401, update_data, headers)
        return success, response
    
    def test_update_payment_processors_success(self):
        """Test PUT /api/admin/config/payment-processors with valid data"""
        if not self.admin_token:
            print("⚠️ No admin token available, running admin login first")
            login_success, _ = self.test_admin_login_success()
            if not login_success:
                print("❌ Failed to get admin token")
                return False, {}
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        # Test data with updated payment processor configuration
        update_data = {
            "nowpayments": {
                "processor_name": "nowpayments",
                "api_key": "updated_test_api_key",
                "public_key": "updated_test_public_key",
                "ipn_secret": "updated_test_ipn_secret",
                "enabled": True,
                "supported_currencies": ["BTC", "ETH", "USDC", "USDT", "LTC", "ADA"]
            },
            "atlos": {
                "processor_name": "atlos",
                "api_key": "atlos_test_api_key",
                "public_key": "atlos_test_public_key",
                "ipn_secret": "atlos_test_ipn_secret",
                "enabled": False,
                "supported_currencies": ["BTC", "ETH"]
            }
        }
        
        success, response = self.run_test("Update Payment Processors (Success)", "PUT", "admin/config/payment-processors", 200, update_data, headers)
        
        if success:
            if response.get('message') and 'successfully' in response.get('message', '').lower():
                print("✅ Payment processors update successful")
                
                # Verify the updated processors are returned
                processors = response.get('processors', {})
                if 'nowpayments' in processors and processors['nowpayments']['api_key'] == 'updated_test_api_key':
                    print("✅ NOWPayments processor updated correctly")
                if 'atlos' in processors and processors['atlos']['enabled'] == False:
                    print("✅ Atlos processor disabled correctly")
                
                return True, response
            else:
                print("❌ Update response doesn't contain success message")
                return False, {}
        
        return success, response
    
    def test_update_payment_processors_unauthorized(self):
        """Test PUT /api/admin/config/payment-processors without admin token"""
        headers = {'Content-Type': 'application/json'}
        update_data = {
            "nowpayments": {
                "processor_name": "nowpayments",
                "api_key": "test_api_key",
                "public_key": "test_public_key",
                "ipn_secret": "test_ipn_secret",
                "enabled": True,
                "supported_currencies": ["BTC", "ETH"]
            }
        }
        
        success, response = self.run_test("Update Payment Processors (Unauthorized)", "PUT", "admin/config/payment-processors", 401, update_data, headers)
        return success, response
    
    def test_reset_config_to_defaults_success(self):
        """Test POST /api/admin/config/reset-to-defaults with admin token"""
        if not self.admin_token:
            print("⚠️ No admin token available, running admin login first")
            login_success, _ = self.test_admin_login_success()
            if not login_success:
                print("❌ Failed to get admin token")
                return False, {}
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        success, response = self.run_test("Reset Config to Defaults (Success)", "POST", "admin/config/reset-to-defaults", 200, headers=headers)
        
        if success:
            if response.get('message') and 'successfully' in response.get('message', '').lower():
                print("✅ Configuration reset successful")
                
                # Verify default tiers are returned
                default_tiers = response.get('default_tiers', {})
                expected_tiers = ['affiliate', 'bronze', 'silver', 'gold']
                
                for tier in expected_tiers:
                    if tier in default_tiers:
                        print(f"✅ Default {tier} tier restored")
                    else:
                        print(f"❌ Default {tier} tier missing")
                        return False, {}
                
                return True, response
            else:
                print("❌ Reset response doesn't contain success message")
                return False, {}
        
        return success, response
    
    def test_reset_config_to_defaults_unauthorized(self):
        """Test POST /api/admin/config/reset-to-defaults without admin token"""
        headers = {'Content-Type': 'application/json'}
        success, response = self.run_test("Reset Config to Defaults (Unauthorized)", "POST", "admin/config/reset-to-defaults", 401, headers=headers)
        return success, response
    
    def test_admin_configuration_system(self):
        """Test complete Admin Configuration Management System"""
        print("\n⚙️ Testing Admin Configuration Management System")
        
        # 1. Test admin login first
        login_success, _ = self.test_admin_login_success()
        if not login_success:
            print("❌ Admin login failed - cannot test configuration management")
            return False
        
        # 2. Test get system configuration with admin token
        config_success, config_response = self.test_get_system_config_success()
        if not config_success:
            print("❌ Get system configuration with admin token failed")
            return False
        
        # 3. Test get system configuration without admin token (should fail)
        config_unauth_success, _ = self.test_get_system_config_unauthorized()
        if not config_unauth_success:
            print("❌ Get system configuration without admin token should return 401")
            return False
        
        # 4. Test update membership tiers with valid data
        update_tiers_success, _ = self.test_update_membership_tiers_success()
        if not update_tiers_success:
            print("❌ Update membership tiers with valid data failed")
            return False
        
        # 5. Test update membership tiers with invalid price
        invalid_price_success, _ = self.test_update_membership_tiers_invalid_price()
        if not invalid_price_success:
            print("❌ Update membership tiers with invalid price should return 400")
            return False
        
        # 6. Test update membership tiers with invalid commission rates
        invalid_commission_success, _ = self.test_update_membership_tiers_invalid_commission()
        if not invalid_commission_success:
            print("❌ Update membership tiers with invalid commission should return 400")
            return False
        
        # 7. Test update membership tiers without admin token
        tiers_unauth_success, _ = self.test_update_membership_tiers_unauthorized()
        if not tiers_unauth_success:
            print("❌ Update membership tiers without admin token should return 401")
            return False
        
        # 8. Test update payment processors with valid data
        update_processors_success, _ = self.test_update_payment_processors_success()
        if not update_processors_success:
            print("❌ Update payment processors with valid data failed")
            return False
        
        # 9. Test update payment processors without admin token
        processors_unauth_success, _ = self.test_update_payment_processors_unauthorized()
        if not processors_unauth_success:
            print("❌ Update payment processors without admin token should return 401")
            return False
        
        # 10. Test reset configuration to defaults
        reset_success, _ = self.test_reset_config_to_defaults_success()
        if not reset_success:
            print("❌ Reset configuration to defaults failed")
            return False
        
        # 11. Test reset configuration without admin token
        reset_unauth_success, _ = self.test_reset_config_to_defaults_unauthorized()
        if not reset_unauth_success:
            print("❌ Reset configuration without admin token should return 401")
            return False
        
        # 12. Verify configuration is properly loaded after reset
        final_config_success, final_config_response = self.test_get_system_config_success()
        if not final_config_success:
            print("❌ Get system configuration after reset failed")
            return False
        
        # Verify that configuration was actually reset to defaults
        current_tiers = final_config_response.get('current_membership_tiers', {})
        if 'bronze' in current_tiers and current_tiers['bronze']['price'] == 20:
            print("✅ Configuration properly reset to default bronze price ($20)")
        else:
            print("❌ Configuration not properly reset to defaults")
            return False
        
        print("✅ Admin Configuration Management System Test Passed")
        return True


if __name__ == "__main__":
    # Get backend URL from environment or use default
    backend_url = "https://proleads-hub.preview.emergentagent.com"
    
    # Create tester instance
    tester = AdminConfigTester(backend_url)
    
    # Run configuration tests
    print("🚀 Starting Admin Configuration Management System Tests")
    print("=" * 80)
    
    success = tester.test_admin_configuration_system()
    
    # Final results
    print("\n" + "=" * 80)
    print("🏁 ADMIN CONFIGURATION TEST RESULTS")
    print("=" * 80)
    print(f"Total Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if success:
        print("🎉 ALL ADMIN CONFIGURATION TESTS PASSED!")
    else:
        print("⚠️ Some admin configuration tests failed.")
    
    # Exit with appropriate code
    exit(0 if success else 1)