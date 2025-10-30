# NOWPayments Custody + Auto-Conversion to USDC Polygon

## What is NOWPayments Custody?

NOWPayments Custody is a **hosted wallet service** that allows you to:
1. Accumulate all incoming crypto payments in one place
2. Automatically convert everything to USDC on Polygon (USDCMATIC)
3. Withdraw in batches to minimize network fees
4. Use for instant affiliate payouts

**Key Benefit:** All conversions happen **off-chain** within NOWPayments system = no blockchain fees for conversions!

---

## How It Works: Complete Flow

### Step 1: Customer Makes Payment
```
Customer pays with BTC/ETH/SOL/LTC/etc (200+ coins supported)
    ↓
Payment detected by NOWPayments
    ↓
Funds go to YOUR Custody balance (hosted wallet)
```

### Step 2: Automatic Conversion (Inside Custody)
```
Custody receives BTC/ETH/SOL/etc
    ↓
Auto-conversion enabled: "Convert to USDCMATIC"
    ↓
Instant conversion to USDC Polygon (off-chain, no gas fees!)
    ↓
Your Custody balance now shows USDC Polygon
```

**Conversion Fee: 0.5%** (happens instantly, off-chain)

### Step 3: Use for Payouts
```
Option A: Keep in Custody for instant payouts
    ↓
Use NOWPayments Mass Payout API
    ↓
Pay affiliates directly from Custody balance

Option B: Withdraw to your wallet
    ↓
Batch withdrawal to your Polygon wallet
    ↓
Use for your own payout system
```

---

## Two Payout Options with Custody

### Option A: NOWPayments Mass Payout API (Easiest)

**How it works:**
1. Payments accumulate as USDCMATIC in Custody
2. When ready to pay commissions → Call Mass Payout API
3. NOWPayments sends USDC Polygon to each affiliate
4. All happens within their system (fast and cheap)

**Pros:**
- ✅ No need to manage your own wallet
- ✅ Simple API integration
- ✅ NOWPayments handles all blockchain transactions
- ✅ Batch multiple payouts efficiently

**Cons:**
- ❌ 0.5% fee per payout transaction
- ❌ Less control over payout process
- ❌ Dependent on NOWPayments for payouts

**Cost Example:**
```
$10,000 in payments → Auto-convert to USDCMATIC
Conversion fee: $10,000 × 0.5% = $50

Payout $5,000 commissions to 100 affiliates
Payout fee: $5,000 × 0.5% = $25

Total fees: $75 (0.75% of incoming)
Plus: Small Polygon network fees paid by NOWPayments
```

---

### Option B: Withdraw to Your Wallet + Custom Payouts (Recommended)

**How it works:**
1. Payments accumulate as USDCMATIC in Custody
2. Periodically withdraw USDCMATIC to YOUR Polygon wallet
3. Use your own batch transfer system for affiliate payouts

**Pros:**
- ✅ Lower payout costs (~$0.01 per affiliate on Polygon)
- ✅ Full control over payout timing
- ✅ No per-payout fees (only gas)
- ✅ Can use multi-sig wallet for security

**Cons:**
- ⚠️ Need to build custom payout system (1-2 weeks)
- ⚠️ Need to manage your own wallet
- ⚠️ Withdrawal network fees (but minimal on Polygon)

**Cost Example:**
```
$10,000 in payments → Auto-convert to USDCMATIC
Conversion fee: $10,000 × 0.5% = $50

Withdraw $5,000 to your Polygon wallet
Withdrawal fee: ~$0.10 (Polygon gas)

Payout to 100 affiliates via custom system
Gas cost: ~$0.05-0.10 total

Total fees: $50.10-$50.20 (0.5% of incoming)
```

**Savings vs Option A:** $25/batch = $100-300/month saved

---

## NOWPayments Custody Fee Structure

| Action | Fee Type | Amount |
|--------|----------|--------|
| **Incoming Payment** | Service fee | 1.5% |
| **Auto-Conversion (in Custody)** | Service fee | 0.5% (already included in 1.5%) |
| **Store in Custody** | Storage fee | FREE |
| **Withdrawal to Your Wallet** | Network fee only | ~$0.10-1 (Polygon gas) |
| **Mass Payout API** | Service fee | 0.5% per payout |

**Important:** The 1.5% incoming fee **includes** the 0.5% auto-conversion fee, so you're not double-charged.

**Total Cost:**
- Option A (Mass Payout API): 1.5% + 0.5% = **2% total**
- Option B (Custom Payouts): 1.5% + negligible gas = **~1.5% total**

---

## Setting Up NOWPayments Custody

### Step 1: Enable Custody in Dashboard

1. Log into NOWPayments dashboard: https://account.nowpayments.io/
2. Go to **Settings → Custody**
3. Click **Enable Custody**
4. Accept terms and conditions

### Step 2: Enable Auto-Conversion

1. In Custody settings, find **Auto-Conversion**
2. Select **Target Currency: USDCMATIC** (USDC on Polygon)
3. Enable **Auto-convert all incoming payments**
4. Save settings

**Result:** Every payment in ANY cryptocurrency will automatically convert to USDC Polygon in your Custody balance.

### Step 3: API Integration

```python
# When creating payment (same as before)
invoice_data = {
    "price_amount": 20,
    "price_currency": "USD",
    # Don't specify pay_currency - let user choose any coin
    "ipn_callback_url": f"{APP_URL}/api/payments/callback",
    "order_id": f"order_12345",
    "order_description": "Bronze Membership"
}

# Payment created → Customer pays with ANY coin
# → NOWPayments auto-converts to USDCMATIC in Custody
# → Your callback receives confirmation
# → USDCMATIC is ready in Custody balance
```

### Step 4: Check Custody Balance

```python
# Get Custody balance via API
import httpx

headers = {"x-api-key": NOWPAYMENTS_API_KEY}

async with httpx.AsyncClient() as client:
    response = await client.get(
        "https://api.nowpayments.io/v1/balance",
        headers=headers
    )
    
    balances = response.json()
    # Find USDCMATIC balance
    usdc_polygon_balance = balances.get("USDCMATIC", 0)
```

---

## Two Implementation Paths

### Path A: Use NOWPayments Mass Payout API (Quick & Easy)

**Timeline:** 1 week

**Implementation:**
```python
# After payment confirmed and commissions calculated
async def payout_commissions(commissions: List[dict]):
    """
    commissions = [
        {"address": "0xabc...", "amount": 25.50},
        {"address": "0xdef...", "amount": 100.00}
    ]
    """
    
    # Prepare mass payout request
    withdrawals = []
    for comm in commissions:
        withdrawals.append({
            "address": comm["address"],
            "currency": "USDCMATIC",
            "amount": comm["amount"],
            "ipn_callback_url": f"{APP_URL}/api/payout-callback"
        })
    
    # Send mass payout request
    headers = {"x-api-key": NOWPAYMENTS_API_KEY}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.nowpayments.io/v1/payout",
            headers=headers,
            json={"withdrawals": withdrawals}
        )
        
        result = response.json()
        return result  # Track payout IDs
```

**Pros:**
- ✅ Very simple
- ✅ NOWPayments handles everything
- ✅ Can do instant payouts

**Cons:**
- ❌ 0.5% fee per payout
- ❌ Total cost: ~2%

---

### Path B: Withdraw + Custom Polygon Payouts (Cost-Effective)

**Timeline:** 2-3 weeks

**Implementation:**

**1. Withdraw from Custody to Your Polygon Wallet**
```python
# Withdraw USDCMATIC to your Polygon wallet
async def withdraw_from_custody(amount: float, your_polygon_address: str):
    headers = {"x-api-key": NOWPAYMENTS_API_KEY}
    
    withdrawal_data = {
        "currency": "USDCMATIC",
        "amount": amount,
        "address": your_polygon_address,
        "ipn_callback_url": f"{APP_URL}/api/withdrawal-callback"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.nowpayments.io/v1/withdrawal",
            headers=headers,
            json=withdrawal_data
        )
        
        return response.json()
```

**2. Build Custom Batch Payout System**
```python
from web3 import Web3
from eth_account import Account

# Connect to Polygon
w3 = Web3(Web3.HTTPProvider('https://polygon-rpc.com'))

# Your wallet
private_key = os.getenv("PAYOUT_WALLET_PRIVATE_KEY")
account = Account.from_key(private_key)

# USDC contract on Polygon
USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
usdc_contract = w3.eth.contract(
    address=USDC_ADDRESS,
    abi=[...]  # ERC-20 ABI
)

async def batch_payout_polygon(commissions: List[dict]):
    """Instant batch payout on Polygon"""
    
    for comm in commissions:
        # Transfer USDC
        tx = usdc_contract.functions.transfer(
            comm["address"],
            int(comm["amount"] * 1e6)  # USDC has 6 decimals
        ).buildTransaction({
            'from': account.address,
            'gas': 100000,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(account.address)
        })
        
        # Sign and send
        signed_tx = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Log transaction
        logger.info(f"Payout sent: {tx_hash.hex()}")
        
        # Small delay between transactions
        await asyncio.sleep(1)
```

**Pros:**
- ✅ Lowest cost (~1.5% total)
- ✅ Full control
- ✅ Can do instant payouts
- ✅ Use multi-sig for security

**Cons:**
- ⚠️ More complex
- ⚠️ Need to manage wallet security
- ⚠️ 2-3 weeks development

---

## Instant Payout Implementation

For TRUE instant payouts, combine Custody with either path:

### Workflow:
```
Payment confirmed by NOWPayments
    ↓
Auto-converts to USDCMATIC in Custody
    ↓
Webhook triggers your backend
    ↓
Calculate commissions (4 affiliates)
    ↓
INSTANT PAYOUT:
  - Path A: Call Mass Payout API immediately
  - Path B: Send from your Polygon wallet immediately
    ↓
Affiliates receive USDC Polygon in 30-60 seconds
    ↓
Send "Commission Paid" emails
```

**No delays, no bridging, no batching needed!**

---

## Cost Comparison: Complete Picture

### Scenario: $10,000 Monthly Payments, $5,000 Commissions

**NOWPayments Custody (Path A - Mass Payout API):**
- Incoming: $10,000 × 1.5% = $150
- Payouts: $5,000 × 0.5% = $25
- **Total: $175 (1.75%)**

**NOWPayments Custody (Path B - Custom Payouts):**
- Incoming: $10,000 × 1.5% = $150
- Withdrawal: $0.10
- Custom payouts: $0.10
- **Total: $150.20 (1.5%)**

**Current Coinbase Commerce + Reserve:**
- Incoming: $10,000 × 1% = $100
- Bridge fees: $10-20
- Custom payouts: $0.10
- **Total: $110.20 (1.1%)**

**Verdict:** 
- Coinbase Commerce is still cheaper overall
- But NOWPayments Custody is MUCH simpler (no bridging hassle)
- Extra 0.4% cost = **convenience fee** for auto-conversion

---

## My Recommendation

### For Instant Payouts: NOWPayments Custody Path B

**Why:**
1. ✅ **No registration hassle** (you already have NOWPayments account)
2. ✅ **Automatic USDC Polygon conversion** (exactly what you wanted from Atlos.io)
3. ✅ **Instant payouts possible** (from Custody or your wallet)
4. ✅ **No bridging headaches** (everything handled automatically)
5. ✅ **Reasonable cost** (1.5% vs Coinbase's 1% + bridging complexity)
6. ✅ **Full control** (withdraw whenever you want)

**Trade-off:** 0.4% higher fees than Coinbase, but saves weeks of bridging management

---

## Implementation Plan

### Week 1: Setup & Testing
1. Enable Custody in NOWPayments dashboard
2. Enable auto-conversion to USDCMATIC
3. Update backend to use invoice API (keep current setup)
4. Test with small payment
5. Verify auto-conversion works

### Week 2-3: Custom Payout System
1. Set up Polygon wallet (Gnosis Safe for security)
2. Build withdrawal automation from Custody
3. Build instant payout system
4. Test with small amounts
5. Email notification integration

### Week 4: Production Launch
1. Switch to Custody for all payments
2. Monitor first few payments and payouts
3. Verify instant commissions work
4. Scale up

**Total: 4 weeks to production-ready instant payouts**

---

## Next Steps

Would you like me to:

1. **Implement NOWPayments Custody integration** (Path B recommended)?
2. **Just use their Mass Payout API** (Path A - simpler but higher fees)?
3. **Compare more closely with current Coinbase Commerce** setup?

Let me know and I can start implementing right away!
