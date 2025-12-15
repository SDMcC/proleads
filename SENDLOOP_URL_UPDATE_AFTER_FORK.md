# 🚨 URGENT: Sendloop Configuration Update Required (After Fork)

## Problem: "Invalid SSO Token" Error After Proleads Fork

You're seeing "Invalid SSO token" errors because Proleads has been forked to a **new preview URL**, but Sendloop is still configured to call the old URL.

---

## Root Cause

**What's happening:**
1. ✅ User clicks "Open Sendloop" in Proleads → SSO token is generated
2. ✅ User is redirected to Sendloop with the token
3. ❌ **Sendloop tries to verify token with OLD Proleads URL** → Gets 404 error
4. ❌ Sendloop shows "Invalid SSO token" error to user

**The Fix:** Update Sendloop's `PROLEADS_API_URL` environment variable to the new URL.

---

## Required Changes in Sendloop

### Step 1: Update Environment Variables

In your Sendloop `.env` file or environment configuration:

```bash
# ❌ OLD URL (no longer works):
PROLEADS_API_URL=https://proleads.network

# ✅ NEW URL (current forked instance):
PROLEADS_API_URL=https://proleads-refactor.preview.emergentagent.com

# API Key (unchanged):
PROLEADS_API_KEY=sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8
```

### Step 2: Restart Sendloop Backend

After updating the environment variable, restart your backend service:

```bash
# Use whichever restart command applies to your setup:
pm2 restart all
# OR
systemctl restart sendloop-backend
# OR
docker-compose restart
# OR
supervisorctl restart all
```

### Step 3: Verify the Fix

Test that Sendloop can now reach the Proleads API:

```bash
curl -X POST "https://proleads-refactor.preview.emergentagent.com/api/sso/verify" \
  -H "X-API-Key: sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8" \
  -H "Content-Type: application/json" \
  -d '{"sso_token":"test_token"}'
```

**Expected Response (200 OK):**
```json
{
  "valid": false,
  "user": null,
  "error": "Verification failed"
}
```

✅ This is correct! The test token is invalid (as expected), but **the API is reachable** (no 404 error).

---

## Updated API Endpoints Reference

All Proleads API endpoints now use the new base URL:

| Endpoint | Full URL |
|----------|----------|
| SSO Initiate | `https://proleads-refactor.preview.emergentagent.com/api/sso/initiate` |
| **SSO Verify** | `https://proleads-refactor.preview.emergentagent.com/api/sso/verify` |
| SSO User Info | `https://proleads-refactor.preview.emergentagent.com/api/sso/user-info` |
| CSV Export | `https://proleads-refactor.preview.emergentagent.com/api/integrations/csv-export` |
| CSV List | `https://proleads-refactor.preview.emergentagent.com/api/integrations/csv-files` |

---

## Testing the Complete SSO Flow

### From Proleads (Already Working):
1. User clicks "Open Sendloop"
2. Proleads generates SSO token
3. User is redirected to: `https://proleads-refactor.preview.emergentagent.com/dashboard?sso_token=eyJ...`

### From Sendloop (Needs Update):
1. Extract `sso_token` from URL query parameter
2. **Call the NEW Proleads API URL** to verify the token:
   ```
   POST https://proleads-refactor.preview.emergentagent.com/api/sso/verify
   ```
3. Create/login user based on the response
4. Redirect to Sendloop dashboard

---

## Quick Checklist

- [ ] Update `PROLEADS_API_URL` environment variable to new URL
- [ ] Verify API key is still configured correctly
- [ ] Restart Sendloop backend service
- [ ] Test SSO verification endpoint with curl (should get 200 response)
- [ ] Test complete SSO flow (user clicking "Open Sendloop" from Proleads)
- [ ] Verify user can access Sendloop dashboard after SSO login

---

## Summary

| Item | Status |
|------|--------|
| **Proleads SSO Token Generation** | ✅ Working |
| **Proleads SSO Verification Endpoint** | ✅ Working (tested) |
| **Sendloop Configuration** | ❌ Needs URL update |
| **Expected Fix Time** | ⏱️ 2-5 minutes |

---

## Still Having Issues?

If the error persists after updating:

1. **Check environment variable is loaded:**
   ```bash
   # In Sendloop backend terminal
   echo $PROLEADS_API_URL
   # Should output: https://proleads-refactor.preview.emergentagent.com
   ```

2. **Check for hardcoded URLs in code:**
   ```bash
   # Search for old URL in codebase
   grep -r "proleads.network" /path/to/sendloop/code
   ```

3. **Verify API key is correct:**
   ```bash
   curl -X POST "https://proleads-refactor.preview.emergentagent.com/api/sso/verify" \
     -H "X-API-Key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"sso_token":"test"}'
   ```

---

## Contact

If you continue experiencing issues after applying these changes, please contact the Proleads team with:
- Sendloop backend logs
- The exact error message
- Confirmation that environment variable was updated and service was restarted

---

**Last Updated:** December 15, 2024  
**Proleads Current URL:** https://proleads-refactor.preview.emergentagent.com  
**Status:** 🔴 Action Required by Sendloop Team
