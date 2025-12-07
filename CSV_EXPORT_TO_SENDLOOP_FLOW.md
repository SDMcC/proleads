# CSV Export to Sendloop - Complete Flow Guide

## Updated Implementation ✅

The CSV export flow has been updated to properly pass file information to Sendloop during SSO.

---

## How It Works Now

### User Flow:
1. **User views "My Leads"** tab in Proleads
2. **Clicks "Export"** button next to a CSV file
3. **Proleads generates SSO token** with file information in the redirect URL
4. **User is redirected to Sendloop** at `/import` page with parameters
5. **Sendloop verifies SSO token** and logs user in
6. **Sendloop automatically fetches the CSV** from Proleads API
7. **User sees imported leads** in Sendloop

---

## Technical Flow

### Step 1: User Clicks Export Button

**What Happens in Proleads:**
```javascript
// 1. Get current user info
const userResponse = await axios.get(`${API_URL}/users/me`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const userId = userResponse.data.user_id;

// 2. Build redirect URL with file information
const redirectUrl = `https://mailer-hub.preview.emergentagent.com/import?user_id=${userId}&file_id=${file.file_id}&source=proleads`;

// 3. Initiate SSO with this redirect URL
const response = await axios.post(
  `${API_URL}/sso/initiate`,
  {
    target_app: 'sendloop',
    redirect_url: redirectUrl
  },
  { headers: { 'Authorization': `Bearer ${token}` } }
);

// 4. Open Sendloop with SSO token
window.open(response.data.redirect_url, '_blank');
```

**Resulting URL:**
```
https://mailer-hub.preview.emergentagent.com/import?user_id=user-123&file_id=csv-456&source=proleads&sso_token=eyJ...
```

---

### Step 2: Sendloop Handles the Request

**Sendloop should:**

1. **Extract parameters from URL:**
```javascript
const urlParams = new URLSearchParams(window.location.search);
const ssoToken = urlParams.get('sso_token');
const userId = urlParams.get('user_id');
const fileId = urlParams.get('file_id');
const source = urlParams.get('source');
```

2. **Verify SSO token and log user in:**
```javascript
const response = await fetch('https://smartlead-hub-2.preview.emergentagent.com/api/sso/verify', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ sso_token: ssoToken })
});

const { valid, user } = await response.json();

if (valid) {
  // Create Sendloop session for this user
  createSession(user);
}
```

3. **Fetch CSV data from Proleads:**
```javascript
const csvResponse = await fetch('https://smartlead-hub-2.preview.emergentagent.com/api/integrations/csv-export', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: userId,
    file_id: fileId,
    format: 'csv'
  })
});

const { success, csv_data, metadata } = await csvResponse.json();

if (success) {
  // Parse and import the CSV data
  importLeadsFromCSV(csv_data, metadata);
}
```

4. **Show success message:**
```javascript
showNotification(`Successfully imported ${metadata.line_count} leads from Proleads!`);
```

---

## New Proleads Endpoint

### GET /api/users/me

**Purpose:** Get current user's basic information

**Authentication:** User JWT token

**Response:**
```json
{
  "user_id": "user-123-456",
  "address": "0xABC...",
  "username": "johndoe",
  "email": "user@example.com",
  "membership_tier": "gold"
}
```

---

## Sendloop Implementation Guide

### 1. Create /import Route Handler

**File:** `sendloop/frontend/src/pages/ImportPage.jsx` (or similar)

```javascript
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

function ImportPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Importing leads from Proleads...');
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    const handleImport = async () => {
      try {
        // Get parameters
        const ssoToken = searchParams.get('sso_token');
        const userId = searchParams.get('user_id');
        const fileId = searchParams.get('file_id');
        const source = searchParams.get('source');

        if (!ssoToken || !userId || !fileId) {
          setStatus('error');
          setMessage('Missing required parameters');
          return;
        }

        // Call backend to handle SSO and import
        const response = await fetch('/api/import/from-proleads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ssoToken, userId, fileId })
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(`Successfully imported ${data.importedCount} leads!`);
          setImportedCount(data.importedCount);
          
          // Redirect to campaigns page after 3 seconds
          setTimeout(() => {
            window.location.href = '/campaigns';
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to import leads');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during import');
        console.error('Import error:', error);
      }
    };

    handleImport();
  }, [searchParams]);

  return (
    <div className="import-page">
      {status === 'processing' && (
        <div className="loading">
          <div className="spinner"></div>
          <p>{message}</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="success">
          <h2>✅ Import Successful!</h2>
          <p>{message}</p>
          <p>Redirecting to campaigns...</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="error">
          <h2>❌ Import Failed</h2>
          <p>{message}</p>
          <button onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default ImportPage;
```

### 2. Create Backend Import Handler

**File:** `sendloop/backend/routes/import.py` (or similar)

```python
from fastapi import APIRouter, HTTPException
import httpx
import os

router = APIRouter()

PROLEADS_API_URL = os.environ.get("PROLEADS_API_URL")
PROLEADS_API_KEY = os.environ.get("PROLEADS_API_KEY")

@router.post("/api/import/from-proleads")
async def import_from_proleads(request: ImportRequest):
    """
    Handle SSO verification and CSV import from Proleads
    """
    try:
        # 1. Verify SSO token
        async with httpx.AsyncClient() as client:
            verify_response = await client.post(
                f"{PROLEADS_API_URL}/api/sso/verify",
                headers={"X-API-Key": PROLEADS_API_KEY},
                json={"sso_token": request.ssoToken}
            )
            
            if verify_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid SSO token")
            
            verify_data = verify_response.json()
            if not verify_data.get("valid"):
                raise HTTPException(status_code=401, detail=verify_data.get("error"))
            
            user_data = verify_data.get("user")
        
        # 2. Create or login user in Sendloop
        sendloop_user = await get_or_create_user(user_data)
        
        # 3. Fetch CSV from Proleads
        async with httpx.AsyncClient() as client:
            csv_response = await client.post(
                f"{PROLEADS_API_URL}/api/integrations/csv-export",
                headers={"X-API-Key": PROLEADS_API_KEY},
                json={
                    "user_id": request.userId,
                    "file_id": request.fileId,
                    "format": "csv"
                }
            )
            
            if csv_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch CSV")
            
            csv_data = csv_response.json()
            if not csv_data.get("success"):
                raise HTTPException(status_code=500, detail="CSV export failed")
        
        # 4. Parse and import CSV
        csv_content = csv_data.get("csv_data")
        metadata = csv_data.get("metadata")
        
        imported_count = await import_leads_to_sendloop(
            sendloop_user.id,
            csv_content,
            metadata
        )
        
        return {
            "success": True,
            "importedCount": imported_count,
            "filename": metadata.get("filename")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Import failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Import failed")


async def import_leads_to_sendloop(user_id, csv_content, metadata):
    """
    Parse CSV and import leads into Sendloop database
    """
    lines = csv_content.strip().split('\n')
    if len(lines) <= 1:
        return 0
    
    # Skip header row
    headers = lines[0].split(',')
    imported_count = 0
    
    for line in lines[1:]:
        values = line.split(',')
        if len(values) >= 3:
            lead = {
                "user_id": user_id,
                "name": values[0].strip(),
                "email": values[1].strip(),
                "address": values[2].strip() if len(values) > 2 else "",
                "source": "proleads",
                "imported_at": datetime.utcnow(),
                "status": "active"
            }
            
            # Insert into Sendloop database
            await db.leads.insert_one(lead)
            imported_count += 1
    
    return imported_count
```

---

## Error Handling

### Common Errors and Solutions

#### 1. "Invalid SSO Token"
**Cause:** Token expired (10 minutes) or already used
**Solution:** User should click "Export" button again to generate new token

#### 2. "CSV file not found"
**Cause:** Invalid file_id or user doesn't have access
**Solution:** Verify file_id is correct and user owns the file

#### 3. "Rate limit exceeded"
**Cause:** More than 100 requests per hour
**Solution:** Wait for rate limit to reset (shown in error message)

#### 4. "Failed to fetch CSV"
**Cause:** Network error or Proleads API down
**Solution:** Check Proleads API status and retry

---

## Testing the Flow

### Manual Test Steps:

1. **Login to Proleads** as a user with CSV files
2. **Go to "My Leads"** tab
3. **Click "Export"** on a CSV file
4. **Verify redirect URL** contains:
   - `sso_token=xxx`
   - `user_id=xxx`
   - `file_id=xxx`
   - `source=proleads`
5. **Check Sendloop** verifies token and imports leads
6. **Verify leads** appear in Sendloop campaigns

### Test with cURL:

```bash
# 1. Generate SSO token with file info
USER_TOKEN="<user_jwt_token>"
curl -X POST "https://smartlead-hub-2.preview.emergentagent.com/api/sso/initiate" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_app": "sendloop",
    "redirect_url": "https://mailer-hub.preview.emergentagent.com/import?user_id=user-123&file_id=csv-456&source=proleads"
  }'

# 2. Extract SSO token from response
SSO_TOKEN="<token_from_step_1>"

# 3. Verify token (what Sendloop does)
curl -X POST "https://smartlead-hub-2.preview.emergentagent.com/api/sso/verify" \
  -H "X-API-Key: sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8" \
  -H "Content-Type: application/json" \
  -d "{\"sso_token\":\"$SSO_TOKEN\"}"

# 4. Fetch CSV (what Sendloop does)
curl -X POST "https://smartlead-hub-2.preview.emergentagent.com/api/integrations/csv-export" \
  -H "X-API-Key: sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "file_id": "csv-456",
    "format": "csv"
  }'
```

---

## Checklist for Sendloop

- [ ] Create `/import` route in frontend router
- [ ] Create `ImportPage` component to handle URL parameters
- [ ] Create backend `/api/import/from-proleads` endpoint
- [ ] Implement SSO token verification
- [ ] Implement CSV fetching from Proleads API
- [ ] Implement CSV parsing and lead import
- [ ] Add error handling for all steps
- [ ] Add loading states and success/error messages
- [ ] Test complete flow end-to-end
- [ ] Add logging for debugging

---

## Status

🟢 **Proleads Side:** Complete and tested  
- ✅ Export button passes file information
- ✅ SSO token includes redirect URL with parameters
- ✅ `/api/users/me` endpoint added
- ✅ All backend endpoints working

🟡 **Sendloop Side:** Needs implementation  
- [ ] Create `/import` page handler
- [ ] Implement CSV fetch and import logic

**Expected Result:** Click "Export" → Auto-login to Sendloop → Leads imported automatically!

---

## Support

**If export still shows "Invalid token":**
1. Check browser console for errors
2. Verify SSO token is in the URL
3. Check Sendloop logs for SSO verification errors
4. Ensure Sendloop is using correct API URL and key

**Contact:** support@proleads.network
