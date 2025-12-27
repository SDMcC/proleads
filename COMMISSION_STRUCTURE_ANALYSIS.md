# Proleads Network - Commission Structure Analysis

## Overview

The Proleads commission system is a **multi-level referral structure** where commission rates are determined by the **referrer's membership tier**, NOT the new member's tier. Commissions are calculated based on the **new member's payment amount** using the commission rates defined in the referrer's tier.

---

## Key Principles

### 1. **Referrer's Tier Determines Commission Rates**
The person earning the commission (the referrer) has their commission rates determined by their own membership tier. Higher tiers have:
- Higher commission percentages
- More commission levels (deeper network earnings)

### 2. **New Member's Payment is the Commission Base**
When a new member pays for membership, that payment amount becomes the base for calculating commissions up the referral chain.

### 3. **Level-Based Distribution**
Commissions are distributed up the referral chain:
- **Level 1**: Direct referrer (person who directly referred the new member)
- **Level 2**: Referrer's referrer (2nd level up)
- **Level 3**: 3rd level up the chain
- **Level 4**: 4th level up the chain (maximum depth in code is 4 levels, but tier configurations may have more)

---

## Membership Tiers & Commission Rates

Based on the backend configuration (`DEFAULT_MEMBERSHIP_TIERS`), here are the actual commission structures:

### **Affiliate (Free)**
- **Price**: $0
- **Commission Levels**: 2 levels
- **Rates**: 
  - Level 1 (Direct): **25%**
  - Level 2: **5%**

### **Test Tier**
- **Price**: $2
- **Commission Levels**: 4 levels
- **Rates**:
  - Level 1 (Direct): **25%**
  - Level 2: **5%**
  - Level 3: **3%**
  - Level 4: **2%**

### **Bronze**
- **Price**: $20
- **Commission Levels**: 4 levels
- **Rates**:
  - Level 1 (Direct): **25%**
  - Level 2: **5%**
  - Level 3: **3%**
  - Level 4: **2%**

### **Silver**
- **Price**: $50
- **Commission Levels**: 4 levels
- **Rates**:
  - Level 1 (Direct): **27%**
  - Level 2: **10%**
  - Level 3: **5%**
  - Level 4: **3%**

### **Gold**
- **Price**: $100
- **Commission Levels**: 4 levels
- **Rates**:
  - Level 1 (Direct): **30%**
  - Level 2: **15%**
  - Level 3: **10%**
  - Level 4: **5%**

### **VIP Affiliate**
- **Price**: $0 (special tier)
- **Commission Levels**: 4 levels
- **Rates**:
  - Level 1 (Direct): **30%**
  - Level 2: **15%**
  - Level 3: **10%**
  - Level 4: **5%**

---

## How Commission Calculation Works

### Example Scenario

**Network Structure:**
```
Alice (Gold Tier) 
  └─> Bob (Silver Tier)
       └─> Charlie (Bronze Tier)
            └─> David (Affiliate)
                 └─> Emma (New Member, pays $50 for Bronze)
```

**When Emma pays $50 for Bronze membership, here's what happens:**

#### Step 1: David (Direct Referrer - Level 1)
- **David's Tier**: Affiliate (Free)
- **Emma's Payment**: $50
- **David's Commission Rate at Level 1**: 25%
- **David Earns**: $50 × 0.25 = **$12.50**

#### Step 2: Charlie (Level 2)
- **Charlie's Tier**: Bronze
- **Emma's Payment**: $50
- **Charlie's Commission Rate at Level 2**: 5%
- **Charlie Earns**: $50 × 0.05 = **$2.50**

#### Step 3: Bob (Level 3)
- **Bob's Tier**: Silver
- **Emma's Payment**: $50
- **Bob's Commission Rate at Level 3**: 5%
- **Bob Earns**: $50 × 0.05 = **$2.50**

#### Step 4: Alice (Level 4)
- **Alice's Tier**: Gold
- **Emma's Payment**: $50
- **Alice's Commission Rate at Level 4**: 5%
- **Alice Earns**: $50 × 0.05 = **$2.50**

**Total Commissions Distributed**: $12.50 + $2.50 + $2.50 + $2.50 = **$20.00** (40% of Emma's payment)

---

## Important Rules & Edge Cases

### Rule 1: Tier Depth Limitations
If a referrer's tier doesn't have enough commission levels, they DON'T earn at that level, but the chain continues.

**Example:**
```
Alice (Affiliate - only 2 levels)
  └─> Bob (Silver)
       └─> Charlie (Bronze)
            └─> David pays $100
```

- **Bob earns**: Level 1 commission (Alice's Level 2 rate)
- **Alice earns**: Level 2 commission (Alice's Level 3 rate) - BUT Affiliate only has 2 levels
- **Alice gets NOTHING** at Level 2 because her tier configuration ends at Level 2
- **Chain still continues** - if there was someone above Alice, they could still earn

### Rule 2: Zero Commission Rates
Some tiers may have 0% rates at certain levels. In this case:
- No commission is recorded
- No notification is sent
- Chain continues to next level

### Rule 3: Maximum Chain Depth
Currently hardcoded to **4 levels** in the code (line 566):
```python
for level in range(4):  # Maximum 4 levels
```

Even if a tier configuration has more commission rates (e.g., 7 levels like shown in the marketing materials), the system will only calculate up to 4 levels.

### Rule 4: No Referrer = No Commissions
If the new member has no referrer, no commissions are calculated at all.

---

## Commission Processing Flow

### When Commissions Are Triggered
Commissions are calculated immediately when:
1. **DePay payment confirmed** (crypto payments)
2. **Coinbase Commerce payment confirmed**
3. **Manual payment confirmation** by admin

### Commission Status Lifecycle

1. **Created**: Commission is calculated and saved to database with status "pending"
2. **Notification Sent**: User receives notification of commission earned
3. **Instant Payout Processing**: System attempts to pay out immediately (if configured)
4. **Status Updated**: Changes to "paid" or remains "pending" for manual payout

### Commission Record Structure
Each commission creates a database record with:
```javascript
{
  commission_id: "uuid",
  recipient_address: "0x...",           // Who receives the commission
  recipient_tier: "silver",              // Their membership tier
  amount: 12.50,                        // Commission amount in USD
  commission_rate: 0.25,                // Rate used (25%)
  level: 1,                             // Level in chain (1-4)
  new_member_address: "0x...",          // Who triggered this commission
  new_member_tier: "bronze",            // What tier they purchased
  new_member_amount: 50.00,             // Their payment amount
  status: "pending",                    // pending, paid, or failed
  created_at: "2025-12-15T..."
}
```

---

## Comparison: Marketing Materials vs. Actual Code

### ⚠️ Discrepancies Found

The marketing materials (in `PROLEADS_DESCRIPTION.md`) list different commission structures than the actual code:

**Marketing Says:**

**Bronze:**
- 5 levels: 10%, 5%, 3%, 2%, 1%

**Silver:**
- 6 levels: 15%, 10%, 5%, 3%, 2%, 1%

**Gold:**
- 7 levels: 20%, 15%, 10%, 5%, 3%, 2%, 1%

**Code Actually Has:**

**Bronze:**
- 4 levels: 25%, 5%, 3%, 2%

**Silver:**
- 4 levels: 27%, 10%, 5%, 3%

**Gold:**
- 4 levels: 30%, 15%, 10%, 5%

### Key Differences:
1. **Code has HIGHER percentages** at Level 1 (25-30% vs. 10-20%)
2. **Code has FEWER levels** (4 vs. 5-7)
3. **Code is limited to 4 levels** regardless of tier configuration
4. **Total commission percentage** in code is higher at top levels

---

## Real-World Examples

### Example 1: Bronze Member Refers Gold Member

**Scenario:**
- John (Bronze) refers Sarah (Gold purchase at $100)
- John is Level 1 (direct referrer)

**Calculation:**
- John's Bronze tier, Level 1 rate: 25%
- Commission: $100 × 0.25 = **$25**

**Result:** John earns $25 from Sarah's $100 payment

### Example 2: Gold Member Has Deep Network

**Network:**
```
Alice (Gold)
  └─> Bob (Silver) pays $50
  └─> Charlie (Bronze)
       └─> David (Bronze) pays $20
```

**When Bob pays $50:**
- Alice (Level 1): $50 × 0.30 = **$15**

**When David pays $20:**
- Charlie (Level 1): $20 × 0.25 = **$5**
- Bob (Level 2): $20 × 0.10 = **$2** (using Silver's Level 2 rate)
- Alice (Level 3): $20 × 0.10 = **$2** (using Gold's Level 3 rate)

**Alice's Total from this structure**: $15 + $2 = **$17**

### Example 3: Free Affiliate Has Limited Reach

**Network:**
```
John (Affiliate - Free)
  └─> Mike (Bronze)
       └─> Tom (Silver)
            └─> Sarah pays $50
```

**When Sarah pays $50:**
- Tom (Level 1): $50 × 0.27 = **$13.50** (Silver Level 1)
- Mike (Level 2): $50 × 0.05 = **$2.50** (Bronze Level 2)
- John (Level 3): **$0** (Affiliate only has 2 commission levels)

**Result:** John misses out on Level 3 commission because his Affiliate tier only supports 2 levels

---

## Technical Implementation Notes

### Commission Calculation Function
Located at line 546 in `/app/backend/server.py`:

```python
async def calculate_commissions(
    new_member_address: str, 
    new_member_tier: str, 
    new_member_amount: float
)
```

**Key Logic:**
1. Finds new member's referrer
2. Walks up referral chain (max 4 levels)
3. For each level:
   - Gets referrer's tier
   - Checks if tier has commission rate for that level
   - Calculates commission amount
   - Saves commission record to database
   - Sends notification to referrer
4. Continues up chain even if someone doesn't qualify
5. Returns list of commissions paid

### Database Collections Involved
- **users**: Stores referrer_address chain
- **commissions**: Stores all commission records
- **notifications**: Sends commission earned notifications

### Notification System
Each commission generates a notification:
```
"You earned $12.50 commission from Emma's bronze membership!"
```

---

## Recommendations

### 1. Align Marketing with Code
The marketing materials should be updated to reflect the actual commission structure in the code, OR the code should be updated to match the marketing materials.

### 2. Increase Maximum Depth
If the intention is to support 7 levels (as marketed for Gold tier), the hardcoded limit of 4 should be increased:

```python
# Current
for level in range(4):  # Maximum 4 levels

# Should be
for level in range(7):  # Maximum 7 levels to match Gold tier
```

### 3. Consider Tier-Based Depth
Different tiers could have different maximum depths:
- Affiliate: 2 levels
- Bronze: 4 levels  
- Silver: 5 levels
- Gold: 7 levels

### 4. Add Commission Analytics
Track and display:
- Total commissions earned by tier level
- Conversion rates by network depth
- Average commission per referral
- Network performance metrics

---

## Summary

The Proleads commission system uses a **referrer-tier-based** structure where:

✅ **Your tier determines your rates** - Higher tiers get better percentages
✅ **Your tier determines your depth** - Higher tiers can earn from more levels
✅ **Payment amount is the base** - Commissions calculated from what new member paid
✅ **Chain continues regardless** - Even if someone doesn't qualify, chain continues
✅ **Instant calculation** - Commissions calculated immediately upon payment
✅ **Transparent tracking** - All commissions recorded and notified

⚠️ **Current Limitations**:
- Maximum 4 levels enforced in code (not 5-7 as marketed)
- Actual percentages differ from marketing materials
- No dynamic depth based on tier capabilities

The system is functional and operational, but there's a disconnect between what's marketed and what's implemented in the code.
