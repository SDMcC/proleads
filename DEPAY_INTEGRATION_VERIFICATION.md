# DePay Integration Verification & Testing

## Status: Ready for Live Testing
## Date: December 2024

---

## DePay Integration Overview

The Proleads Network uses **DePay** as the ONLY payment processor. Here's how it works:

### DePay Flow Architecture

```
1. User initiates payment (Frontend)
   └─> POST /api/payments/create-depay
       └─> Creates payment record (status: "pending")
       └─> Returns: payment_id, integration_id, amount, tier, user_address

2. DePay widget opens (Frontend)
   └─> Calls DePay Configuration Endpoint
       └─> POST /api/payments/depay/configuration
           └─> Returns payment configuration (blockchain, amount, token, receiver)

3. User completes payment (DePay)
   └─> DePay processes blockchain transaction
   └─> DePay sends webhook to callback endpoint

4. Backend receives webhook (Backend)
   └─> POST /api/payments/depay/callback
       └─> Verifies signature
       └─> Parses payment data
       └─> Finds payment record
       └─> Updates payment status: "pending" → "success"
       └─> Calls handle_payment_confirmed_depay()

5. Payment processing (Backend)
   └─> Update payment status: "success" → "processing"
   └─> Upgrade user membership
   └─> Set subscription expiry date
   └─> Calculate commissions
   └─> Process instant payouts
   └─> Update payment status: "processing" → "completed"
   └─> Send notifications

6. Frontend polling detects completion
   └─> Redirects user to dashboard
   └─> Shows updated membership tier
```

---

## DePay Endpoints Configuration

### 1. Configuration Endpoint (Dynamic Payment Setup)
**URL**: `https://payment-flow-70.preview.emergentagent.com/api/payments/depay/configuration`
**Method**: POST
**Called By**: DePay widget during payment initialization

**Purpose**: 
- Provides dynamic payment configuration based on tier selection
- Returns blockchain details, amount, token address, receiver address

**Request Payload** (sent by DePay):
```json
{
  "payment_id": "DEPAY-XXXXXXXXXXXXXXXX",
  "tier": "bronze",
  "user_address": "0x..."
}
```

**Response** (signed with OUR_PRIVATE_KEY):
```json
{
  "accept": [
    {
      "blockchain": "polygon",
      "amount": 20,
      "token": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      "receiver": "0xe68BecFfF9eae92bFcf3ba745563C5be2EB81460"
    }
  ]
}
```

**Headers**:
- `x-signature`: RSA-PSS signature of response body

**Status**: ✅ **VERIFIED WORKING**
```bash
# Test result:
$ curl -X POST https://payment-flow-70.preview.emergentagent.com/api/payments/depay/configuration \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "test-123", "tier": "test", "user_address": "0x1234567890123456789012345678901234567890"}'

Response: {"accept":[{"blockchain":"polygon","amount":2,"token":"0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359","receiver":"0xe68BecFfF9eae92bFcf3ba745563C5be2EB81460"}]}
```

### 2. Callback Endpoint (Payment Confirmation Webhook)
**URL**: `https://payment-flow-70.preview.emergentagent.com/api/payments/depay/callback`
**Method**: POST
**Called By**: DePay after successful payment

**Purpose**:
- Receives payment confirmation from DePay
- Verifies signature for security
- Processes payment (upgrade membership, commissions, payouts)

**Request Headers**:
- `x-signature`: RSA-PSS signature from DePay (using DEPAY_PUBLIC_KEY)

**Request Payload** (sent by DePay):
```json
{
  "blockchain": "polygon",
  "transaction": "0x1234567890abcdef...",
  "sender": "0xUserWalletAddress",
  "receiver": "0xe68BecFfF9eae92bFcf3ba745563C5be2EB81460",
  "token": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  "amount": "20.00",
  "payload": {
    "payment_id": "DEPAY-XXXXXXXXXXXXXXXX",
    "tier": "bronze",
    "user_address": "0xUserWalletAddress"
  },
  "after_block": "78811332",
  "commitment": "confirmed",
  "confirmations": 1,
  "created_at": "2025-01-01T00:00:00Z",
  "confirmed_at": "2025-01-01T00:00:02Z"
}
```

**Response**: `{"status": "ok"}`

**Status**: ✅ **SECURED** (requires valid signature from DePay)

---

## DePay Configuration in Dashboard

### Settings in DePay Dashboard:

1. **Configuration Endpoint**:
   ```
   https://payment-flow-70.preview.emergentagent.com/api/payments/depay/configuration
   ```
   ⚠️ Note: You provided URL with `//api` (double slash) - make sure it's single slash `/api` in DePay dashboard

2. **Callback Endpoint** (Webhook):
   ```
   https://payment-flow-70.preview.emergentagent.com/api/payments/depay/callback
   ```

3. **Integration ID**: 
   ```
   payment-flow-70
   ```
   (from DEPAY_INTEGRATION_ID in /app/backend/.env)

4. **Public Keys**:
   - **DePay's Public Key** (for verifying webhooks): Already configured in DEPAY_PUBLIC_KEY
   - **Our Public Key** (for signing responses): Derived from OUR_PRIVATE_KEY

---

## Environment Variables

Current configuration in `/app/backend/.env`:

```env
# DePay Configuration
DEPAY_INTEGRATION_ID=payment-flow-70
DEPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
OUR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Hot Wallet (receives payments)
HOT_WALLET_ADDRESS=0xe68BecFfF9eae92bFcf3ba745563C5be2EB81460
HOT_WALLET_PRIVATE_KEY=0xa98d6be96565332f2e17d78a709ec3d3ac9cb20090462737ac5ba3680966c2eb

# Polygon Network
POLYGON_RPC_URL=https://polygon-rpc.com
```

---

## Enhanced Logging for DePay

All DePay operations now have comprehensive logging:

### Webhook Logs (🟢 markers):
```
🟢 [DePay Webhook] ========== CALLBACK RECEIVED ==========
🟢 [DePay Webhook] Request body length: XXX bytes
🟢 [DePay Webhook] Signature present: True/False
🟢 [DePay Webhook] Verifying signature...
✅ [DePay Webhook] Signature verified successfully
🟢 [DePay Webhook] Full payload: {...}
🟢 [DePay Webhook] Parsed data: {...}
🟢 [DePay Webhook] Searching for payment in database: DEPAY-XXX
✅ [DePay Webhook] Payment found: DEPAY-XXX - Current status: pending
🟢 [DePay Webhook] Processing DePay callback: payment_id=XXX, status=success, amount=XX
```

### Payment Processing Logs (🔵 markers):
```
🔵 [DePay] Starting payment confirmation handler
🔵 [DePay] Payment ID: DEPAY-XXX
🔵 [DePay] User Address: 0xXXX
🔵 [DePay] Tier: bronze
🔵 [DePay] Amount: 20.00
🔵 [DePay] Updating payment status to 'processing'...
🔵 [DePay] Subscription expires at: 2025-01-XX
🔵 [DePay] Updating user membership with data: {...}
✅ [DePay] User update result: matched=1, modified=1
✅ [DePay] Successfully upgraded user 0xXXX to bronze
🔵 [DePay] Calculating commissions for $20.00...
✅ [DePay] Commissions calculated: N commission(s)
🔵 [DePay] Initiating instant payouts for N commissions...
✅ [DePay] Payouts processed successfully
🔵 [DePay] Updating payment status to 'completed'...
✅ [DePay] Final payment update result: matched=1, modified=1
```

### To Watch Logs Live:
```bash
tail -f /var/log/supervisor/backend.err.log | grep -E "\[DePay"
```

---

## Testing DePay Integration

### Test 1: Configuration Endpoint ✅
**Status**: PASSED

```bash
curl -X POST https://payment-flow-70.preview.emergentagent.com/api/payments/depay/configuration \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "TEST-12345",
    "tier": "test",
    "user_address": "0x1234567890123456789012345678901234567890"
  }'
```

**Expected**: JSON response with accept array for Polygon USDC
**Result**: ✅ Working correctly

### Test 2: Callback Endpoint Security ✅
**Status**: SECURED

```bash
curl -X POST https://payment-flow-70.preview.emergentagent.com/api/payments/depay/callback \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Expected**: 401 error "Missing signature header"
**Result**: ✅ Properly secured

### Test 3: Live Payment Flow ⏳
**Status**: NEEDS USER TESTING

**Steps**:
1. Navigate to https://payment-flow-70.preview.emergentagent.com
2. Sign up new user
3. Go to payment page
4. Select "Test" tier ($2)
5. Complete payment with DePay widget
6. Watch backend logs for webhook processing
7. Verify redirect to dashboard
8. Check membership tier updated
9. Check payment status = "completed"

---

## Payment Status Transitions

The correct DePay flow should show these status transitions:

```
pending (payment created)
  ↓
success (webhook received from DePay)
  ↓
processing (membership upgrade in progress)
  ↓
completed (all processing done)
```

**Previous Issue**: Payment stuck at "pending"
**Root Cause**: Webhook not being received OR webhook failing to process

**Verification Points**:
1. ✅ Configuration endpoint working
2. ✅ Callback endpoint secured
3. ⏳ DePay dashboard configured with correct URLs
4. ⏳ Live payment test needed

---

## Database Schema

### Payments Collection:
```javascript
{
  _id: ObjectId,
  payment_id: "DEPAY-XXXXXXXXXXXXXXXX",
  user_address: "0x...",
  username: "user123",
  email: "user@example.com",
  tier: "bronze",
  amount: 20,
  currency: "USDC",
  status: "pending" | "processing" | "completed" | "error",
  payment_method: "depay",
  created_at: ISODate,
  updated_at: ISODate,
  confirmed_at: ISODate,
  depay_callback: { ... },
  transaction_hash: "0x...",
  received_amount: 20,
  payout_results: { ... }
}
```

### Users Collection:
```javascript
{
  _id: ObjectId,
  user_id: "uuid",
  username: "user123",
  email: "user@example.com",
  address: "0x...",
  membership_tier: "bronze",
  subscription_expires_at: ISODate,  // Set to +30 days from payment
  referral_code: "user123",
  referrer_address: "0x..." | null,
  created_at: ISODate,
  ...
}
```

---

## Commission Processing

When payment is completed:

1. **Calculate Commissions**: Based on user's referral chain and tier commission rates
2. **Instant Payouts**: If hot wallet has sufficient funds, payouts sent immediately
3. **Status Tracking**: All commission payouts logged in `commissions` collection

**Commission Rates by Tier**:
- Affiliate: [25%, 5%]
- Test: [25%, 5%, 3%, 2%]
- Bronze: [25%, 5%, 3%, 2%]
- Silver: [27%, 10%, 5%, 3%]
- Gold: [30%, 15%, 10%, 5%]
- VIP Affiliate: [30%, 15%, 10%, 5%]

---

## Debugging Checklist

If payment gets stuck at "pending":

### 1. Check DePay Dashboard Configuration
- [ ] Configuration endpoint URL is correct (single slash `/api`)
- [ ] Callback endpoint URL is correct
- [ ] Integration ID matches: `payment-flow-70`
- [ ] Webhook is enabled

### 2. Check Backend Logs
```bash
tail -f /var/log/supervisor/backend.err.log | grep -E "DePay|payment"
```

**Look for**:
- `🟢 [DePay Webhook] ========== CALLBACK RECEIVED ==========` (webhook received)
- `❌` markers (errors)
- Signature verification status
- Payment lookup results
- User upgrade results

### 3. Check Database State
```bash
python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db = client[os.getenv("DB_NAME")]
    
    # Get latest payment
    payment = await db.payments.find_one(
        {"payment_method": "depay"},
        sort=[("created_at", -1)]
    )
    
    if payment:
        print(f"Latest DePay Payment:")
        print(f"  Payment ID: {payment.get('payment_id')}")
        print(f"  Status: {payment.get('status')}")
        print(f"  User: {payment.get('user_address')}")
        print(f"  Tier: {payment.get('tier')}")
        print(f"  Amount: ${payment.get('amount')}")
        print(f"  Created: {payment.get('created_at')}")
        print(f"  Transaction Hash: {payment.get('transaction_hash', 'N/A')}")
        
        # Get user
        user = await db.users.find_one({"address": payment.get('user_address')})
        if user:
            print(f"\nUser Status:")
            print(f"  Username: {user.get('username')}")
            print(f"  Current Tier: {user.get('membership_tier')}")
            print(f"  Expires: {user.get('subscription_expires_at', 'N/A')}")
    else:
        print("No DePay payments found")
    
    client.close()

asyncio.run(check())
EOF
```

### 4. Check Network Connectivity
```bash
# Test if DePay can reach callback endpoint
curl -X POST https://payment-flow-70.preview.emergentagent.com/api/payments/depay/callback \
  -H "Content-Type: application/json" \
  -d '{"test": "connectivity"}' \
  -v
```

Should return 401 (Missing signature) - this proves endpoint is reachable.

---

## Next Steps

1. **Immediate**: Verify DePay dashboard has correct endpoints configured
2. **Test**: Create a test payment and monitor logs
3. **Verify**: Check payment transitions from pending → completed
4. **Verify**: Check membership upgrade happens
5. **Verify**: Check subscription expiry date is set

---

## Files Modified

- `/app/backend/server.py`:
  - Enhanced DePay webhook logging
  - Enhanced payment confirmation handler logging
  - Added error handling for commission/payout processing
  - Fixed NowPayments configuration variables

---

## Support

Watch logs in real-time during testing:
```bash
# Terminal 1: Watch all DePay processing
tail -f /var/log/supervisor/backend.err.log | grep -E "\[DePay"

# Terminal 2: Watch all payment-related activity  
tail -f /var/log/supervisor/backend.err.log | grep -i payment
```

The enhanced logging will show exactly where the process succeeds or fails.

---

**Status**: ✅ Ready for live DePay payment testing
