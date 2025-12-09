# URGENT: Sendloop Environment Variable Update Required

## Issue: "Invalid SSO Token" Error

Users are getting "Invalid SSO token" errors when trying to login to Sendloop from Proleads. This is because Sendloop's backend is calling the wrong Proleads API URL.

---

## What Needs to Be Updated

### Current Sendloop Configuration (INCORRECT):
```bash
PROLEADS_API_URL=https://proleads.network  # ❌ This doesn't exist
```

### Required Sendloop Configuration (CORRECT):
```bash
PROLEADS_API_URL=https://payment-flow-70.preview.emergentagent.com  # ✅ Correct URL
PROLEADS_API_KEY=sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8
```

---

## Why This Is Happening

When a user clicks "Open Sendloop" or "Export" in Proleads:

1. **Proleads generates SSO token** ✅ (This works - we can see it in logs)
2. **User is redirected to Sendloop** with token ✅ (This works)
3. **Sendloop tries to verify token** with Proleads API ❌ (This fails)
   - Sendloop calls: `https://proleads.network/api/sso/verify`
   - But should call: `https://payment-flow-70.preview.emergentagent.com/api/sso/verify`

**Result:** Sendloop gets 404 error and shows "Invalid SSO token" to user.

---

## How to Fix (Sendloop Team)

### Step 1: Update Environment Variables

In your Sendloop `.env` file or environment configuration:

```bash
# Update this line:
PROLEADS_API_URL=https://payment-flow-70.preview.emergentagent.com

# Ensure API key is correct:
PROLEADS_API_KEY=sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8
```

### Step 2: Restart Sendloop Backend

```bash
# Restart your backend service to load new environment variables
pm2 restart all
# OR
systemctl restart sendloop-backend
# OR whatever your restart command is
```

### Step 3: Test SSO Verification

Test that Sendloop can now reach Proleads API:

```bash
curl -X POST "https://payment-flow-70.preview.emergentagent.com/api/sso/verify" \
  -H "X-API-Key: sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8" \
  -H "Content-Type: application/json" \
  -d '{"sso_token":"test_token"}'

# Expected response (200 OK):
# {"valid":false,"user":null,"error":"Verification failed"}
# (This is correct - the token is invalid, but API is reachable!)
```

---

## Verification Checklist

After updating, verify these work:

- [ ] SSO verification endpoint is reachable from Sendloop backend
- [ ] Test token returns response (even if invalid)
- [ ] Real SSO login from Proleads works
- [ ] CSV import from Proleads works

---

## Quick Test from Sendloop Backend

Run this in your Sendloop backend terminal/server:

```javascript
// Node.js test
const axios = require('axios');

axios.post(
  'https://payment-flow-70.preview.emergentagent.com/api/sso/verify',
  { sso_token: 'test' },
  {
    headers: {
      'X-API-Key': 'sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8',
      'Content-Type': 'application/json'
    }
  }
).then(response => {
  console.log('✅ Proleads API is reachable!');
  console.log('Response:', response.data);
}).catch(error => {
  console.error('❌ Cannot reach Proleads API');
  console.error('Error:', error.message);
});
```

```python
# Python test
import requests

response = requests.post(
    'https://payment-flow-70.preview.emergentagent.com/api/sso/verify',
    headers={
        'X-API-Key': 'sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8',
        'Content-Type': 'application/json'
    },
    json={'sso_token': 'test'}
)

if response.status_code == 200:
    print('✅ Proleads API is reachable!')
    print('Response:', response.json())
else:
    print('❌ Cannot reach Proleads API')
    print('Status:', response.status_code)
```

---

## Updated URLs Reference

### All Proleads API Endpoints

| Endpoint | Full URL |
|----------|----------|
| SSO Initiate | `https://payment-flow-70.preview.emergentagent.com/api/sso/initiate` |
| SSO Verify | `https://payment-flow-70.preview.emergentagent.com/api/sso/verify` |
| SSO User Info | `https://payment-flow-70.preview.emergentagent.com/api/sso/user-info` |
| CSV Export | `https://payment-flow-70.preview.emergentagent.com/api/integrations/csv-export` |
| CSV List | `https://payment-flow-70.preview.emergentagent.com/api/integrations/csv-files` |

### Sendloop Redirect URLs (Proleads uses these)

| Purpose | Full URL |
|---------|----------|
| Dashboard Login | `https://payment-flow-70.preview.emergentagent.com/dashboard` |
| CSV Import | `https://payment-flow-70.preview.emergentagent.com/import` |

---

## Summary

**Problem:** Sendloop is calling wrong Proleads API URL  
**Solution:** Update `PROLEADS_API_URL` to `https://payment-flow-70.preview.emergentagent.com`  
**Time to Fix:** 2 minutes (update .env + restart)  
**Expected Result:** SSO login and CSV import will work immediately

---

## Status

🔴 **Current:** SSO failing - users getting "Invalid token" error  
🟢 **After Fix:** SSO will work - users can login seamlessly  

**ETA:** Should be fixed within minutes once environment variable is updated

---

**Contact:** If issues persist after updating, contact Proleads team
