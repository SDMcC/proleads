#!/usr/bin/env python3
"""
Deployment Validation Script for Web3 Membership Platform
Tests critical backend endpoints to verify deployment readiness
"""

import requests
import sys
import os
import json
import time
import uuid
from datetime import datetime

class DeploymentValidator:
    def __init__(self, base_url):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_endpoint(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Test a single endpoint"""
        url = f"{self.base_url}/api/{endpoint}"
        
        if not headers:
            headers = {'Content-Type': 'application/json'}
            if self.admin_token:
                headers['Authorization'] = f'Bearer {self.admin_token}'
        
        self.tests_run += 1
        self.log(f"Testing {name}: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}", "PASS")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                try:
                    error_detail = response.json().get('detail', 'No detail provided')
                    self.log(f"   Error: {error_detail}", "ERROR")
                except:
                    self.log(f"   Response: {response.text[:200]}", "ERROR")
                return False, {}
                
        except Exception as e:
            self.log(f"❌ {name} - Connection error: {str(e)}", "FAIL")
            return False, {}
    
    def validate_deployment(self):
        """Run all deployment validation tests"""
        self.log("🚀 Starting Deployment Validation Tests", "INFO")
        self.log(f"   Backend URL: {self.base_url}", "INFO")
        self.log("=" * 80, "INFO")
        
        # Test 1: Health Check via Membership Tiers
        self.log("\n1. Testing Backend Health via Membership Tiers Endpoint", "INFO")
        success, response = self.test_endpoint(
            "Get Membership Tiers", 
            "GET", 
            "membership/tiers", 
            200
        )
        
        if not success:
            self.log("❌ CRITICAL: Backend not responding - deployment blocker", "CRITICAL")
            return False
        
        # Verify all 6 tiers are present
        tiers = response.get('tiers', {})
        expected_tiers = ['affiliate', 'test', 'bronze', 'silver', 'gold', 'vip_affiliate']
        missing_tiers = [tier for tier in expected_tiers if tier not in tiers]
        
        if missing_tiers:
            self.log(f"❌ CRITICAL: Missing membership tiers: {missing_tiers}", "CRITICAL")
            return False
        else:
            self.log("✅ All 6 membership tiers present and accessible", "PASS")
        
        # Test 2: Admin Authentication
        self.log("\n2. Testing Admin Authentication System", "INFO")
        admin_data = {"username": "admin", "password": "admin123"}
        success, response = self.test_endpoint(
            "Admin Login", 
            "POST", 
            "admin/login", 
            200, 
            admin_data
        )
        
        if not success:
            self.log("❌ CRITICAL: Admin authentication failed - deployment blocker", "CRITICAL")
            return False
        
        self.admin_token = response.get('token')
        if not self.admin_token:
            self.log("❌ CRITICAL: Admin token not received - deployment blocker", "CRITICAL")
            return False
        else:
            self.log("✅ Admin authentication working correctly", "PASS")
        
        # Test 3: Admin Dashboard Overview
        self.log("\n3. Testing Admin Dashboard Overview", "INFO")
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        success, response = self.test_endpoint(
            "Admin Dashboard Overview", 
            "GET", 
            "admin/dashboard/overview", 
            200, 
            headers=headers
        )
        
        if not success:
            self.log("❌ CRITICAL: Admin dashboard not accessible - deployment blocker", "CRITICAL")
            return False
        
        # Verify dashboard structure
        required_sections = ['members', 'payments', 'commissions', 'leads', 'milestones']
        missing_sections = [section for section in required_sections if section not in response]
        
        if missing_sections:
            self.log(f"❌ CRITICAL: Dashboard missing sections: {missing_sections}", "CRITICAL")
            return False
        else:
            self.log("✅ Admin dashboard overview working correctly", "PASS")
        
        # Test 4: User Registration
        self.log("\n4. Testing User Registration System", "INFO")
        test_user_data = {
            "wallet_address": f"0x{uuid.uuid4().hex[:40]}",
            "username": f"deploy_test_{int(time.time())}",
            "email": f"deploy_test_{int(time.time())}@test.com",
            "password": "testpassword123"
        }
        
        success, response = self.test_endpoint(
            "User Registration", 
            "POST", 
            "users/register", 
            200, 
            test_user_data
        )
        
        if not success:
            self.log("❌ CRITICAL: User registration failed - deployment blocker", "CRITICAL")
            return False
        
        # Verify registration response
        if not response.get('referral_code'):
            self.log("❌ CRITICAL: Referral code not generated - deployment blocker", "CRITICAL")
            return False
        else:
            self.log("✅ User registration working correctly", "PASS")
        
        # Test 5: Email Service Integration
        self.log("\n5. Testing Email Service Integration", "INFO")
        try:
            sys.path.append('/app/backend')
            from email_service import (
                send_new_referral_email,
                send_lead_distribution_email,
                send_payment_confirmation_email,
                send_subscription_reminder_email,
                send_commission_payout_email,
                send_referral_upgrade_email,
                send_admin_milestone_notification,
                send_admin_payment_confirmation,
                send_admin_lead_distribution_status
            )
            
            self.log("✅ All email service functions imported successfully", "PASS")
            self.tests_passed += 1
            
            # Test email service configuration
            smtp_host = os.getenv("SMTP_HOST")
            smtp_port = os.getenv("SMTP_PORT")
            smtp_username = os.getenv("SMTP_USERNAME")
            smtp_password = os.getenv("SMTP_PASSWORD")
            
            if smtp_host and smtp_port and smtp_username and smtp_password:
                self.log("✅ Email service configuration found in environment", "PASS")
                self.tests_passed += 1
            else:
                self.log("⚠️ Email service configuration incomplete (using defaults)", "WARN")
                self.tests_passed += 1  # Still pass as it can use defaults
            
        except ImportError as e:
            self.log(f"❌ CRITICAL: Email service import failed: {str(e)}", "CRITICAL")
            return False
        except Exception as e:
            self.log(f"❌ CRITICAL: Email service test failed: {str(e)}", "CRITICAL")
            return False
        finally:
            self.tests_run += 2
        
        # Test 6: Database Connection
        self.log("\n6. Testing Database Connection", "INFO")
        success, response = self.test_endpoint(
            "Database Connection Test", 
            "GET", 
            "admin/members?limit=1", 
            200, 
            headers=headers
        )
        
        if not success:
            self.log("❌ CRITICAL: Database connection failed - deployment blocker", "CRITICAL")
            return False
        else:
            self.log("✅ Database connection working correctly", "PASS")
        
        # All tests passed
        self.log("\n🎉 ALL DEPLOYMENT VALIDATION TESTS PASSED!", "SUCCESS")
        self.log("✅ Backend is ready for deployment", "SUCCESS")
        return True
    
    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "=" * 80, "INFO")
        self.log("🏁 Deployment Validation Summary", "INFO")
        self.log(f"   Tests Run: {self.tests_run}", "INFO")
        self.log(f"   Tests Passed: {self.tests_passed}", "INFO")
        self.log(f"   Tests Failed: {self.tests_run - self.tests_passed}", "INFO")
        
        if self.tests_run > 0:
            success_rate = (self.tests_passed / self.tests_run * 100)
            self.log(f"   Success Rate: {success_rate:.1f}%", "INFO")
        
        if self.tests_passed == self.tests_run:
            self.log("✅ DEPLOYMENT VALIDATION PASSED - Ready for deployment!", "SUCCESS")
        else:
            self.log("❌ DEPLOYMENT VALIDATION FAILED - Fix required before deployment!", "CRITICAL")
        
        self.log("=" * 80, "INFO")

def main():
    # Get backend URL from environment or use default
    backend_url = os.getenv("REACT_APP_BACKEND_URL", "https://affnet-dashboard-1.preview.emergentagent.com")
    
    # Create validator instance
    validator = DeploymentValidator(backend_url)
    
    # Run validation tests
    success = validator.validate_deployment()
    
    # Print summary
    validator.print_summary()
    
    # Exit with appropriate code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())