# Sendloop Integration - Corrected URLs ✅

## Issue Resolved

The `/api/sso/verify` endpoint **IS WORKING**! The issue was that Sendloop was using the wrong URL.

---

## Correct URLs for Sendloop

### ❌ WRONG (What Sendloop was using):
```
https://proleads.network/api/sso/verify
```
**Result:** 404 Not Found

### ✅ CORRECT (What Sendloop should use):

**Preview Environment:**
```
https://marketing-hub-162.preview.emergentagent.com/api/sso/verify
```

**Production Environment:** (Update when deployed)
```
https://proleads.yourdomain.com/api/sso/verify
```

---

## Working API Key for Testing

I've generated a fresh API key for Sendloop:

```
sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8
```

**Permissions:**
- ✅ csv_export
- ✅ user_info
- ✅ sso_verify

**Rate Limit:** 100 requests/hour

---

## Verified Working Test

```bash
curl -X POST "https://marketing-hub-162.preview.emergentagent.com/api/sso/verify" \
  -H "X-API-Key: sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8" \
  -H "Content-Type: application/json" \
  -d '{"sso_token":"test"}'

# Response (with invalid token - expected):
{
  "valid": false,
  "user": null,
  "error": "Verification failed"
}

# Response code: 200 OK (NOT 404!)
```

---

## What Sendloop Needs to Update

### Environment Variables

**Update in Sendloop's `.env` file:**

```bash
# ❌ OLD (WRONG)
PROLEADS_API_URL=https://proleads.network

# ✅ NEW (CORRECT)
PROLEADS_API_URL=https://marketing-hub-162.preview.emergentagent.com

# Updated API Key
PROLEADS_API_KEY=sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8
```

### Code Changes Required

**In Sendloop's backend code, update the API URL:**

```python
# proleads_integration.py or similar file

import os

class ProleadsIntegration:
    def __init__(self):
        # ❌ OLD
        # self.api_url = "https://proleads.network"
        
        # ✅ NEW
        self.api_url = os.environ.get("PROLEADS_API_URL", "https://marketing-hub-162.preview.emergentagent.com")
        self.api_key = os.environ.get("PROLEADS_API_KEY")
```

---

## Complete SSO Flow Test

### Step 1: Generate SSO Token (from Proleads)

```bash
# Login as a test user first
USER_TOKEN=$(curl -s "https://marketing-hub-162.preview.emergentagent.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Generate SSO token
curl -X POST "https://marketing-hub-162.preview.emergentagent.com/api/sso/initiate" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_app": "sendloop",
    "redirect_url": "https://marketing-hub-162.preview.emergentagent.com/dashboard"
  }' | python3 -m json.tool
```

**Response:**
```json
{
  "sso_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-12-07T20:00:00Z",
  "redirect_url": "https://marketing-hub-162.preview.emergentagent.com/dashboard?sso_token=eyJ..."
}
```

### Step 2: Verify SSO Token (from Sendloop)

```bash
SSO_TOKEN="<token_from_step_1>"

curl -X POST "https://marketing-hub-162.preview.emergentagent.com/api/sso/verify" \
  -H "X-API-Key: sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8" \
  -H "Content-Type: application/json" \
  -d "{\"sso_token\":\"$SSO_TOKEN\"}" | python3 -m json.tool
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "user_id": "user-123",
    "email": "testuser@example.com",
    "username": "testuser",
    "address": "0xABC...",
    "membership_tier": "gold",
    "subscription_expires_at": "2026-01-27T00:00:00Z"
  }
}
```

---

## All Working Endpoints

| Endpoint | Method | URL |
|----------|--------|-----|
| SSO Initiate | POST | `https://marketing-hub-162.preview.emergentagent.com/api/sso/initiate` |
| SSO Verify | POST | `https://marketing-hub-162.preview.emergentagent.com/api/sso/verify` |
| SSO User Info | GET | `https://marketing-hub-162.preview.emergentagent.com/api/sso/user-info` |
| CSV Export | POST | `https://marketing-hub-162.preview.emergentagent.com/api/integrations/csv-export` |
| CSV List | GET | `https://marketing-hub-162.preview.emergentagent.com/api/integrations/csv-files` |

---

## Deployment Notes

### For Preview/Testing:
- Use: `https://marketing-hub-162.preview.emergentagent.com`
- API Key: `sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8`

### For Production (Future):
- Update to actual production domain
- Generate new production API key (in Admin → Integrations)
- Update Sendloop environment variables

---

## Status

🟢 **Proleads API:** WORKING (all endpoints tested and verified)  
🟡 **Sendloop Config:** Needs to update URL and API key  
🔵 **Integration:** Will work immediately after Sendloop updates

---

## Quick Fix Checklist for Sendloop

- [ ] Update `PROLEADS_API_URL` to `https://marketing-hub-162.preview.emergentagent.com`
- [ ] Update `PROLEADS_API_KEY` to `sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8`
- [ ] Restart Sendloop backend
- [ ] Test `/api/sso/verify` endpoint (should return 200, not 404)
- [ ] Test complete SSO flow

**Estimated fix time:** 5 minutes (just environment variables!)

---

## Support

If Sendloop still gets 404 after updating:
1. Verify environment variables are loaded
2. Check if hard-coded URL exists in code
3. Restart Sendloop application
4. Test with curl first before testing full flow

**Contact:** support@proleads.network
