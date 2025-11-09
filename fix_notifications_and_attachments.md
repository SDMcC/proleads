# Bugs to Fix

## 1. Ticket Attachments - "Failed to open attachment"
- Issue: The attachment URLs work but might be malformed
- Solution: Ensure URLs are constructed correctly in frontend

## 2. Notification Bell Icon - Not showing notifications  
- Issue: Bell icon doesn't display notification count/list
- Solution: Add notification fetching and display logic to header

## 3. Missing Email Notifications:
a. Ticket replies
b. New referrals  
c. Lead distribution

## 4. Wrong URL in email notifications
- Issue: Using `https://instant-payout-sys.preview.emergentagent.com`
- Should be: `https://proleads.network`
- Solution: Replace hardcoded URL with environment variable or production URL

Let me fix each issue systematically.
