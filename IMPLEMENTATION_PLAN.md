# Email Notifications & Nowpayments Testing Implementation Plan

## Current Status

### ✅ Already Implemented & Tested Email Notifications:
1. **New Referral** - Triggered when someone signs up with referral link
2. **Admin Ticket Alert** - Triggered when new support ticket is created
3. **Lead Distribution** - Triggered when leads are distributed to users
4. **Admin Lead Distribution Summary** - Triggered for admin on distribution status

### 📧 Email Notifications to Test (Already Coded):

#### 1. **Admin New Payment Received** ✅ READY
- **Function**: `send_admin_payment_confirmation(username, tier, amount)`
- **Location**: email_service.py:247-266
- **Trigger**: server.py:1746 (payment callback when status="confirmed")
- **Status**: Fully implemented, needs real payment test

#### 2. **User Payment Confirmation** ✅ READY
- **Function**: `send_payment_confirmation_email(to_email, username, tier, amount)`
- **Location**: email_service.py:148-166
- **Trigger**: server.py:1715 (payment callback when status="confirmed")
- **Status**: Fully implemented, needs real payment test

#### 3. **Referral Upgrade** ✅ READY
- **Function**: `send_referral_upgrade_email(to_email, referrer_name, referral_username, new_tier)`
- **Location**: email_service.py:207-222
- **Trigger**: server.py:1727 (payment callback, sent to sponsor when referral upgrades)
- **Status**: Fully implemented, needs real payment test

#### 4. **Commission Payout** ✅ READY
- **Function**: `send_commission_payout_email(to_email, username, amount, milestone_count)`
- **Location**: email_service.py:185-205
- **Trigger**: server.py:2920 (when admin marks milestone as paid)
- **Status**: Fully implemented, needs milestone payout test

## Nowpayments Integration Status

### ✅ Current Configuration:
- **API Key**: 8JJE581-M114F76-KFDGX3D-4SS17FP
- **IPN Secret**: 79kXvk7JRdLflmF5ElPH7m4rS01qUX9P
- **Sandbox Mode**: false (Production)
- **Payment Callback**: `/api/payments/callback` (server.py:1653)
- **Payout Callback**: `/api/payout-callback` (server.py:1767)

### 🔧 Required Webhook URL Configuration:
**URL to configure in Nowpayments Dashboard:**
```
https://affiliate-hub-137.preview.emergentagent.com/api/payments/callback
```

**For commission payouts:**
```
https://affiliate-hub-137.preview.emergentagent.com/api/payout-callback
```

### ⚠️ Pre-Testing Checklist:
1. [ ] Verify webhook URL is configured in Nowpayments dashboard
2. [ ] Verify IPN Secret matches in both Nowpayments dashboard and .env
3. [ ] Test webhook endpoint is accessible from external sources
4. [ ] Confirm SMTP settings are working (cPanel)

## Implementation Steps

### Phase 1: Verify Webhook Configuration
**What to verify:**
1. Log into Nowpayments dashboard
2. Go to Settings → IPN/Webhooks
3. Ensure the callback URL is set to: `https://affiliate-hub-137.preview.emergentagent.com/api/payments/callback`
4. Verify IPN Secret matches: `79kXvk7JRdLflmF5ElPH7m4rS01qUX9P`

### Phase 2: Test Payment Flow
**Testing Scenario:**
1. Create a test user with referral (to test referral upgrade email)
2. User makes payment for Bronze tier ($20)
3. Verify payment callback is received
4. Verify 3 emails are sent:
   - ✉️ Admin receives "New Payment Received" email
   - ✉️ User receives "Payment Confirmation" email
   - ✉️ Sponsor receives "Referral Upgrade" email (if user has sponsor)

**Expected Backend Flow:**
```
Payment Created → Nowpayments Invoice → User Pays → 
Nowpayments Webhook → /api/payments/callback → 
Payment Status Updated → Membership Upgraded → 
Commissions Calculated → Emails Sent
```

### Phase 3: Test Commission Payout Flow
**Testing Scenario:**
1. Find a user who has achieved a milestone (or trigger one)
2. Admin logs in and marks milestone as paid
3. Verify commission payout email is sent to user

**Expected Backend Flow:**
```
Admin Dashboard → Milestones Page → Mark as Paid → 
PUT /api/admin/milestones/{id}/mark-paid → 
Milestone Status Updated → Commission Payout Email Sent
```

## Email Triggers Summary

### Payment Flow Emails (Triggered by Nowpayments Callback):
```python
# server.py:1685 - payment_callback()
if payment_status == "confirmed":
    # 1. Send payment confirmation to user (line 1715)
    await send_payment_confirmation_email(user_email, username, tier, amount)
    
    # 2. Send referral upgrade to sponsor (line 1727)
    if referrer_address:
        await send_referral_upgrade_email(referrer_email, referrer_username, username, tier)
    
    # 3. Send admin payment notification (line 1746)
    await send_admin_payment_confirmation(username, tier, amount)
    
    # 4. Calculate commissions (line 1751)
    await calculate_commissions(user_address, tier, amount)
```

### Commission Payout Email (Triggered by Admin Action):
```python
# server.py:2920 - mark_milestone_as_paid()
await send_commission_payout_email(user_email, username, bonus_amount, milestone_count)
```

## SMTP Configuration (cPanel)
```
Host: s12.asurahosting.com
Port: 587
Username: notifications@members.proleads.network
Password: aqavqh$?ZfIl
From: notifications@members.proleads.network
Admin Email: proleadsnetwork@gmail.com
```

## Testing Protocol

### Test 1: New Payment with Referral
**Setup:**
1. User: testpayer1 (has sponsor: firstuser)
2. Payment: Bronze tier ($20)

**Expected Results:**
- [ ] Payment appears in admin dashboard
- [ ] User membership upgraded to Bronze
- [ ] Admin receives email: "Payment Confirmed - testpayer1 upgraded to Bronze"
- [ ] User receives email: "Payment Confirmed - Welcome to Bronze Membership!"
- [ ] Sponsor (firstuser) receives email: "Your Referral testpayer1 Upgraded to Bronze!"
- [ ] Commissions calculated for upline

### Test 2: Commission Payout
**Setup:**
1. User with milestone (e.g., 25 referrals = $25 bonus)
2. Admin marks milestone as paid

**Expected Results:**
- [ ] Milestone status updated to "paid"
- [ ] User receives email: "Commission Payout - $25.00 Milestone Bonus!"

### Test 3: New User Registration (Already Tested)
**Expected Results:**
- [✅] Sponsor receives "New Referral" email

### Test 4: Lead Distribution (Already Tested)
**Expected Results:**
- [✅] Users receive "New Leads Distributed" email
- [✅] Admin receives lead distribution status email

## Code Review Checklist

### ✅ Email Service Implementation:
- [✅] All 4 new email templates exist
- [✅] SMTP configuration loaded from .env
- [✅] Error handling for failed email sends
- [✅] User preferences checked before sending

### ✅ Payment Callback Implementation:
- [✅] Webhook signature verification
- [✅] Payment status update
- [✅] Membership upgrade logic
- [✅] Subscription expiry calculation
- [✅] Commission calculation trigger
- [✅] Email notifications triggered
- [✅] Admin notification created

### ✅ Milestone Payment Implementation:
- [✅] Mark as paid endpoint exists
- [✅] Milestone status update
- [✅] Commission payout email triggered
- [✅] User preferences checked

## No Code Changes Required! 🎉

All email notification code is already implemented and integrated. We only need to:
1. ✅ Verify Nowpayments webhook configuration
2. ✅ Test with real payments
3. ✅ Test commission payouts

## Next Steps for Testing

1. **Verify Nowpayments Dashboard**
   - Check webhook URL configuration
   - Verify IPN secret

2. **Create Test Payment**
   - Use existing test user with sponsor
   - Create Bronze tier payment ($20)
   - Complete payment
   - Monitor logs and email inbox

3. **Test Milestone Payout**
   - Find user with milestone
   - Mark as paid via admin dashboard
   - Verify email received

4. **Monitor & Debug**
   - Check backend logs: `tail -f /var/log/supervisor/backend.*.log`
   - Check SMTP logs for email sending
   - Verify all email recipients receive emails
