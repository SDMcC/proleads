# Sendloop Import Implementation Guide
## Complete Guide for Proleads CSV Import Integration

**Version:** 1.0  
**Date:** 2025-01-27  
**For:** Sendloop Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [What You'll Receive](#what-youll-receive)
3. [Implementation Steps](#implementation-steps)
4. [Frontend Implementation](#frontend-implementation)
5. [Backend Implementation](#backend-implementation)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Testing Guide](#testing-guide)
8. [Error Handling](#error-handling)
9. [Security Considerations](#security-considerations)

---

## Overview

When a Proleads user clicks "Export" on a CSV file, they will be redirected to your Sendloop application at the `/import` page with URL parameters containing:
- SSO token for authentication
- User ID from Proleads
- File ID to fetch
- Source identifier

Your task is to:
1. Extract parameters from URL
2. Verify the SSO token with Proleads API
3. Create/login the user in Sendloop
4. Fetch the CSV data from Proleads API
5. Import the leads into Sendloop
6. Show success/error messages

---

## What You'll Receive

### URL Format

Users will be redirected to:
```
https://marketer-auth-bridge.preview.emergentagent.com/import?user_id=USER_ID&file_id=FILE_ID&source=proleads&sso_token=SSO_TOKEN
```

### URL Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `sso_token` | string | JWT token for authentication (10 min expiry) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `user_id` | string | Proleads user identifier | `user-123-456-789` |
| `file_id` | string | CSV file identifier in Proleads | `csv-abc-def-123` |
| `source` | string | Always "proleads" | `proleads` |

### Example Complete URL
```
https://marketer-auth-bridge.preview.emergentagent.com/import?user_id=payment-flow-70&file_id=payment-flow-70&source=proleads&sso_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl9pZCI6IjEyMy00NTYiLCJ1c2VyX2lkIjoidXNlci0xMjMiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6ImpvaG5kb2UiLCJhZGRyZXNzIjoiMHhBQkMuLi4iLCJtZW1iZXJzaGlwX3RpZXIiOiJnb2xkIiwiZXhwIjoxNzA2MzU2ODAwfQ.xxxxx
```

---

## Implementation Steps

### Step 1: Create Frontend Import Page
### Step 2: Create Backend API Handler
### Step 3: Verify SSO Token with Proleads
### Step 4: Fetch CSV Data from Proleads
### Step 5: Parse and Import Leads
### Step 6: Handle Errors and Success

---

## Frontend Implementation

### Option A: React Implementation

**File:** `src/pages/ImportPage.jsx`

```jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ImportPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Importing leads from Proleads...');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    handleImport();
  }, []);

  const handleImport = async () => {
    try {
      // Extract parameters from URL
      const ssoToken = searchParams.get('sso_token');
      const userId = searchParams.get('user_id');
      const fileId = searchParams.get('file_id');
      const source = searchParams.get('source');

      // Validate required parameters
      if (!ssoToken || !userId || !fileId) {
        setStatus('error');
        setMessage('Missing required parameters. Please try exporting from Proleads again.');
        return;
      }

      // Call your backend to handle the import
      const response = await axios.post('/api/import/from-proleads', {
        ssoToken,
        userId,
        fileId,
        source
      });

      if (response.data.success) {
        setStatus('success');
        setMessage(`Successfully imported ${response.data.leadsImported} leads!`);
        setDetails({
          filename: response.data.filename,
          leadsImported: response.data.leadsImported,
          campaignId: response.data.campaignId
        });

        // Redirect to campaigns page after 3 seconds
        setTimeout(() => {
          if (response.data.campaignId) {
            navigate(`/campaigns/${response.data.campaignId}`);
          } else {
            navigate('/campaigns');
          }
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.data.error || 'Failed to import leads');
      }
    } catch (error) {
      console.error('Import error:', error);
      setStatus('error');
      
      if (error.response?.status === 401) {
        setMessage('Authentication failed. Please try exporting from Proleads again.');
      } else if (error.response?.status === 429) {
        setMessage('Rate limit exceeded. Please try again in a few minutes.');
      } else {
        setMessage(error.response?.data?.error || 'An error occurred during import. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Importing Leads</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">This may take a moment...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Import Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            
            {details && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">File:</span>
                  <span className="font-medium">{details.filename}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Leads Imported:</span>
                  <span className="font-medium text-green-600">{details.leadsImported}</span>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-500">Redirecting to campaigns...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Import Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPage;
```

**Router Configuration:**

Add to your router (e.g., `App.jsx` or `routes.jsx`):

```jsx
import ImportPage from './pages/ImportPage';

// In your routes configuration
<Route path="/import" element={<ImportPage />} />
```

---

## Backend Implementation

### Configuration

**Environment Variables (`.env`):**

```bash
# Proleads API Configuration
PROLEADS_API_URL=https://marketer-auth-bridge.preview.emergentagent.com
PROLEADS_API_KEY=sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8
```

### Backend Handler

**File:** `backend/routes/import.py` (FastAPI) or `backend/routes/import.js` (Express)

#### FastAPI Implementation (Python)

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
import os
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Configuration
PROLEADS_API_URL = os.environ.get("PROLEADS_API_URL")
PROLEADS_API_KEY = os.environ.get("PROLEADS_API_KEY")

class ImportRequest(BaseModel):
    ssoToken: str
    userId: str
    fileId: str
    source: str = "proleads"

@router.post("/api/import/from-proleads")
async def import_from_proleads(request: ImportRequest):
    """
    Handle CSV import from Proleads via SSO
    
    Steps:
    1. Verify SSO token with Proleads
    2. Create/login user in Sendloop
    3. Fetch CSV data from Proleads
    4. Parse and import leads
    5. Return success/error response
    """
    try:
        logger.info(f"Starting import for user_id={request.userId}, file_id={request.fileId}")
        
        # Step 1: Verify SSO token with Proleads
        async with httpx.AsyncClient(timeout=30.0) as client:
            verify_response = await client.post(
                f"{PROLEADS_API_URL}/api/sso/verify",
                headers={
                    "X-API-Key": PROLEADS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={"sso_token": request.ssoToken}
            )
            
            if verify_response.status_code != 200:
                logger.error(f"SSO verification failed: {verify_response.status_code}")
                raise HTTPException(
                    status_code=401, 
                    detail="Invalid or expired SSO token. Please try exporting from Proleads again."
                )
            
            verify_data = verify_response.json()
            
            if not verify_data.get("valid"):
                logger.error(f"SSO token invalid: {verify_data.get('error')}")
                raise HTTPException(
                    status_code=401,
                    detail=verify_data.get("error", "Invalid SSO token")
                )
            
            proleads_user = verify_data.get("user")
            logger.info(f"SSO verified for user: {proleads_user.get('email')}")
        
        # Step 2: Create or get existing Sendloop user
        sendloop_user = await get_or_create_sendloop_user(proleads_user)
        
        # Step 3: Fetch CSV data from Proleads
        async with httpx.AsyncClient(timeout=30.0) as client:
            csv_response = await client.post(
                f"{PROLEADS_API_URL}/api/integrations/csv-export",
                headers={
                    "X-API-Key": PROLEADS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "user_id": request.userId,
                    "file_id": request.fileId,
                    "format": "csv"
                }
            )
            
            if csv_response.status_code == 429:
                logger.warning("Rate limit exceeded")
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Please try again in a few minutes."
                )
            
            if csv_response.status_code != 200:
                logger.error(f"CSV fetch failed: {csv_response.status_code}")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to fetch CSV from Proleads"
                )
            
            csv_data = csv_response.json()
            
            if not csv_data.get("success"):
                logger.error(f"CSV export failed: {csv_data.get('error')}")
                raise HTTPException(
                    status_code=500,
                    detail=csv_data.get("error", "CSV export failed")
                )
            
            csv_content = csv_data.get("csv_data")
            metadata = csv_data.get("metadata")
            logger.info(f"CSV fetched: {metadata.get('line_count')} leads")
        
        # Step 4: Parse and import leads
        leads_imported = await import_leads_to_sendloop(
            sendloop_user["id"],
            csv_content,
            metadata,
            request.fileId
        )
        
        logger.info(f"Import successful: {leads_imported} leads imported")
        
        return {
            "success": True,
            "leadsImported": leads_imported,
            "filename": metadata.get("filename"),
            "campaignId": sendloop_user.get("default_campaign_id"),
            "message": f"Successfully imported {leads_imported} leads from Proleads"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Import failed with exception: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during import"
        )


async def get_or_create_sendloop_user(proleads_user):
    """
    Create Sendloop user or get existing user linked to Proleads
    """
    from your_app.database import db  # Import your database
    
    email = proleads_user.get("email")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email})
    
    if existing_user:
        # Update Proleads link if not already linked
        if not existing_user.get("proleads_user_id"):
            await db.users.update_one(
                {"email": email},
                {
                    "$set": {
                        "proleads_user_id": proleads_user.get("user_id"),
                        "proleads_linked_at": datetime.utcnow(),
                        "proleads_membership_tier": proleads_user.get("membership_tier")
                    }
                }
            )
        
        logger.info(f"Existing user found: {email}")
        return existing_user
    
    # Create new user
    new_user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "username": proleads_user.get("username"),
        "proleads_user_id": proleads_user.get("user_id"),
        "proleads_address": proleads_user.get("address"),
        "proleads_membership_tier": proleads_user.get("membership_tier"),
        "created_via": "sso_proleads",
        "created_at": datetime.utcnow(),
        "proleads_linked_at": datetime.utcnow()
    }
    
    await db.users.insert_one(new_user)
    logger.info(f"New user created: {email}")
    
    return new_user


async def import_leads_to_sendloop(user_id, csv_content, metadata, file_id):
    """
    Parse CSV content and import leads into Sendloop database
    
    CSV Format: Name,Email,Address
    """
    from your_app.database import db  # Import your database
    import uuid
    
    lines = csv_content.strip().split('\n')
    
    if len(lines) <= 1:
        logger.warning("CSV file is empty or has no data rows")
        return 0
    
    # Parse header (first line)
    headers = lines[0].split(',')
    logger.info(f"CSV headers: {headers}")
    
    # Import leads (skip header row)
    imported_count = 0
    skipped_count = 0
    
    for line in lines[1:]:
        try:
            values = line.split(',')
            
            if len(values) < 2:  # At least name and email required
                skipped_count += 1
                continue
            
            name = values[0].strip()
            email = values[1].strip()
            address = values[2].strip() if len(values) > 2 else ""
            
            # Validate email
            if not email or '@' not in email:
                logger.warning(f"Invalid email skipped: {email}")
                skipped_count += 1
                continue
            
            # Check for duplicate
            existing_lead = await db.leads.find_one({
                "user_id": user_id,
                "email": email
            })
            
            if existing_lead:
                logger.debug(f"Duplicate lead skipped: {email}")
                skipped_count += 1
                continue
            
            # Create lead record
            lead = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": name,
                "email": email,
                "address": address,
                "source": "proleads",
                "proleads_file_id": file_id,
                "imported_at": datetime.utcnow(),
                "status": "active",
                "tags": ["proleads", "imported"]
            }
            
            await db.leads.insert_one(lead)
            imported_count += 1
            
        except Exception as e:
            logger.error(f"Failed to import lead: {str(e)}")
            skipped_count += 1
            continue
    
    logger.info(f"Import complete: {imported_count} imported, {skipped_count} skipped")
    
    # Log import event
    await db.import_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "source": "proleads",
        "file_id": file_id,
        "filename": metadata.get("filename"),
        "leads_imported": imported_count,
        "leads_skipped": skipped_count,
        "imported_at": datetime.utcnow()
    })
    
    return imported_count
```

#### Express.js Implementation (JavaScript/Node.js)

```javascript
const express = require('express');
const axios = require('axios');
const router = express.Router();

const PROLEADS_API_URL = process.env.PROLEADS_API_URL;
const PROLEADS_API_KEY = process.env.PROLEADS_API_KEY;

router.post('/api/import/from-proleads', async (req, res) => {
  try {
    const { ssoToken, userId, fileId, source } = req.body;
    
    // Step 1: Verify SSO token
    const verifyResponse = await axios.post(
      `${PROLEADS_API_URL}/api/sso/verify`,
      { sso_token: ssoToken },
      {
        headers: {
          'X-API-Key': PROLEADS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!verifyResponse.data.valid) {
      return res.status(401).json({
        success: false,
        error: verifyResponse.data.error || 'Invalid SSO token'
      });
    }
    
    const proleadsUser = verifyResponse.data.user;
    
    // Step 2: Create or get user
    const sendloopUser = await getOrCreateUser(proleadsUser);
    
    // Step 3: Fetch CSV
    const csvResponse = await axios.post(
      `${PROLEADS_API_URL}/api/integrations/csv-export`,
      {
        user_id: userId,
        file_id: fileId,
        format: 'csv'
      },
      {
        headers: {
          'X-API-Key': PROLEADS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!csvResponse.data.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch CSV from Proleads'
      });
    }
    
    const csvContent = csvResponse.data.csv_data;
    const metadata = csvResponse.data.metadata;
    
    // Step 4: Import leads
    const leadsImported = await importLeads(
      sendloopUser.id,
      csvContent,
      metadata,
      fileId
    );
    
    res.json({
      success: true,
      leadsImported,
      filename: metadata.filename,
      message: `Successfully imported ${leadsImported} leads`
    });
    
  } catch (error) {
    console.error('Import error:', error);
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Import failed. Please try again.'
    });
  }
});

async function importLeads(userId, csvContent, metadata, fileId) {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length <= 1) return 0;
  
  let imported = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    
    if (values.length < 2) continue;
    
    const lead = {
      user_id: userId,
      name: values[0].trim(),
      email: values[1].trim(),
      address: values[2]?.trim() || '',
      source: 'proleads',
      proleads_file_id: fileId,
      imported_at: new Date(),
      status: 'active'
    };
    
    // Insert into your database
    await db.leads.insertOne(lead);
    imported++;
  }
  
  return imported;
}

module.exports = router;
```

---

## API Endpoints Reference

### Proleads API Endpoints

All requests to Proleads API must include the API key in headers.

#### 1. Verify SSO Token

**Endpoint:** `POST /api/sso/verify`  
**URL:** `https://marketer-auth-bridge.preview.emergentagent.com/api/sso/verify`

**Request:**
```json
{
  "sso_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Headers:**
```
X-API-Key: sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "valid": true,
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "address": "0xABC123...",
    "membership_tier": "gold",
    "subscription_expires_at": "2026-01-27T00:00:00Z"
  }
}
```

**Response (Invalid Token - 200):**
```json
{
  "valid": false,
  "user": null,
  "error": "Token expired"
}
```

---

#### 2. Fetch CSV Data

**Endpoint:** `POST /api/integrations/csv-export`  
**URL:** `https://marketer-auth-bridge.preview.emergentagent.com/api/integrations/csv-export`

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "file_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "format": "csv"
}
```

**Headers:**
```
X-API-Key: sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "success": true,
  "csv_data": "Name,Email,Address\nJohn Doe,john@example.com,123 Main St\nJane Smith,jane@example.com,456 Oak Ave\n...",
  "metadata": {
    "filename": "leads_user-123_2025-01-27.csv",
    "line_count": 500,
    "exported_at": "2025-01-27T10:30:00Z",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "file_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
  }
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "error": "CSV file not found or user does not have access"
}
```

**Response (Rate Limit - 429):**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again in 60 seconds",
  "retry_after": 60
}
```

---

## Testing Guide

### Manual Testing Steps

1. **Get Test Credentials:**
   - Ask for a test Proleads account with CSV files
   - Or create your own test user in Proleads

2. **Test SSO Login First:**
   - Login to Proleads
   - Click "Open Sendloop" from Autoresponder tab
   - Verify you're logged into Sendloop automatically

3. **Test CSV Export:**
   - In Proleads, go to "My Leads" tab
   - Click "Export" on any CSV file
   - Verify redirect to `/import` page with parameters
   - Check that leads are imported successfully

### Testing with cURL

**Test SSO Verification:**
```bash
curl -X POST "https://marketer-auth-bridge.preview.emergentagent.com/api/sso/verify" \
  -H "X-API-Key: sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8" \
  -H "Content-Type: application/json" \
  -d '{"sso_token":"<your_token_here>"}'
```

**Test CSV Fetch:**
```bash
curl -X POST "https://marketer-auth-bridge.preview.emergentagent.com/api/integrations/csv-export" \
  -H "X-API-Key: sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "file_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "format": "csv"
  }'
```

### Test Cases

| Test Case | Expected Result |
|-----------|----------------|
| Valid SSO token + valid file | Import succeeds, leads imported |
| Expired SSO token | Error: "Invalid or expired SSO token" |
| Invalid file_id | Error: "CSV file not found" |
| User doesn't own file | Error: "User does not have access" |
| Rate limit exceeded | Error: "Rate limit exceeded" |
| Empty CSV file | Import succeeds with 0 leads |
| Duplicate leads | Duplicates skipped |

---

## Error Handling

### Common Errors

#### 1. Invalid or Expired SSO Token

**Error:**
```json
{
  "valid": false,
  "error": "Token expired"
}
```

**Cause:** SSO token has 10-minute expiry or was already used (single-use)

**Solution:** Show user-friendly message asking them to export again from Proleads

---

#### 2. CSV File Not Found

**Error:**
```json
{
  "success": false,
  "error": "CSV file not found or user does not have access"
}
```

**Cause:** Invalid file_id or user doesn't own the file

**Solution:** Show error and link back to Proleads

---

#### 3. Rate Limit Exceeded

**Error:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again in 60 seconds"
}
```

**Cause:** More than 100 requests per hour

**Solution:** Show retry message with countdown timer

---

#### 4. Network/API Errors

**Causes:**
- Proleads API is down
- Network timeout
- Invalid API key

**Solution:** Show generic error with retry option

---

### Error Response Format

Your `/api/import/from-proleads` endpoint should return:

**Success:**
```json
{
  "success": true,
  "leadsImported": 500,
  "filename": "leads_user-123.csv",
  "campaignId": "campaign-456",
  "message": "Successfully imported 500 leads"
}
```

**Error:**
```json
{
  "success": false,
  "error": "User-friendly error message here"
}
```

---

## Security Considerations

### 1. API Key Security

✅ **DO:**
- Store API key in environment variables
- Never expose API key in frontend code
- Use HTTPS for all API requests
- Rotate API key if compromised

❌ **DON'T:**
- Commit API key to version control
- Send API key to frontend
- Log API key in plain text

### 2. SSO Token Handling

✅ **DO:**
- Verify token immediately
- Handle expired tokens gracefully
- Use token once (it's already enforced by Proleads)

❌ **DON'T:**
- Store SSO token in database
- Reuse SSO token
- Send SSO token to other services

### 3. Data Validation

✅ **DO:**
- Validate email addresses before import
- Check for duplicate leads
- Sanitize CSV data
- Limit import size (500 lines max already enforced)

---

## Checklist

### Frontend
- [ ] Create `/import` route in router
- [ ] Create ImportPage component
- [ ] Extract URL parameters (sso_token, user_id, file_id)
- [ ] Show loading state
- [ ] Handle success state with redirect
- [ ] Handle error states
- [ ] Add retry functionality

### Backend
- [ ] Add environment variables (PROLEADS_API_URL, PROLEADS_API_KEY)
- [ ] Create `/api/import/from-proleads` endpoint
- [ ] Implement SSO token verification
- [ ] Implement CSV fetch from Proleads
- [ ] Implement CSV parsing
- [ ] Implement lead import to database
- [ ] Handle duplicate leads
- [ ] Add error handling for all steps
- [ ] Add logging for debugging
- [ ] Test with sample data

### Testing
- [ ] Test SSO verification
- [ ] Test CSV fetch
- [ ] Test lead import
- [ ] Test error scenarios
- [ ] Test rate limiting
- [ ] Test with real Proleads account

---

## Support & Resources

### API Credentials

**API URL:** `https://marketer-auth-bridge.preview.emergentagent.com`  
**API Key:** `sendloop_live_key_yalmQ6YGLT2PYPTAfvkHMuHbqJkw98Z1NFFYeWleuC8`  
**Rate Limit:** 100 requests/hour

### Need Help?

- **Technical Issues:** Contact Proleads team at support@proleads.network
- **API Questions:** Refer to `SSO_CSV_INTEGRATION_PLAN.md`
- **Testing:** Request test account credentials

### Expected Timeline

- **Frontend Implementation:** 2-4 hours
- **Backend Implementation:** 4-6 hours
- **Testing:** 2-3 hours
- **Total:** 1-2 days

---

## Summary

This implementation will allow Proleads users to seamlessly export their leads to Sendloop with just one click. The flow is:

1. User clicks "Export" in Proleads
2. User is redirected to your `/import` page with SSO token
3. You verify the token and fetch the CSV
4. Leads are automatically imported
5. User sees success message and can start using the leads

**All the hard work is done!** You just need to create the import page handler and call the Proleads API endpoints provided.

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Status:** Ready for Implementation
