# Sendloop SSO Integration - Complete Guide

## Overview

Proleads Network now has **Single Sign-On (SSO)** integration with Sendloop, allowing users to seamlessly access Sendloop without creating separate accounts.

---

## How It Works

### User Flow:
1. **User clicks "Open Sendloop"** in Proleads dashboard (Autoresponder or My Leads tab)
2. **Proleads generates SSO token** with user's credentials
3. **User is redirected to Sendloop** with the SSO token in the URL
4. **Sendloop verifies the token** by calling Proleads API
5. **Sendloop creates/logs in the user** automatically using Proleads data
6. **User accesses Sendloop** without entering credentials

---

## Technical Implementation

### Frontend Changes (Proleads)

**Before:**
```javascript
// Direct link - users had to login manually
onClick={() => window.open('https://sendloop.com/dashboard', '_blank')}
```

**After:**
```javascript
// SSO integration - automatic login
onClick={async () => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/sso/initiate`,
    {
      target_app: 'sendloop',
      redirect_url: 'https://drip-campaign-hub.preview.emergentagent.com/dashboard'
    },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  if (response.data.redirect_url) {
    window.open(response.data.redirect_url, '_blank');
  }
}}
```

### Backend API (Proleads)

**Endpoint:** `POST /api/sso/initiate`

**Request:**
```json
{
  "target_app": "sendloop",
  "redirect_url": "https://drip-campaign-hub.preview.emergentagent.com/dashboard"
}
```

**Response:**
```json
{
  "sso_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-01-27T10:45:00Z",
  "redirect_url": "https://drip-campaign-hub.preview.emergentagent.com/dashboard?sso_token=eyJ..."
}
```

**Token Payload:**
```json
{
  "token_id": "uuid",
  "user_id": "user-123",
  "email": "user@example.com",
  "username": "johndoe",
  "address": "0xABC...",
  "membership_tier": "gold",
  "subscription_expires_at": "2026-01-27T00:00:00Z",
  "target_app": "sendloop",
  "exp": 1706356800,
  "iat": 1706356200,
  "type": "sso"
}
```

---

## Integration Points

### 1. Autoresponder Tab
**Location:** User Dashboard → Autoresponder

**Features:**
- Large "Open Sendloop" button (top right)
- Initiates SSO automatically
- Redirects to Sendloop dashboard
- User is logged in automatically

### 2. My Leads Tab
**Location:** User Dashboard → My Leads

**Features:**
- Banner with "Open Sendloop" button
- "Export" button next to each CSV file
- All buttons use SSO (no manual login required)

---

## What Sendloop Needs to Do

### Step 1: Handle SSO Redirect

When a user is redirected from Proleads, Sendloop receives:
```
https://drip-campaign-hub.preview.emergentagent.com/dashboard?sso_token=eyJ...
```

### Step 2: Extract and Verify Token

**Sendloop should:**
1. Extract the `sso_token` from URL query parameters
2. Call Proleads API to verify the token
3. Create or login the user based on the response

**Verification Request:**
```bash
POST https://proleads.network/api/sso/verify
Headers:
  X-API-Key: <sendloop_api_key>
  Content-Type: application/json

Body:
{
  "sso_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Verification Response:**
```json
{
  "valid": true,
  "user": {
    "user_id": "user-123",
    "email": "user@example.com",
    "username": "johndoe",
    "address": "0xABC...",
    "membership_tier": "gold",
    "subscription_expires_at": "2026-01-27T00:00:00Z"
  }
}
```

### Step 3: Create/Login User

**If user doesn't exist in Sendloop:**
```javascript
// Create new user automatically
await db.users.insert({
  user_id: uuid(),
  email: user.email,
  username: user.username,
  proleads_user_id: user.user_id,
  proleads_membership_tier: user.membership_tier,
  created_via: 'sso',
  created_at: new Date()
});
```

**If user already exists:**
```javascript
// Update Proleads link
await db.users.update(
  { email: user.email },
  {
    proleads_user_id: user.user_id,
    proleads_linked_at: new Date()
  }
);
```

### Step 4: Create Sendloop Session

```javascript
// Generate Sendloop JWT token
const sendloopToken = createJWT(user.user_id, user.email);

// Set session cookie
response.setCookie('sendloop_token', sendloopToken, {
  httponly: true,
  secure: true,
  samesite: 'lax',
  maxAge: 7 * 24 * 60 * 60  // 7 days
});

// Redirect to dashboard
response.redirect('/dashboard');
```

---

## Security Features

### SSO Token Security
✅ **Short-lived:** 10 minutes expiration  
✅ **Single-use:** Can only be used once  
✅ **JWT-signed:** Tamper-proof  
✅ **Database tracking:** Audit trail for all SSO sessions

### API Key Security
✅ **Bcrypt hashed:** Keys never stored in plain text  
✅ **Rate limited:** 100 requests/hour  
✅ **Usage tracking:** Monitor API calls  
✅ **Rotation support:** 24-hour grace period

---

## Error Handling

### Token Expired
```json
{
  "valid": false,
  "error": "Token expired"
}
```
**Solution:** User should click "Open Sendloop" again to generate a new token.

### Token Already Used
```json
{
  "valid": false,
  "error": "Token already used"
}
```
**Solution:** User should click "Open Sendloop" again (tokens are single-use).

### Invalid API Key
```json
{
  "valid": false,
  "error": "Invalid API key"
}
```
**Solution:** Verify API key is correct in Sendloop environment variables.

---

## Testing the Integration

### Test Flow:
1. **Login to Proleads** as a test user
2. **Navigate to Autoresponder** or My Leads tab
3. **Click "Open Sendloop"** button
4. **Verify redirect** - Check URL has `?sso_token=` parameter
5. **Check Sendloop** - User should be logged in automatically
6. **Verify user data** - Check if Proleads data is in Sendloop

### Debug Tips:

**Check SSO token generation:**
```bash
# In browser console
const token = localStorage.getItem('token');
fetch('https://proleads.network/api/sso/initiate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    target_app: 'sendloop',
    redirect_url: 'https://drip-campaign-hub.preview.emergentagent.com/dashboard'
  })
}).then(r => r.json()).then(console.log);
```

**Test token verification:**
```bash
curl -X POST https://proleads.network/api/sso/verify \
  -H "X-API-Key: sendloop_live_key_xxx" \
  -H "Content-Type: application/json" \
  -d '{"sso_token": "eyJ..."}'
```

---

## Production Checklist for Sendloop

- [ ] Add SSO login handler at `/sso/login` or handle query param `?sso_token=`
- [ ] Extract `sso_token` from URL query parameters
- [ ] Call Proleads `/api/sso/verify` endpoint with API key
- [ ] Parse user data from verification response
- [ ] Create new Sendloop user if doesn't exist
- [ ] Link existing user to Proleads account
- [ ] Generate Sendloop session token
- [ ] Set secure session cookie
- [ ] Redirect to dashboard
- [ ] Handle error cases (expired token, invalid token, etc.)
- [ ] Test complete SSO flow
- [ ] Monitor SSO success/failure rates

---

## Environment Variables (Sendloop)

```bash
PROLEADS_API_URL=https://proleads.network
PROLEADS_API_KEY=sendloop_live_key_<your_key_here>
PROLEADS_SSO_ENABLED=true
```

---

## Updated URLs

**Production URL:** (Update when available)
```
https://sendloop.yourdomain.com
```

**Preview URL:**
```
https://drip-campaign-hub.preview.emergentagent.com/dashboard
```

---

## Benefits for Users

✅ **No separate account creation** - Uses Proleads credentials  
✅ **Seamless access** - One-click login  
✅ **Single identity** - Same user across both platforms  
✅ **Automatic sync** - Membership tier and subscription data  
✅ **Secure** - No password sharing or storage  

---

## API Endpoints Reference

### Proleads API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/sso/initiate` | POST | Generate SSO token | User JWT |
| `/api/sso/verify` | POST | Verify SSO token | API Key |
| `/api/sso/user-info` | GET | Get user details | API Key |
| `/api/integrations/csv-export` | POST | Export CSV data | API Key |
| `/api/integrations/csv-files` | GET | List CSV files | API Key |

---

## Support

**Technical Issues:**
- Check SSO token in URL
- Verify API key is valid
- Check Sendloop logs for verification errors
- Review Proleads SSO session in database

**Contact:**
- Email: support@proleads.network
- API Key Issues: Generate new key in Admin → Integrations

---

## Status

🟢 **Proleads Side:** Complete and tested  
🟡 **Sendloop Side:** Pending implementation  
🔵 **Integration:** Ready for testing once Sendloop implements SSO handler

**Last Updated:** 2025-01-27
