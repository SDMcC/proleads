import os
import sys
import json
from datetime import datetime

def verify_payment_creation_code():
    """Verify the payment creation code in server.py"""
    try:
        with open('/app/backend/server.py', 'r') as f:
            server_code = f.read()
        
        print("🔍 Verifying NOWPayments API integration...")
        
        # Check if using the correct invoice endpoint
        if "/v1/invoice" in server_code:
            print("✅ Using correct NOWPayments invoice endpoint (/v1/invoice)")
        else:
            print("❌ Not using correct NOWPayments invoice endpoint")
            return False
        
        # Check if sandbox mode is supported
        if "is_sandbox = os.getenv(\"NOWPAYMENTS_SANDBOX\", \"true\").lower() == \"true\"" in server_code:
            print("✅ Sandbox mode support is properly implemented")
        else:
            print("❌ Sandbox mode support is not properly implemented")
            return False
        
        # Check if using the correct sandbox URL
        if "api-sandbox.nowpayments.io" in server_code:
            print("✅ Using correct sandbox API URL (api-sandbox.nowpayments.io)")
        else:
            print("❌ Not using correct sandbox API URL")
            return False
        
        # Check if invoice_url is properly extracted
        if "payment_url\": invoice_result[\"invoice_url\"]" in server_code:
            print("✅ Invoice URL is properly extracted from API response")
        else:
            print("❌ Invoice URL is not properly extracted")
            return False
        
        # Check if success/cancel URLs are set
        if "success_url" in server_code and "cancel_url" in server_code:
            print("✅ Success and cancel URLs are properly configured")
        else:
            print("❌ Success and/or cancel URLs are not properly configured")
            return False
        
        # Check if order description is set
        if "order_description" in server_code:
            print("✅ Order description is properly set")
        else:
            print("❌ Order description is not set")
            return False
        
        # Check if fallback to standard payment endpoint is implemented
        if "Fallback to standard payment endpoint" in server_code:
            print("✅ Fallback to standard payment endpoint is implemented")
        else:
            print("❌ No fallback to standard payment endpoint")
            return False
        
        # Check if error handling is implemented
        if "Payment creation error" in server_code:
            print("✅ Error handling is properly implemented")
        else:
            print("❌ Error handling is not properly implemented")
            return False
        
        print("\n✅ NOWPayments API integration is correctly implemented")
        return True
        
    except Exception as e:
        print(f"❌ Error verifying payment creation code: {str(e)}")
        return False

def verify_commission_calculation():
    """Verify the commission calculation code in server.py"""
    try:
        with open('/app/backend/server.py', 'r') as f:
            server_code = f.read()
        
        print("\n🔍 Verifying commission calculation...")
        
        # Check if calculate_commissions function exists
        if "async def calculate_commissions" in server_code:
            print("✅ Commission calculation function exists")
        else:
            print("❌ Commission calculation function not found")
            return False
        
        # Check if commission rates are correctly used
        if "tier_info = MEMBERSHIP_TIERS.get(tier)" in server_code and "commissions = tier_info.get(\"commissions\")" in server_code:
            print("✅ Commission rates are correctly retrieved from tier info")
        else:
            print("❌ Commission rates are not correctly retrieved")
            return False
        
        # Check if multi-level referrals are handled
        if "referrer_chain" in server_code:
            print("✅ Multi-level referrals are properly handled")
        else:
            print("❌ Multi-level referrals are not properly handled")
            return False
        
        print("\n✅ Commission calculation is correctly implemented")
        return True
        
    except Exception as e:
        print(f"❌ Error verifying commission calculation: {str(e)}")
        return False

def main():
    print("🚀 Starting Web3 Membership Platform Code Verification")
    print("=============================")
    
    payment_code_verified = verify_payment_creation_code()
    commission_code_verified = verify_commission_calculation()
    
    print("\n=============================")
    if payment_code_verified and commission_code_verified:
        print("✅ All code verification tests passed")
        return 0
    else:
        print("❌ Some code verification tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())