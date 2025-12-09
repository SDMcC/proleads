# Enable DePay Signature Verification

## Current Status
✅ Payments working with "TEMPORARILY allow without signature" bypass  
⏳ Need to enable proper signature verification for security

---

## What You Need to Do

### Step 1: Get DePay's Public Key from Dashboard

1. Go to **https://app.depay.com**
2. Find your integration: `f2bfd96b-2ce7-4d74-93d6-6ec805750417`
3. Look for **"Public Key"** or **"Verification Key"** section
4. Copy the **PUBLIC KEY** that starts with:
   ```
   -----BEGIN PUBLIC KEY-----
   MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ...
   -----END PUBLIC KEY-----
   ```

**Important:** This should be **DePay's public key** (to verify THEIR signatures), NOT your private key or your public key.

---

## Step 2: Update the Public Key

Once you have DePay's public key, I'll update the `.env` file with:

```env
DEPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
<PASTE DEPAY'S PUBLIC KEY HERE>
-----END PUBLIC KEY-----"
```

---

## Step 3: Enable Strict Verification

After updating the public key, I'll:

1. **Remove the bypass code** that says "TEMPORARILY allow without signature"
2. **Enable strict verification** so only signed requests are accepted
3. **Restart backend** to apply changes

---

## Current Signature Verification Code

Our code **already implements DePay's signature verification correctly**:

### File: `/app/backend/depay_utils.py`

```python
def verify_depay_signature(signature: str, payload: bytes) -> bool:
    """
    Verify DePay webhook signature using RSA-PSS with SHA256
    - Uses RSA-PSS with salt length 64 ✅
    - Uses SHA256 hashing ✅
    - Handles base64 URL encoding ✅
    - Uses raw request body ✅
    """
    # Load DePay's public key
    public_key = serialization.load_pem_public_key(
        DEPAY_PUBLIC_KEY.encode('utf-8'),
        backend=default_backend()
    )
    
    # Decode signature from base64 URL encoding
    signature_standard = signature.replace('-', '+').replace('_', '/')
    padding_needed = len(signature_standard) % 4
    if padding_needed:
        signature_standard += '=' * (4 - padding_needed)
    signature_bytes = base64.b64decode(signature_standard)
    
    # Verify using RSA-PSS with SHA256 and salt length 64
    public_key.verify(
        signature_bytes,
        payload,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=64  # ✅ Matches DePay requirement
        ),
        hashes.SHA256()
    )
    
    return True
```

✅ This matches DePay's documentation exactly!

---

## Why Current Public Key is Wrong

The public key currently in `.env` is **YOUR public key** (generated from OUR_PRIVATE_KEY).

**Evidence:**
```
# Current keys in .env match each other (they're a pair)
DEPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwk0Ikb8jYeE/essXT/nD..."
OUR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDCTQiRvyNh4T96..."
```

These keys are a **pair** (private/public) used for:
- **OUR_PRIVATE_KEY**: To sign responses we send TO DePay
- **YOUR_PUBLIC_KEY**: Given to DePay so they can verify OUR signatures

We need **DePay's public key** (different key) to verify THEIR signatures.

---

## What Happens After Fix

### With Proper Signature Verification:

**Configuration Endpoint (`/api/payments/depay/configuration`):**
1. DePay sends request WITH signature ✅
2. Backend verifies signature using DePay's public key ✅
3. Backend creates payment configuration ✅
4. Backend signs response using OUR_PRIVATE_KEY ✅
5. Backend sends response with OUR signature ✅
6. DePay verifies OUR signature using OUR public key ✅

**Callback Endpoint (`/api/payments/depay/callback`):**
1. DePay sends webhook WITH signature ✅
2. Backend verifies signature using DePay's public key ✅
3. Backend processes payment ✅
4. Backend sends response (no signature needed for simple OK) ✅

**Result:** Secure two-way communication with full signature verification ✅

---

## Testing After Enabling

### 1. Backend Logs Will Show:
```
🟢 [DePay Webhook] ========== CALLBACK RECEIVED ==========
🟢 [DePay Webhook] Signature present: True
🟢 [DePay Webhook] Verifying signature...
✅ [DePay Webhook] Signature verified successfully  <-- SUCCESS!
🟢 [DePay Webhook] Full payload: {...}
[... rest of processing ...]
✅ [DePay Webhook] ========== CALLBACK PROCESSED SUCCESSFULLY ==========
```

### 2. Invalid Requests Will Be Rejected:
```
🟢 [DePay Webhook] ========== CALLBACK RECEIVED ==========
🟢 [DePay Webhook] Signature present: True
🟢 [DePay Webhook] Verifying signature...
❌ [DePay Webhook] Invalid signature
HTTP 401: Invalid signature  <-- BLOCKED!
```

---

## Action Required from You

**Please provide DePay's public key from app.depay.com:**

1. Login to https://app.depay.com
2. Navigate to your integration: `f2bfd96b-2ce7-4d74-93d6-6ec805750417`
3. Find and copy the **PUBLIC KEY** section
4. Paste it here

**The key should look like:**
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
(multiple lines)
...
-----END PUBLIC KEY-----
```

**Once you provide it, I'll:**
1. Update `DEPAY_PUBLIC_KEY` in `/app/backend/.env`
2. Remove "TEMPORARILY allow" bypass code
3. Enable strict signature verification
4. Restart backend
5. Test to ensure it works

---

## Current Bypass Code (To Be Removed)

### Configuration Endpoint:
```python
if not signature:
    logger.warning("DePay configuration: Missing x-signature header")
    # TEMPORARILY allow without signature for testing
    logger.warning("ALLOWING REQUEST WITHOUT SIGNATURE FOR TESTING")  # <-- REMOVE THIS
    # raise HTTPException(status_code=401, detail="Missing signature header")
```

### Callback Endpoint:
```python
if not signature:
    logger.warning("❌ [DePay Webhook] Missing x-signature header")
    # TEMPORARILY allow without signature for testing
    logger.warning("⚠️ [DePay Webhook] ALLOWING REQUEST WITHOUT SIGNATURE FOR TESTING")  # <-- REMOVE THIS
    # raise HTTPException(status_code=401, detail="Missing signature header")
```

**After fix:** These will throw proper 401 errors and reject unsigned requests.

---

## Why This is Important

**Security Benefits:**
- ✅ Ensures all requests actually come from DePay
- ✅ Prevents fake payment confirmations
- ✅ Prevents unauthorized access to configuration endpoint
- ✅ Required for production deployment

**Current Risk (with bypass):**
- ⚠️ Anyone can call the endpoints without authentication
- ⚠️ Could create fake payment confirmations
- ⚠️ Only safe because payment IDs are unpredictable UUIDs

---

**Ready to enable strict verification? Please provide DePay's public key from your dashboard.**
