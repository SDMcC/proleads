# SSO & CSV Data Transfer Integration Plan
## Proleads Network ↔ AutoMailer Integration

**Version:** 2.0  
**Date:** 2025-01-27  
**Status:** Implementation Ready

---

## Executive Summary

This document provides a comprehensive implementation plan for integrating **Proleads Network** with **AutoMailer** through:
1. **Single Sign-On (SSO)** - Seamless user authentication between platforms
2. **CSV Data Transfer** - Secure server-to-server lead data export

This plan addresses all security vulnerabilities, scalability concerns, and architectural issues identified in the previous implementation attempt.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Part A: Single Sign-On (SSO) Implementation](#part-a-single-sign-on-sso-implementation)
3. [Part B: CSV Data Transfer Implementation](#part-b-csv-data-transfer-implementation)
4. [Part C: Proleads Network Backend Implementation](#part-c-proleads-network-backend-implementation)
5. [Part D: AutoMailer Backend Implementation](#part-d-automailer-backend-implementation)
6. [Security Considerations](#security-considerations)
7. [Testing & Validation](#testing--validation)
8. [Deployment Checklist](#deployment-checklist)
9. [Error Handling & Edge Cases](#error-handling--edge-cases)
10. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Browser/Client                                                  │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  Proleads Network│◄────SSO─────►│   AutoMailer     │         │
│  │   (Frontend)     │              │   (Frontend)     │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
│           │                                 │                    │
└───────────┼─────────────────────────────────┼────────────────────┘
            │                                 │
            │ JWT Token                       │ JWT Token
            │                                 │
┌───────────▼─────────────────────────────────▼────────────────────┐
│                      APPLICATION LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┐  ┌────────────────────────┐│
│  │   Proleads Network Backend      │  │  AutoMailer Backend    ││
│  │   (FastAPI)                      │  │  (FastAPI/Express)     ││
│  │                                  │  │                        ││
│  │  ┌──────────────────────────┐   │  │  ┌──────────────────┐ ││
│  │  │  SSO Auth Endpoints      │   │  │  │  SSO Integration │ ││
│  │  │  - /api/sso/initiate     │   │  │  │  - /api/auth/sso │ ││
│  │  │  - /api/sso/callback     │   │  │  │  - Token Verify  │ ││
│  │  │  - /api/sso/verify       │   │  │  └──────────────────┘ ││
│  │  └──────────────────────────┘   │  │                        ││
│  │                                  │  │  ┌──────────────────┐ ││
│  │  ┌──────────────────────────┐   │  │  │  CSV Fetch API   │ ││
│  │  │  CSV Export API          │   │  │  │  - Calls Proleads│ ││
│  │  │  - /api/integrations/    │◄──┼──┼──┤  - API Key Auth  │ ││
│  │  │    csv-export            │   │  │  └──────────────────┘ ││
│  │  │  - API Key Protected     │   │  │                        ││
│  │  └──────────────────────────┘   │  └────────────────────────┘│
│  │                                  │                             │
│  └─────────────────────────────────┘                             │
└──────────────────────────────────────────────────────────────────┘
            │                                 
            │                                 
┌───────────▼─────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├──────────────────────────────────────────────────────────────────┤
│  MongoDB Database                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Collections:                                                ││
│  │  - users (authentication data)                               ││
│  │  - member_csv_files (CSV content storage)                    ││
│  │  - integration_api_keys (API keys for server-to-server)     ││
│  │  - sso_sessions (SSO session tracking)                       ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Separation of Concerns:**
   - **SSO Authentication** → User-facing, JWT-based
   - **CSV Transfer** → Server-to-server, API Key-based

2. **Authentication Methods:**
   - **User Login (SSO):** OAuth2 flow with JWT tokens
   - **Server Communication:** Long-lived API keys with rotation support

3. **Data Transfer:**
   - CSV generated on-the-fly from `member_csv_files` MongoDB collection
   - Maximum 500 lines per CSV (confirmed constraint)
   - No physical file storage required

---

## Part A: Single Sign-On (SSO) Implementation

### A.1 SSO Flow Overview

```
┌──────────┐                  ┌─────────────────┐                ┌──────────────┐
│          │                  │    Proleads     │                │              │
│ User     │                  │    Network      │                │  AutoMailer  │
│          │                  │    (Auth Provider)│              │              │
└────┬─────┘                  └────────┬────────┘                └──────┬───────┘
     │                                 │                                │
     │  1. Click "Connect AutoMailer" │                                │
     ├────────────────────────────────►│                                │
     │                                 │                                │
     │  2. Generate SSO Token          │                                │
     │     (short-lived, 10 min)       │                                │
     │◄────────────────────────────────┤                                │
     │                                 │                                │
     │  3. Redirect to AutoMailer      │                                │
     │     with SSO token              │                                │
     ├─────────────────────────────────┴───────────────────────────────►│
     │     /sso/login?token=xxx&redirect_url=...                        │
     │                                                                   │
     │                                 4. Verify Token with Proleads    │
     │                                 ◄──────────────────────────────┬─┤
     │                                 └──────────────────────────────┘ │
     │                                                                   │
     │  5. Create AutoMailer Session                                    │
     │  6. Return AutoMailer JWT                                        │
     │◄──────────────────────────────────────────────────────────────────┤
     │                                                                   │
     │  7. User logged into AutoMailer                                  │
     │                                                                   │
```

### A.2 Proleads Network SSO Endpoints

#### A.2.1 SSO Initiate Endpoint

**Endpoint:** `POST /api/sso/initiate`  
**Purpose:** Generate a short-lived SSO token for user authentication  
**Authentication:** Requires valid Proleads Network JWT

**Request:**
```json
{
  "target_app": "automailer",
  "redirect_url": "https://automailer.com/dashboard"
}
```

**Response:**
```json
{
  "sso_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-01-27T10:45:00Z",
  "redirect_url": "https://automailer.com/sso/login?token=xxx&redirect_url=..."
}
```

**Implementation Details:**
- Generate JWT token with 10-minute expiration
- Include user_id, email, username, membership_tier in payload
- Store SSO session in `sso_sessions` collection
- Token can only be used once (single-use token)

#### A.2.2 SSO Token Verification Endpoint

**Endpoint:** `POST /api/sso/verify`  
**Purpose:** Verify SSO token and return user data  
**Authentication:** Requires valid API key from AutoMailer

**Request Headers:**
```
X-API-Key: automailer_api_key_here
```

**Request:**
```json
{
  "sso_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success):**
```json
{
  "valid": true,
  "user": {
    "user_id": "user-123-456",
    "email": "user@example.com",
    "username": "johndoe",
    "address": "0xABC123...",
    "membership_tier": "gold",
    "subscription_expires_at": "2026-01-27T00:00:00Z"
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "error": "Token expired or already used"
}
```

**Implementation Details:**
- Verify JWT signature and expiration
- Check if token has been used (single-use enforcement)
- Mark token as used in `sso_sessions` collection
- Return user data if valid

#### A.2.3 SSO User Info Endpoint

**Endpoint:** `GET /api/sso/user-info`  
**Purpose:** Get current user information for SSO session  
**Authentication:** Requires valid SSO token or API key

**Request Headers:**
```
Authorization: Bearer <sso_token>
OR
X-API-Key: automailer_api_key_here
```

**Query Parameters:**
```
user_id=user-123-456
```

**Response:**
```json
{
  "user_id": "user-123-456",
  "email": "user@example.com",
  "username": "johndoe",
  "address": "0xABC123...",
  "membership_tier": "gold",
  "subscription_status": "active",
  "subscription_expires_at": "2026-01-27T00:00:00Z"
}
```

### A.3 AutoMailer SSO Integration

#### A.3.1 SSO Login Handler

**Endpoint:** `GET /sso/login`  
**Purpose:** Handle SSO redirect from Proleads Network

**Query Parameters:**
- `token`: SSO token from Proleads Network
- `redirect_url`: Where to redirect after successful login

**Flow:**
1. Extract SSO token from query parameters
2. Call Proleads Network `/api/sso/verify` endpoint with API key
3. If valid, create AutoMailer user session (or link existing account)
4. Generate AutoMailer JWT token
5. Redirect to `redirect_url` with AutoMailer session established

#### A.3.2 Account Linking

**Options for handling SSO users:**

**Option 1: Automatic Account Creation**
- If email doesn't exist in AutoMailer, automatically create account
- Link Proleads Network user_id to AutoMailer account
- Store `proleads_user_id` in AutoMailer user record

**Option 2: Manual Account Linking**
- Show "Link Account" page if email exists
- Require AutoMailer password confirmation
- Link accounts after verification

**Recommended:** Option 1 (Automatic) for seamless UX

---

## Part B: CSV Data Transfer Implementation

### B.1 CSV Transfer Flow

```
┌──────────────┐                  ┌─────────────────┐
│              │                  │    Proleads     │
│  AutoMailer  │                  │    Network      │
│   Backend    │                  │    Backend      │
└──────┬───────┘                  └────────┬────────┘
       │                                   │
       │  1. User requests lead import     │
       │     in AutoMailer UI              │
       │                                   │
       │  2. POST /api/integrations/       │
       │     csv-export                    │
       │     Headers:                      │
       │     X-API-Key: <api_key>          │
       │     Body:                         │
       │     {                             │
       │       "user_id": "user-123",      │
       │       "file_id": "csv-456"        │
       │     }                             │
       ├──────────────────────────────────►│
       │                                   │
       │                        3. Verify API Key
       │                        4. Verify user_id owns file_id
       │                        5. Retrieve CSV from DB
       │                        6. Track export event
       │                                   │
       │  7. Response:                     │
       │     {                             │
       │       "csv_data": "Name,Email,... │
       │       "filename": "leads_xxx.csv",│
       │       "line_count": 500,          │
       │       "exported_at": "2025-01..." │
       │     }                             │
       │◄──────────────────────────────────┤
       │                                   │
       │  8. Process CSV in AutoMailer     │
       │     (import to campaign)          │
       │                                   │
```

### B.2 Proleads Network CSV Export API

#### B.2.1 CSV Export Endpoint

**Endpoint:** `POST /api/integrations/csv-export`  
**Purpose:** Export user's lead CSV for external integration  
**Authentication:** API Key (server-to-server)

**Request Headers:**
```
X-API-Key: automailer_live_key_abc123xyz
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "user-123-456",
  "file_id": "csv-file-789",
  "format": "csv"
}
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "csv_data": "Name,Email,Address\nJohn Doe,john@example.com,123 Main St\nJane Smith,jane@example.com,456 Oak Ave\n...",
  "metadata": {
    "filename": "leads_user-123_2025-01-27.csv",
    "line_count": 500,
    "exported_at": "2025-01-27T10:30:00Z",
    "user_id": "user-123-456",
    "file_id": "csv-file-789"
  }
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid API key"
}
```

**Response (Error - 403 Forbidden):**
```json
{
  "success": false,
  "error": "User does not have access to this CSV file"
}
```

**Response (Error - 404 Not Found):**
```json
{
  "success": false,
  "error": "CSV file not found"
}
```

**Response (Error - 429 Too Many Requests):**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again in 60 seconds",
  "retry_after": 60
}
```

#### B.2.2 List Available CSV Files

**Endpoint:** `GET /api/integrations/csv-files`  
**Purpose:** List all available CSV files for a user  
**Authentication:** API Key + user_id verification

**Request Headers:**
```
X-API-Key: automailer_live_key_abc123xyz
```

**Query Parameters:**
```
user_id=user-123-456
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "file_id": "csv-file-789",
      "filename": "leads_2025-01-20.csv",
      "line_count": 500,
      "created_at": "2025-01-20T08:00:00Z",
      "distribution_id": "dist-123"
    },
    {
      "file_id": "csv-file-790",
      "filename": "leads_2025-01-27.csv",
      "line_count": 250,
      "created_at": "2025-01-27T08:00:00Z",
      "distribution_id": "dist-124"
    }
  ],
  "total_files": 2
}
```

### B.3 API Key Management

#### B.3.1 API Key Generation (Admin Only)

**Endpoint:** `POST /api/admin/integrations/api-keys`  
**Purpose:** Generate new API key for external integrations  
**Authentication:** Admin JWT token

**Request:**
```json
{
  "integration_name": "automailer",
  "description": "API key for AutoMailer CSV export integration",
  "permissions": ["csv_export", "user_info"],
  "rate_limit": 100,
  "rate_limit_period": "hour"
}
```

**Response:**
```json
{
  "success": true,
  "api_key": {
    "key_id": "key-123-456",
    "api_key": "automailer_live_key_abc123xyz",
    "integration_name": "automailer",
    "permissions": ["csv_export", "user_info"],
    "rate_limit": 100,
    "rate_limit_period": "hour",
    "created_at": "2025-01-27T10:00:00Z",
    "expires_at": null,
    "status": "active"
  },
  "warning": "This API key will only be displayed once. Store it securely."
}
```

#### B.3.2 API Key Rotation

**Endpoint:** `POST /api/admin/integrations/api-keys/{key_id}/rotate`  
**Purpose:** Rotate API key (generate new key, keep old valid for 24h)  
**Authentication:** Admin JWT token

**Response:**
```json
{
  "success": true,
  "new_api_key": "automailer_live_key_xyz789abc",
  "old_api_key_valid_until": "2025-01-28T10:00:00Z",
  "message": "API key rotated successfully. Update AutoMailer configuration within 24 hours."
}
```

#### B.3.3 Database Schema for API Keys

**Collection:** `integration_api_keys`

```javascript
{
  "_id": ObjectId,
  "key_id": "key-123-456",  // UUID
  "api_key_hash": "bcrypt_hash_of_key",  // Never store plain text
  "integration_name": "automailer",
  "description": "API key for AutoMailer CSV export integration",
  "permissions": ["csv_export", "user_info"],
  "rate_limit": 100,
  "rate_limit_period": "hour",
  "created_at": ISODate("2025-01-27T10:00:00Z"),
  "expires_at": null,  // null = never expires
  "status": "active",  // active, revoked, expired
  "last_used_at": ISODate("2025-01-27T10:30:00Z"),
  "usage_count": 42
}
```

### B.4 Rate Limiting Implementation

**Strategy:** Token Bucket Algorithm

**Configuration:**
- **Default:** 100 requests per hour per API key
- **Burst:** Allow up to 10 requests in a single minute
- **Headers:** Include rate limit info in response headers

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706356800
```

**Implementation:**
```python
# Pseudocode
async def check_rate_limit(api_key: str):
    key = f"rate_limit:{api_key}"
    current = await redis.incr(key)
    
    if current == 1:
        await redis.expire(key, 3600)  # 1 hour
    
    if current > 100:
        raise RateLimitExceeded()
    
    return {
        "limit": 100,
        "remaining": 100 - current,
        "reset": int(time.time()) + await redis.ttl(key)
    }
```

---

## Part C: Proleads Network Backend Implementation

### C.1 New Dependencies

**Add to `requirements.txt`:**
```
pyjwt==2.8.0
bcrypt==4.1.2
redis==5.0.1  # For rate limiting
```

### C.2 New Pydantic Models

```python
# SSO Models
class SSOInitiateRequest(BaseModel):
    target_app: str  # "automailer"
    redirect_url: str

class SSOInitiateResponse(BaseModel):
    sso_token: str
    expires_at: datetime
    redirect_url: str

class SSOVerifyRequest(BaseModel):
    sso_token: str

class SSOVerifyResponse(BaseModel):
    valid: bool
    user: Optional[dict] = None
    error: Optional[str] = None

# CSV Export Models
class CSVExportRequest(BaseModel):
    user_id: str
    file_id: str
    format: str = "csv"

class CSVExportResponse(BaseModel):
    success: bool
    csv_data: Optional[str] = None
    metadata: Optional[dict] = None
    error: Optional[str] = None

# API Key Models
class APIKeyCreate(BaseModel):
    integration_name: str
    description: str
    permissions: List[str]
    rate_limit: int = 100
    rate_limit_period: str = "hour"

class APIKeyResponse(BaseModel):
    key_id: str
    api_key: str
    integration_name: str
    permissions: List[str]
    rate_limit: int
    rate_limit_period: str
    created_at: datetime
    expires_at: Optional[datetime]
    status: str
```

### C.3 SSO Endpoint Implementations

```python
# =============================================================================
# SSO AUTHENTICATION ENDPOINTS
# =============================================================================

import jwt
from datetime import datetime, timedelta
import secrets

# SSO Configuration
SSO_SECRET_KEY = os.environ.get("SSO_SECRET_KEY", "your-sso-secret-key-change-this")
SSO_TOKEN_EXPIRY_MINUTES = 10

@app.post("/api/sso/initiate", response_model=SSOInitiateResponse)
async def sso_initiate(
    request: SSOInitiateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Initiate SSO flow - generate short-lived token for external app
    """
    try:
        # Generate SSO token
        token_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(minutes=SSO_TOKEN_EXPIRY_MINUTES)
        
        # Create JWT payload
        payload = {
            "token_id": token_id,
            "user_id": current_user["user_id"],
            "email": current_user["email"],
            "username": current_user["username"],
            "address": current_user["address"],
            "membership_tier": current_user["membership_tier"],
            "subscription_expires_at": current_user.get("subscription_expires_at").isoformat() if current_user.get("subscription_expires_at") else None,
            "target_app": request.target_app,
            "exp": expires_at,
            "iat": datetime.utcnow(),
            "type": "sso"
        }
        
        # Generate JWT token
        sso_token = jwt.encode(payload, SSO_SECRET_KEY, algorithm="HS256")
        
        # Store SSO session in database (for single-use enforcement)
        await db.sso_sessions.insert_one({
            "token_id": token_id,
            "user_id": current_user["user_id"],
            "target_app": request.target_app,
            "created_at": datetime.utcnow(),
            "expires_at": expires_at,
            "used": False,
            "used_at": None
        })
        
        # Build redirect URL
        redirect_url = f"{request.redirect_url}?sso_token={sso_token}"
        if "?" in request.redirect_url:
            redirect_url = f"{request.redirect_url}&sso_token={sso_token}"
        
        logger.info(f"SSO token generated for user {current_user['username']} -> {request.target_app}")
        
        return SSOInitiateResponse(
            sso_token=sso_token,
            expires_at=expires_at,
            redirect_url=redirect_url
        )
        
    except Exception as e:
        logger.error(f"Failed to initiate SSO: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate SSO")


@app.post("/api/sso/verify", response_model=SSOVerifyResponse)
async def sso_verify(request: SSOVerifyRequest):
    """
    Verify SSO token - called by external app (requires API key)
    """
    try:
        # Verify API key from headers
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            raise HTTPException(status_code=401, detail="API key required")
        
        # Validate API key
        api_key_valid = await validate_api_key(api_key, ["sso_verify", "user_info"])
        if not api_key_valid:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Decode JWT token
        try:
            payload = jwt.decode(
                request.sso_token,
                SSO_SECRET_KEY,
                algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            return SSOVerifyResponse(valid=False, error="Token expired")
        except jwt.InvalidTokenError:
            return SSOVerifyResponse(valid=False, error="Invalid token")
        
        # Check if token type is SSO
        if payload.get("type") != "sso":
            return SSOVerifyResponse(valid=False, error="Invalid token type")
        
        # Check if token has been used (single-use enforcement)
        token_id = payload.get("token_id")
        sso_session = await db.sso_sessions.find_one({"token_id": token_id})
        
        if not sso_session:
            return SSOVerifyResponse(valid=False, error="Token not found")
        
        if sso_session.get("used"):
            return SSOVerifyResponse(valid=False, error="Token already used")
        
        # Mark token as used
        await db.sso_sessions.update_one(
            {"token_id": token_id},
            {
                "$set": {
                    "used": True,
                    "used_at": datetime.utcnow()
                }
            }
        )
        
        # Return user data
        user_data = {
            "user_id": payload["user_id"],
            "email": payload["email"],
            "username": payload["username"],
            "address": payload["address"],
            "membership_tier": payload["membership_tier"],
            "subscription_expires_at": payload.get("subscription_expires_at")
        }
        
        logger.info(f"SSO token verified for user {payload['username']}")
        
        return SSOVerifyResponse(valid=True, user=user_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to verify SSO token: {str(e)}")
        return SSOVerifyResponse(valid=False, error="Verification failed")


@app.get("/api/sso/user-info")
async def sso_user_info(
    user_id: str,
    api_key: str = Header(None, alias="X-API-Key")
):
    """
    Get user information for SSO session
    """
    try:
        # Validate API key
        if not api_key:
            raise HTTPException(status_code=401, detail="API key required")
        
        api_key_valid = await validate_api_key(api_key, ["user_info"])
        if not api_key_valid:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Get user from database
        user = await db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return user information
        return {
            "user_id": user["user_id"],
            "email": user["email"],
            "username": user["username"],
            "address": user["address"],
            "membership_tier": user["membership_tier"],
            "subscription_status": "active" if not user.get("suspended") else "suspended",
            "subscription_expires_at": user.get("subscription_expires_at").isoformat() if user.get("subscription_expires_at") else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user info: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user info")
```

### C.4 CSV Export Endpoint Implementation

```python
# =============================================================================
# INTEGRATION API - CSV EXPORT
# =============================================================================

import bcrypt
from collections import defaultdict

# Rate limiting storage (in production, use Redis)
rate_limit_storage = defaultdict(list)

async def validate_api_key(api_key: str, required_permissions: List[str]) -> bool:
    """
    Validate API key and check permissions
    """
    try:
        # Hash the provided API key
        # Find API key in database (stored as hash)
        api_keys = await db.integration_api_keys.find({
            "status": "active"
        }).to_list(None)
        
        for key_record in api_keys:
            # Compare hashed API key
            if bcrypt.checkpw(api_key.encode('utf-8'), key_record["api_key_hash"].encode('utf-8')):
                # Check permissions
                key_permissions = key_record.get("permissions", [])
                if all(perm in key_permissions for perm in required_permissions):
                    # Update last used
                    await db.integration_api_keys.update_one(
                        {"key_id": key_record["key_id"]},
                        {
                            "$set": {"last_used_at": datetime.utcnow()},
                            "$inc": {"usage_count": 1}
                        }
                    )
                    return True
        
        return False
        
    except Exception as e:
        logger.error(f"API key validation error: {str(e)}")
        return False


async def check_rate_limit(api_key: str, limit: int = 100, period_seconds: int = 3600):
    """
    Check rate limit for API key (token bucket algorithm)
    In production, use Redis for distributed rate limiting
    """
    try:
        current_time = datetime.utcnow()
        key_requests = rate_limit_storage[api_key]
        
        # Remove requests outside the time window
        cutoff_time = current_time - timedelta(seconds=period_seconds)
        rate_limit_storage[api_key] = [
            req_time for req_time in key_requests
            if req_time > cutoff_time
        ]
        
        # Check if limit exceeded
        if len(rate_limit_storage[api_key]) >= limit:
            return False, {
                "limit": limit,
                "remaining": 0,
                "reset": int((rate_limit_storage[api_key][0] + timedelta(seconds=period_seconds)).timestamp())
            }
        
        # Add current request
        rate_limit_storage[api_key].append(current_time)
        
        return True, {
            "limit": limit,
            "remaining": limit - len(rate_limit_storage[api_key]),
            "reset": int((current_time + timedelta(seconds=period_seconds)).timestamp())
        }
        
    except Exception as e:
        logger.error(f"Rate limit check error: {str(e)}")
        return True, {"limit": limit, "remaining": limit, "reset": 0}


@app.post("/api/integrations/csv-export", response_model=CSVExportResponse)
async def integration_csv_export(
    request: CSVExportRequest,
    api_key: str = Header(None, alias="X-API-Key")
):
    """
    Export user's lead CSV for external integration (AutoMailer)
    Requires API key authentication
    """
    try:
        # Validate API key
        if not api_key:
            raise HTTPException(status_code=401, detail="API key required")
        
        api_key_valid = await validate_api_key(api_key, ["csv_export"])
        if not api_key_valid:
            logger.warning(f"Invalid API key used for CSV export")
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Check rate limit
        rate_limit_ok, rate_info = await check_rate_limit(api_key)
        if not rate_limit_ok:
            logger.warning(f"Rate limit exceeded for API key")
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded",
                headers={
                    "X-RateLimit-Limit": str(rate_info["limit"]),
                    "X-RateLimit-Remaining": str(rate_info["remaining"]),
                    "X-RateLimit-Reset": str(rate_info["reset"]),
                    "Retry-After": "60"
                }
            )
        
        # Verify user exists
        user = await db.users.find_one({"user_id": request.user_id})
        if not user:
            logger.warning(f"CSV export requested for non-existent user: {request.user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get CSV file from database
        csv_file = await db.member_csv_files.find_one({
            "file_id": request.file_id,
            "member_address": user["address"]
        })
        
        if not csv_file:
            logger.warning(f"CSV file {request.file_id} not found for user {request.user_id}")
            raise HTTPException(
                status_code=403,
                detail="CSV file not found or user does not have access"
            )
        
        # Get CSV content (stored in database)
        csv_content = csv_file.get("csv_content", "")
        
        if not csv_content:
            logger.error(f"CSV file {request.file_id} has no content")
            raise HTTPException(status_code=500, detail="CSV file has no content")
        
        # Count lines
        line_count = len(csv_content.split('\n')) - 1  # Subtract header row
        
        # Log export event
        await db.csv_export_logs.insert_one({
            "export_id": str(uuid.uuid4()),
            "user_id": request.user_id,
            "file_id": request.file_id,
            "integration": "automailer",
            "exported_at": datetime.utcnow(),
            "line_count": line_count,
            "api_key_id": api_key[:8] + "..."  # Log first 8 chars only
        })
        
        logger.info(f"CSV export successful: user={request.user_id}, file={request.file_id}, lines={line_count}")
        
        # Return CSV data
        return CSVExportResponse(
            success=True,
            csv_data=csv_content,
            metadata={
                "filename": csv_file.get("filename", f"leads_{request.user_id}.csv"),
                "line_count": line_count,
                "exported_at": datetime.utcnow().isoformat(),
                "user_id": request.user_id,
                "file_id": request.file_id
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to export CSV: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export CSV")


@app.get("/api/integrations/csv-files")
async def integration_list_csv_files(
    user_id: str,
    api_key: str = Header(None, alias="X-API-Key")
):
    """
    List available CSV files for a user
    """
    try:
        # Validate API key
        if not api_key:
            raise HTTPException(status_code=401, detail="API key required")
        
        api_key_valid = await validate_api_key(api_key, ["csv_export"])
        if not api_key_valid:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Check rate limit
        rate_limit_ok, rate_info = await check_rate_limit(api_key)
        if not rate_limit_ok:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Verify user exists
        user = await db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get all CSV files for user
        csv_files = await db.member_csv_files.find({
            "member_address": user["address"]
        }).sort("created_at", -1).to_list(None)
        
        # Format response
        files = []
        for csv_file in csv_files:
            files.append({
                "file_id": csv_file["file_id"],
                "filename": csv_file["filename"],
                "line_count": csv_file.get("lead_count", 0),
                "created_at": csv_file["created_at"].isoformat(),
                "distribution_id": csv_file.get("distribution_id", "")
            })
        
        return {
            "success": True,
            "files": files,
            "total_files": len(files)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list CSV files: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list CSV files")
```

### C.5 API Key Management Endpoints (Admin Only)

```python
# =============================================================================
# ADMIN API KEY MANAGEMENT
# =============================================================================

@app.post("/api/admin/integrations/api-keys")
async def admin_create_api_key(
    request: APIKeyCreate,
    current_admin: dict = Depends(get_admin_user)
):
    """
    Generate new API key for external integrations (Admin only)
    """
    try:
        # Generate API key
        api_key_raw = f"{request.integration_name}_live_key_" + secrets.token_urlsafe(32)
        key_id = str(uuid.uuid4())
        
        # Hash API key before storing
        api_key_hash = bcrypt.hashpw(api_key_raw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Store in database
        await db.integration_api_keys.insert_one({
            "key_id": key_id,
            "api_key_hash": api_key_hash,  # Never store plain text
            "integration_name": request.integration_name,
            "description": request.description,
            "permissions": request.permissions,
            "rate_limit": request.rate_limit,
            "rate_limit_period": request.rate_limit_period,
            "created_at": datetime.utcnow(),
            "created_by": current_admin["username"],
            "expires_at": None,
            "status": "active",
            "last_used_at": None,
            "usage_count": 0
        })
        
        logger.info(f"API key created: {request.integration_name} by {current_admin['username']}")
        
        return {
            "success": True,
            "api_key": {
                "key_id": key_id,
                "api_key": api_key_raw,  # Only shown once!
                "integration_name": request.integration_name,
                "permissions": request.permissions,
                "rate_limit": request.rate_limit,
                "rate_limit_period": request.rate_limit_period,
                "created_at": datetime.utcnow().isoformat(),
                "expires_at": None,
                "status": "active"
            },
            "warning": "This API key will only be displayed once. Store it securely."
        }
        
    except Exception as e:
        logger.error(f"Failed to create API key: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create API key")


@app.get("/api/admin/integrations/api-keys")
async def admin_list_api_keys(current_admin: dict = Depends(get_admin_user)):
    """
    List all API keys (without revealing actual keys)
    """
    try:
        api_keys = await db.integration_api_keys.find({}).sort("created_at", -1).to_list(None)
        
        keys = []
        for key in api_keys:
            keys.append({
                "key_id": key["key_id"],
                "integration_name": key["integration_name"],
                "description": key.get("description", ""),
                "permissions": key["permissions"],
                "rate_limit": key["rate_limit"],
                "rate_limit_period": key["rate_limit_period"],
                "created_at": key["created_at"].isoformat(),
                "status": key["status"],
                "last_used_at": key.get("last_used_at").isoformat() if key.get("last_used_at") else None,
                "usage_count": key.get("usage_count", 0)
            })
        
        return {
            "success": True,
            "api_keys": keys,
            "total": len(keys)
        }
        
    except Exception as e:
        logger.error(f"Failed to list API keys: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list API keys")


@app.delete("/api/admin/integrations/api-keys/{key_id}")
async def admin_revoke_api_key(
    key_id: str,
    current_admin: dict = Depends(get_admin_user)
):
    """
    Revoke an API key
    """
    try:
        result = await db.integration_api_keys.update_one(
            {"key_id": key_id},
            {"$set": {"status": "revoked", "revoked_at": datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="API key not found")
        
        logger.info(f"API key revoked: {key_id} by {current_admin['username']}")
        
        return {
            "success": True,
            "message": "API key revoked successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to revoke API key: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to revoke API key")


@app.post("/api/admin/integrations/api-keys/{key_id}/rotate")
async def admin_rotate_api_key(
    key_id: str,
    current_admin: dict = Depends(get_admin_user)
):
    """
    Rotate an API key (generate new key, keep old valid for 24h)
    """
    try:
        # Get existing key
        existing_key = await db.integration_api_keys.find_one({"key_id": key_id})
        if not existing_key:
            raise HTTPException(status_code=404, detail="API key not found")
        
        # Generate new API key
        new_api_key_raw = f"{existing_key['integration_name']}_live_key_" + secrets.token_urlsafe(32)
        new_key_id = str(uuid.uuid4())
        new_api_key_hash = bcrypt.hashpw(new_api_key_raw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create new key record
        await db.integration_api_keys.insert_one({
            "key_id": new_key_id,
            "api_key_hash": new_api_key_hash,
            "integration_name": existing_key["integration_name"],
            "description": existing_key.get("description", ""),
            "permissions": existing_key["permissions"],
            "rate_limit": existing_key["rate_limit"],
            "rate_limit_period": existing_key["rate_limit_period"],
            "created_at": datetime.utcnow(),
            "created_by": current_admin["username"],
            "expires_at": None,
            "status": "active",
            "last_used_at": None,
            "usage_count": 0,
            "rotated_from": key_id
        })
        
        # Set old key to expire in 24 hours
        old_key_valid_until = datetime.utcnow() + timedelta(hours=24)
        await db.integration_api_keys.update_one(
            {"key_id": key_id},
            {
                "$set": {
                    "status": "rotating",
                    "expires_at": old_key_valid_until,
                    "rotated_to": new_key_id
                }
            }
        )
        
        logger.info(f"API key rotated: {key_id} -> {new_key_id} by {current_admin['username']}")
        
        return {
            "success": True,
            "new_api_key": new_api_key_raw,
            "old_api_key_valid_until": old_key_valid_until.isoformat(),
            "message": "API key rotated successfully. Update AutoMailer configuration within 24 hours."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to rotate API key: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to rotate API key")
```

### C.6 Database Collections to Create

```python
# Create indexes for new collections
async def create_integration_indexes():
    """Create database indexes for integration features"""
    try:
        # SSO sessions index
        await db.sso_sessions.create_index("token_id", unique=True)
        await db.sso_sessions.create_index("expires_at")
        await db.sso_sessions.create_index([("user_id", 1), ("created_at", -1)])
        
        # API keys index
        await db.integration_api_keys.create_index("key_id", unique=True)
        await db.integration_api_keys.create_index("integration_name")
        await db.integration_api_keys.create_index("status")
        
        # CSV export logs index
        await db.csv_export_logs.create_index("export_id", unique=True)
        await db.csv_export_logs.create_index([("user_id", 1), ("exported_at", -1)])
        await db.csv_export_logs.create_index("file_id")
        
        logger.info("Integration database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create integration indexes: {str(e)}")
```

---

## Part D: AutoMailer Backend Implementation

### D.1 Environment Configuration

**Add to `.env` file:**
```
PROLEADS_API_URL=https://proleads-network.com
PROLEADS_API_KEY=automailer_live_key_abc123xyz
PROLEADS_SSO_ENABLED=true
```

### D.2 SSO Integration Handler

**Create new file:** `automailer_backend/proleads_integration.py`

```python
import httpx
import os
from datetime import datetime
from typing import Optional, Dict

class ProleadsIntegration:
    def __init__(self):
        self.api_url = os.environ.get("PROLEADS_API_URL")
        self.api_key = os.environ.get("PROLEADS_API_KEY")
        self.sso_enabled = os.environ.get("PROLEADS_SSO_ENABLED", "false").lower() == "true"
    
    async def verify_sso_token(self, sso_token: str) -> Optional[Dict]:
        """
        Verify SSO token with Proleads Network
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/api/sso/verify",
                    json={"sso_token": sso_token},
                    headers={"X-API-Key": self.api_key},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("valid"):
                        return data.get("user")
                
                return None
                
        except Exception as e:
            print(f"Failed to verify SSO token: {str(e)}")
            return None
    
    async def get_user_info(self, user_id: str) -> Optional[Dict]:
        """
        Get user information from Proleads Network
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/api/sso/user-info",
                    params={"user_id": user_id},
                    headers={"X-API-Key": self.api_key},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()
                
                return None
                
        except Exception as e:
            print(f"Failed to get user info: {str(e)}")
            return None
    
    async def fetch_csv_data(self, user_id: str, file_id: str) -> Optional[Dict]:
        """
        Fetch CSV data from Proleads Network
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/api/integrations/csv-export",
                    json={
                        "user_id": user_id,
                        "file_id": file_id,
                        "format": "csv"
                    },
                    headers={"X-API-Key": self.api_key},
                    timeout=30.0  # Longer timeout for CSV export
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:
                    # Rate limit exceeded
                    retry_after = response.headers.get("Retry-After", 60)
                    raise Exception(f"Rate limit exceeded. Retry after {retry_after} seconds")
                else:
                    return None
                
        except Exception as e:
            print(f"Failed to fetch CSV data: {str(e)}")
            raise
    
    async def list_available_csv_files(self, user_id: str) -> list:
        """
        List available CSV files for user from Proleads Network
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/api/integrations/csv-files",
                    params={"user_id": user_id},
                    headers={"X-API-Key": self.api_key},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("files", [])
                
                return []
                
        except Exception as e:
            print(f"Failed to list CSV files: {str(e)}")
            return []

# Global instance
proleads_integration = ProleadsIntegration()
```

### D.3 SSO Login Endpoint

**Add to AutoMailer backend:**

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from proleads_integration import proleads_integration

@app.get("/sso/login")
async def sso_login(request: Request, sso_token: str, redirect_url: str = "/dashboard"):
    """
    Handle SSO login from Proleads Network
    """
    try:
        # Verify SSO token with Proleads Network
        user_data = await proleads_integration.verify_sso_token(sso_token)
        
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired SSO token")
        
        # Check if user exists in AutoMailer database
        existing_user = await db.users.find_one({"email": user_data["email"]})
        
        if existing_user:
            # Update Proleads link
            await db.users.update_one(
                {"email": user_data["email"]},
                {"$set": {
                    "proleads_user_id": user_data["user_id"],
                    "proleads_linked_at": datetime.utcnow()
                }}
            )
            user_id = existing_user["user_id"]
        else:
            # Create new AutoMailer account automatically
            user_id = str(uuid.uuid4())
            await db.users.insert_one({
                "user_id": user_id,
                "email": user_data["email"],
                "username": user_data["username"],
                "proleads_user_id": user_data["user_id"],
                "proleads_membership_tier": user_data["membership_tier"],
                "created_via": "sso",
                "created_at": datetime.utcnow(),
                "proleads_linked_at": datetime.utcnow()
            })
        
        # Create AutoMailer session
        automailer_token = create_jwt_token(user_id, user_data["email"])
        
        # Set cookie and redirect
        response = RedirectResponse(url=redirect_url)
        response.set_cookie(
            key="automailer_token",
            value=automailer_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=86400 * 7  # 7 days
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"SSO login failed: {str(e)}")
        raise HTTPException(status_code=500, detail="SSO login failed")


@app.post("/api/campaigns/import-leads")
async def import_leads_from_proleads(
    file_id: str,
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Import leads from Proleads Network into AutoMailer campaign
    """
    try:
        # Get Proleads user_id
        user = await db.users.find_one({"user_id": current_user["user_id"]})
        proleads_user_id = user.get("proleads_user_id")
        
        if not proleads_user_id:
            raise HTTPException(
                status_code=400,
                detail="Proleads account not linked. Please connect your account first."
            )
        
        # Fetch CSV data from Proleads Network
        csv_data = await proleads_integration.fetch_csv_data(proleads_user_id, file_id)
        
        if not csv_data or not csv_data.get("success"):
            raise HTTPException(
                status_code=500,
                detail="Failed to fetch leads from Proleads Network"
            )
        
        # Parse CSV content
        csv_content = csv_data.get("csv_data", "")
        lines = csv_content.strip().split('\n')
        
        if len(lines) <= 1:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Parse leads
        headers = lines[0].split(',')
        leads_imported = 0
        
        for line in lines[1:]:
            values = line.split(',')
            if len(values) >= 3:
                # Import lead to campaign
                await db.campaign_leads.insert_one({
                    "lead_id": str(uuid.uuid4()),
                    "campaign_id": campaign_id,
                    "name": values[0].strip(),
                    "email": values[1].strip(),
                    "address": values[2].strip() if len(values) > 2 else "",
                    "imported_from": "proleads",
                    "imported_at": datetime.utcnow(),
                    "status": "pending"
                })
                leads_imported += 1
        
        # Log import event
        await db.import_logs.insert_one({
            "import_id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "campaign_id": campaign_id,
            "source": "proleads",
            "file_id": file_id,
            "leads_imported": leads_imported,
            "imported_at": datetime.utcnow()
        })
        
        return {
            "success": True,
            "leads_imported": leads_imported,
            "campaign_id": campaign_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to import leads: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to import leads")
```

### D.4 Frontend Integration (AutoMailer)

**Add SSO button to AutoMailer UI:**

```javascript
// AutoMailer Frontend - Connect Proleads Account Button

const connectProleadsAccount = async () => {
  try {
    // Redirect to Proleads Network to initiate SSO
    window.location.href = 'https://proleads-network.com/integrations/automailer/connect';
  } catch (error) {
    console.error('Failed to connect Proleads account:', error);
  }
};

// Import Leads from Proleads
const importLeadsFromProleads = async (fileId, campaignId) => {
  try {
    const response = await fetch('/api/campaigns/import-leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('automailer_token')}`
      },
      body: JSON.stringify({
        file_id: fileId,
        campaign_id: campaignId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(`Successfully imported ${data.leads_imported} leads!`);
    } else {
      alert('Failed to import leads');
    }
  } catch (error) {
    console.error('Failed to import leads:', error);
    alert('Failed to import leads');
  }
};
```

---

## Security Considerations

### 1. Authentication Security

**SSO Tokens:**
- ✅ Short-lived (10 minutes maximum)
- ✅ Single-use enforcement (marked as used after verification)
- ✅ Signed with HS256 JWT algorithm
- ✅ Include expiration timestamp
- ✅ Stored in database for audit trail

**API Keys:**
- ✅ Hashed with bcrypt before storage (never store plain text)
- ✅ Use secure random generation (secrets.token_urlsafe)
- ✅ Prefix with integration name for easy identification
- ✅ Support key rotation with grace period
- ✅ Track usage count and last used timestamp

### 2. Data Security

**CSV Export:**
- ✅ Verify user owns the CSV file before export
- ✅ Log all export events for audit trail
- ✅ Rate limiting to prevent abuse
- ✅ API key authentication required

**SSO User Data:**
- ✅ Minimal user data transferred (only necessary fields)
- ✅ No passwords or sensitive financial data
- ✅ Subscription status for access control

### 3. Network Security

**HTTPS Only:**
- ✅ All API calls must use HTTPS in production
- ✅ Set secure cookies (httponly, secure flags)
- ✅ Use SameSite cookie attribute

**Headers:**
- ✅ API keys in headers (never in URL)
- ✅ CORS configuration for trusted domains only
- ✅ Rate limit headers for transparency

### 4. Rate Limiting

**Implementation:**
- ✅ 100 requests per hour per API key (configurable)
- ✅ Token bucket algorithm
- ✅ Return proper HTTP 429 status
- ✅ Include Retry-After header

### 5. Error Handling

**Security Best Practices:**
- ❌ Never expose internal error details
- ✅ Use generic error messages for authentication failures
- ✅ Log detailed errors server-side only
- ✅ Return appropriate HTTP status codes

---

## Testing & Validation

### Test Plan Overview

**Phase 1: Unit Testing**
1. API key generation and validation
2. SSO token generation and verification
3. Rate limiting functionality
4. CSV export data retrieval

**Phase 2: Integration Testing**
1. Complete SSO flow (Proleads → AutoMailer)
2. CSV export API with valid/invalid credentials
3. Rate limit enforcement across multiple requests
4. Error handling for edge cases

**Phase 3: End-to-End Testing**
1. User logs into Proleads Network
2. User clicks "Connect AutoMailer"
3. SSO redirect to AutoMailer
4. AutoMailer creates session
5. User imports leads from Proleads
6. Verify leads appear in AutoMailer campaign

### Test Scenarios

#### SSO Flow Tests

**Test 1: Successful SSO Login**
```bash
# Step 1: Generate SSO token (Proleads)
curl -X POST https://proleads-network.com/api/sso/initiate \
  -H "Authorization: Bearer <user_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_app": "automailer",
    "redirect_url": "https://automailer.com/dashboard"
  }'

# Expected: { "sso_token": "...", "expires_at": "...", "redirect_url": "..." }

# Step 2: Verify SSO token (AutoMailer calls this)
curl -X POST https://proleads-network.com/api/sso/verify \
  -H "X-API-Key: automailer_live_key_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "sso_token": "<sso_token_from_step_1>"
  }'

# Expected: { "valid": true, "user": {...} }
```

**Test 2: Expired SSO Token**
```bash
# Wait 11 minutes after generating token, then verify
curl -X POST https://proleads-network.com/api/sso/verify \
  -H "X-API-Key: automailer_live_key_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "sso_token": "<expired_token>"
  }'

# Expected: { "valid": false, "error": "Token expired" }
```

**Test 3: Token Reuse Prevention**
```bash
# Verify same token twice
curl -X POST https://proleads-network.com/api/sso/verify \
  -H "X-API-Key: automailer_live_key_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "sso_token": "<already_used_token>"
  }'

# Expected: { "valid": false, "error": "Token already used" }
```

#### CSV Export Tests

**Test 4: Successful CSV Export**
```bash
curl -X POST https://proleads-network.com/api/integrations/csv-export \
  -H "X-API-Key: automailer_live_key_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123-456",
    "file_id": "csv-file-789",
    "format": "csv"
  }'

# Expected: { "success": true, "csv_data": "...", "metadata": {...} }
```

**Test 5: Invalid API Key**
```bash
curl -X POST https://proleads-network.com/api/integrations/csv-export \
  -H "X-API-Key: invalid_key" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123-456",
    "file_id": "csv-file-789"
  }'

# Expected: HTTP 401 { "success": false, "error": "Invalid API key" }
```

**Test 6: User Access Control**
```bash
# Request CSV file that user doesn't own
curl -X POST https://proleads-network.com/api/integrations/csv-export \
  -H "X-API-Key: automailer_live_key_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "file_id": "csv-file-owned-by-different-user"
  }'

# Expected: HTTP 403 { "success": false, "error": "CSV file not found or user does not have access" }
```

**Test 7: Rate Limit Enforcement**
```bash
# Make 101 requests rapidly
for i in {1..101}; do
  curl -X POST https://proleads-network.com/api/integrations/csv-export \
    -H "X-API-Key: automailer_live_key_abc123xyz" \
    -H "Content-Type: application/json" \
    -d '{
      "user_id": "user-123-456",
      "file_id": "csv-file-789"
    }'
done

# Expected: First 100 succeed, 101st returns HTTP 429
```

#### API Key Management Tests

**Test 8: Create API Key (Admin)**
```bash
curl -X POST https://proleads-network.com/api/admin/integrations/api-keys \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "integration_name": "automailer",
    "description": "API key for AutoMailer integration",
    "permissions": ["csv_export", "user_info", "sso_verify"],
    "rate_limit": 100,
    "rate_limit_period": "hour"
  }'

# Expected: { "success": true, "api_key": {...}, "warning": "..." }
```

**Test 9: Rotate API Key (Admin)**
```bash
curl -X POST https://proleads-network.com/api/admin/integrations/api-keys/<key_id>/rotate \
  -H "Authorization: Bearer <admin_jwt_token>"

# Expected: { "success": true, "new_api_key": "...", "old_api_key_valid_until": "..." }
```

**Test 10: Revoke API Key (Admin)**
```bash
curl -X DELETE https://proleads-network.com/api/admin/integrations/api-keys/<key_id> \
  -H "Authorization: Bearer <admin_jwt_token>"

# Expected: { "success": true, "message": "API key revoked successfully" }

# Verify key is revoked
curl -X POST https://proleads-network.com/api/integrations/csv-export \
  -H "X-API-Key: <revoked_key>" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Expected: HTTP 401 Invalid API key
```

### Testing Checklist

- [ ] SSO token generation works
- [ ] SSO token expiration enforced (10 min)
- [ ] SSO token single-use enforcement
- [ ] SSO user data verification
- [ ] API key generation (admin only)
- [ ] API key hashing (never store plain text)
- [ ] API key validation
- [ ] API key rotation with grace period
- [ ] API key revocation immediate effect
- [ ] CSV export with valid credentials
- [ ] CSV export access control (user owns file)
- [ ] CSV export data integrity (matches database)
- [ ] Rate limiting enforcement (100/hour)
- [ ] Rate limit headers returned
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS only in production
- [ ] CORS configured for trusted domains
- [ ] AutoMailer SSO login handler
- [ ] AutoMailer account creation/linking
- [ ] AutoMailer lead import functionality
- [ ] End-to-end SSO flow
- [ ] End-to-end CSV import flow

---

## Deployment Checklist

### Proleads Network Deployment

**1. Environment Variables:**
```bash
SSO_SECRET_KEY=<generate_strong_secret>
PROLEADS_API_URL=https://proleads-network.com
```

**2. Database Indexes:**
```bash
# Run index creation script
python -c "from server import create_integration_indexes; import asyncio; asyncio.run(create_integration_indexes())"
```

**3. Generate Initial API Key:**
```bash
# Login as admin
# Navigate to Admin → Integrations → API Keys
# Create new API key for "automailer"
# Store securely and share with AutoMailer team
```

**4. Test Endpoints:**
```bash
# Test SSO endpoints
curl https://proleads-network.com/api/sso/initiate
# Test CSV export endpoint
curl https://proleads-network.com/api/integrations/csv-export
```

### AutoMailer Deployment

**1. Environment Variables:**
```bash
PROLEADS_API_URL=https://proleads-network.com
PROLEADS_API_KEY=<api_key_from_proleads_admin>
PROLEADS_SSO_ENABLED=true
```

**2. Test Integration:**
```bash
# Test SSO verification
curl https://automailer.com/sso/login?sso_token=test
# Test CSV import
curl https://automailer.com/api/campaigns/import-leads
```

**3. Frontend Configuration:**
```javascript
// Update Proleads connection URL
const PROLEADS_URL = 'https://proleads-network.com';
```

### Security Checklist

- [ ] All secrets stored in environment variables (never in code)
- [ ] HTTPS enforced on all endpoints
- [ ] API keys hashed in database
- [ ] SSO secret key is strong (32+ random characters)
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled
- [ ] Error logging configured (but not exposed to users)
- [ ] API key rotation procedure documented
- [ ] Backup/recovery plan for API keys
- [ ] Monitoring alerts for suspicious activity

---

## Error Handling & Edge Cases

### Common Errors and Solutions

#### Error 1: SSO Token Expired

**Error:** `{ "valid": false, "error": "Token expired" }`

**Solution:**
- User should re-initiate SSO from Proleads Network
- Frontend should detect this and show "Session expired, please login again"

#### Error 2: Rate Limit Exceeded

**Error:** `HTTP 429 { "error": "Rate limit exceeded", "retry_after": 60 }`

**Solution:**
- Implement exponential backoff in AutoMailer
- Show user friendly message: "Please wait a moment before retrying"
- Log error for monitoring

#### Error 3: Invalid API Key

**Error:** `HTTP 401 { "error": "Invalid API key" }`

**Solution:**
- Check if API key has been revoked in Proleads admin panel
- Verify API key is correctly stored in AutoMailer environment
- Rotate API key if compromised

#### Error 4: User Access Denied

**Error:** `HTTP 403 { "error": "User does not have access to this CSV file" }`

**Solution:**
- Verify user_id matches the file owner
- Check if user account is active (not suspended)
- Ensure file_id is correct

#### Error 5: CSV File Not Found

**Error:** `HTTP 404 { "error": "CSV file not found" }`

**Solution:**
- Verify file_id exists in Proleads database
- Check if file has been deleted
- Use list CSV files endpoint to get valid file_ids

### Edge Cases

**Edge Case 1: User exists in AutoMailer with different email**
- **Solution:** Show account linking page, require email verification

**Edge Case 2: User's Proleads subscription expires during import**
- **Solution:** Check subscription status before import, show friendly message

**Edge Case 3: Large CSV file (approaching 500 line limit)**
- **Solution:** System already enforces 500 line limit, no additional handling needed

**Edge Case 4: Simultaneous API key rotation**
- **Solution:** Both old and new keys valid during 24-hour grace period

**Edge Case 5: Network timeout during CSV export**
- **Solution:** Implement 30-second timeout, retry logic with exponential backoff

---

## Monitoring & Maintenance

### Key Metrics to Monitor

**1. SSO Metrics:**
- SSO token generation rate
- SSO verification success rate
- SSO verification failure reasons
- Average SSO flow completion time

**2. API Key Metrics:**
- API key usage count
- API key validation failure rate
- Rate limit hit frequency
- API key rotation frequency

**3. CSV Export Metrics:**
- CSV export request rate
- CSV export success rate
- Average CSV export response time
- CSV export data size distribution

**4. Error Metrics:**
- 4xx error rate by endpoint
- 5xx error rate by endpoint
- Rate limit violations
- Invalid authentication attempts

### Logging Best Practices

**Log Levels:**
```python
# INFO: Normal operations
logger.info(f"SSO token generated for user {username}")

# WARNING: Suspicious activity
logger.warning(f"Invalid API key used for CSV export")

# ERROR: Failures
logger.error(f"Failed to export CSV: {str(e)}")
```

**Log Retention:**
- Operational logs: 30 days
- Security logs: 90 days
- Audit logs: 1 year

**Sensitive Data:**
- ❌ Never log API keys (hash first 8 chars only)
- ❌ Never log SSO tokens
- ❌ Never log passwords
- ✅ Log user IDs, timestamps, endpoints, status codes

### Maintenance Tasks

**Weekly:**
- [ ] Review API key usage patterns
- [ ] Check rate limit violations
- [ ] Monitor SSO success rates

**Monthly:**
- [ ] Rotate API keys (if security policy requires)
- [ ] Review and clean old SSO sessions
- [ ] Audit CSV export logs
- [ ] Check for unused API keys

**Quarterly:**
- [ ] Security audit of authentication flow
- [ ] Review and update rate limits
- [ ] Performance optimization
- [ ] Update documentation

---

## Appendix

### A. Complete API Reference

**SSO Endpoints:**
- `POST /api/sso/initiate` - Generate SSO token
- `POST /api/sso/verify` - Verify SSO token
- `GET /api/sso/user-info` - Get user information

**CSV Export Endpoints:**
- `POST /api/integrations/csv-export` - Export CSV data
- `GET /api/integrations/csv-files` - List available files

**API Key Management (Admin):**
- `POST /api/admin/integrations/api-keys` - Create API key
- `GET /api/admin/integrations/api-keys` - List API keys
- `DELETE /api/admin/integrations/api-keys/{key_id}` - Revoke key
- `POST /api/admin/integrations/api-keys/{key_id}/rotate` - Rotate key

### B. Database Schema Reference

**sso_sessions:**
```javascript
{
  "token_id": "uuid",
  "user_id": "user-123",
  "target_app": "automailer",
  "created_at": ISODate(),
  "expires_at": ISODate(),
  "used": false,
  "used_at": null
}
```

**integration_api_keys:**
```javascript
{
  "key_id": "uuid",
  "api_key_hash": "bcrypt_hash",
  "integration_name": "automailer",
  "description": "string",
  "permissions": ["csv_export", "user_info"],
  "rate_limit": 100,
  "rate_limit_period": "hour",
  "created_at": ISODate(),
  "expires_at": null,
  "status": "active",
  "last_used_at": ISODate(),
  "usage_count": 0
}
```

**csv_export_logs:**
```javascript
{
  "export_id": "uuid",
  "user_id": "user-123",
  "file_id": "csv-789",
  "integration": "automailer",
  "exported_at": ISODate(),
  "line_count": 500,
  "api_key_id": "key-123..."
}
```

### C. Security Incident Response

**If API Key is Compromised:**
1. Immediately revoke the compromised key
2. Rotate to a new key
3. Notify AutoMailer team
4. Review audit logs for suspicious activity
5. Update security procedures

**If SSO Token is Leaked:**
1. Token auto-expires in 10 minutes
2. Single-use enforcement prevents reuse
3. Monitor SSO verification logs
4. No immediate action required (system protects automatically)

### D. Contact Information

**Proleads Network Technical Support:**
- Email: tech@proleads-network.com
- Emergency: +1-XXX-XXX-XXXX

**AutoMailer Integration Team:**
- Email: integrations@automailer.com
- Documentation: https://docs.automailer.com

---

## Summary

This comprehensive integration plan provides:

✅ **Secure SSO Authentication** - JWT-based, short-lived, single-use tokens  
✅ **Server-to-Server CSV Transfer** - API key authentication with rate limiting  
✅ **Complete Implementation Details** - Code samples for both applications  
✅ **Security Best Practices** - Hashed keys, HTTPS, proper error handling  
✅ **Testing Procedures** - 10+ test scenarios with expected results  
✅ **Deployment Checklist** - Step-by-step deployment guide  
✅ **Monitoring & Maintenance** - Metrics, logging, and maintenance tasks  
✅ **Error Handling** - Common errors and edge cases addressed  

This plan is **implementation-ready** and addresses all security vulnerabilities identified in the previous version.

---

**Document Version:** 2.0  
**Last Updated:** 2025-01-27  
**Status:** Ready for Implementation  
**Next Steps:** Review plan → Generate API keys → Implement Proleads endpoints → Implement AutoMailer integration → Test → Deploy
