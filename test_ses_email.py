#!/usr/bin/env python3
"""
Test script to verify Amazon SES email configuration
Sends a test email to confirm SMTP settings are working
"""

import asyncio
import sys
import os
sys.path.append('/app/backend')

from email_service import send_email

async def test_ses_email():
    """Send a test email to verify SES configuration"""
    
    test_email = "proleadsnetwork@gmail.com"
    subject = "🎉 Proleads Network - Amazon SES Email Test"
    body = """Hello!

This is a test email from your Proleads Network application.

If you're reading this, your Amazon SES configuration is working perfectly! ✅

Email Details:
- SMTP Provider: Amazon SES
- Region: eu-north-1
- From: proleadsnetwork@gmail.com
- Status: Successfully configured and operational

Your production email system is now ready to send:
✉️ New referral notifications
✉️ Payment confirmations
✉️ Lead distribution alerts
✉️ Commission payout notifications
✉️ Subscription reminders
✉️ Account notifications

Best regards,
Proleads Network Team

---
This is an automated test email from Proleads Network
https://proleads.network
"""
    
    print("=" * 60)
    print("Testing Amazon SES Email Configuration")
    print("=" * 60)
    print(f"\nSending test email to: {test_email}")
    print(f"Subject: {subject}")
    print("\nAttempting to send...")
    
    try:
        result = await send_email(
            to_email=test_email,
            subject=subject,
            body=body,
            notification_type="system_test",
            store_in_history=False  # Don't store test emails in history
        )
        
        if result:
            print("\n" + "=" * 60)
            print("✅ SUCCESS! Email sent successfully via Amazon SES")
            print("=" * 60)
            print(f"\nPlease check your inbox at: {test_email}")
            print("\nIf you don't see it:")
            print("1. Check your spam/junk folder")
            print("2. Wait a few minutes for delivery")
            print("3. Verify the email address is correct")
            print("\nYour production email system is now fully operational! 🚀")
            return True
        else:
            print("\n" + "=" * 60)
            print("❌ FAILED: Email was not sent")
            print("=" * 60)
            print("\nPossible issues:")
            print("1. SMTP credentials may be incorrect")
            print("2. Sender email may not be verified in AWS SES")
            print("3. AWS SES may still be in sandbox mode")
            print("4. Network/firewall issues")
            print("\nCheck backend logs for more details:")
            print("tail -n 50 /var/log/supervisor/backend.err.log")
            return False
            
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ ERROR: Exception occurred while sending email")
        print("=" * 60)
        print(f"\nError message: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Verify SMTP credentials in /app/backend/.env")
        print("2. Check that sender email is verified in AWS SES")
        print("3. Ensure AWS SES is not in sandbox mode (or recipient is verified)")
        print("4. Check backend error logs for detailed information")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_ses_email())
    sys.exit(0 if result else 1)
