# Production Registration Troubleshooting Guide

## Issue
Registration failing in production environment at https://proleads.network with error: "Registration failed"

## Potential Causes & Solutions

### 1. Database Connection Issues

**Symptoms**: Registration fails immediately
**Check**:
```bash
# Check if MongoDB is accessible in production
mongosh "$MONGO_URL" --eval "db.runCommand({ ping: 1 })"
```

**Solution**: Ensure MONGO_URL environment variable is correctly set in production

### 2. Environment Variables Not Set

**Critical Variables for Registration**:
- `MONGO_URL` - Database connection
- `DB_NAME` - Database name  
- `JWT_SECRET` - For token generation
- `JWT_ALGORITHM` - Usually "HS256"

**Check in Production**:
```bash
# Via deployment agent or console
echo $MONGO_URL
echo $DB_NAME
echo $JWT_SECRET
```

### 3. Email Service Configuration

If registration includes email sending (welcome email), check:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`

**Note**: Email failures shouldn't block registration but might cause errors

### 4. HTTPS/SSL Certificate Issues

**Check**:
- Is the site loading with valid SSL? (https://proleads.network)
- Are API calls going to HTTPS endpoints?
- Mixed content warnings in browser console?

### 5. Backend Service Not Running

**Check**:
```bash
# Check if backend service is running
sudo supervisorctl status backend

# Check backend logs
tail -f /var/log/supervisor/backend.err.log
```

### 6. Frontend API URL Configuration

**Issue**: Frontend trying to call wrong backend URL

**Check**: `/app/frontend/.env`
```bash
cat /app/frontend/.env | grep REACT_APP_BACKEND_URL
```

**Should be**: 
```
REACT_APP_BACKEND_URL=https://proleads.network/api
```

Or if using subdomain:
```
REACT_APP_BACKEND_URL=https://api.proleads.network
```

### 7. Database Index Issues

Sometimes missing indexes can cause silent failures:

```bash
# Check if users collection has required indexes
mongosh "$MONGO_URL" --eval "use $DB_NAME; db.users.getIndexes()"
```

**Should have indexes on**:
- `username` (unique)
- `email` (unique)
- `address` (unique)
- `referral_code` (unique)

### 8. Password Hashing Library Missing

**Check if bcrypt is installed in production**:
```bash
pip list | grep bcrypt
```

**Should show**: `bcrypt==4.x.x`

### 9. CORS Issues (Despite Wildcard)

Some production environments have additional CORS restrictions:

**Solution**: Update CORS to be explicit:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://proleads.network",
        "https://www.proleads.network",
        "http://localhost:3000"  # For local testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 10. Rate Limiting or Firewall

Production might have rate limiting or firewall rules blocking requests

## Debugging Steps

### Step 1: Check Browser Console
1. Open browser dev tools (F12)
2. Go to Network tab
3. Try to register
4. Check the failed request:
   - Status code?
   - Response body?
   - Request payload sent?

### Step 2: Test Backend Directly

Use the deployment agent to call the troubleshooting agent with production logs:

```bash
# Get recent backend logs
tail -n 100 /var/log/supervisor/backend.err.log

# Test database connection
cd /app/backend && python3 << 'EOF'
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def test_db():
    try:
        client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
        db = client[os.getenv("DB_NAME")]
        result = await db.command("ping")
        print("✓ Database connected successfully")
        print(f"Collections: {await db.list_collection_names()}")
        client.close()
    except Exception as e:
        print(f"✗ Database connection failed: {e}")

asyncio.run(test_db())
EOF
```

### Step 3: Test Registration Endpoint

```bash
# Test registration API directly
curl -X POST https://proleads.network/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "test@example.com",
    "password": "TestPass123!",
    "wallet_address": "0x1234567890123456789012345678901234567890",
    "referrer_code": ""
  }'
```

### Step 4: Check for Missing Dependencies

```bash
# Check all required packages
cd /app/backend
pip list | grep -E "fastapi|motor|bcrypt|pydantic|python-jose"
```

## Common Production-Specific Issues

### Issue: "Registration failed" Generic Error

**Cause**: Exception caught on line 795 without specific error details

**Immediate Fix**: Check backend logs at the exact time of registration attempt

**Long-term Fix**: Add more detailed error logging in production

### Issue: Frontend Can't Reach Backend

**Symptoms**: 
- Network error in browser console
- CORS error
- Connection refused

**Check**:
1. Backend service is running
2. Port 8001 is accessible (should be mapped via ingress)
3. `/api` routes are correctly proxied

### Issue: Database Write Permissions

**Cause**: Production database might have restricted write permissions

**Check**:
```bash
# Test write permissions
cd /app/backend && python3 << 'EOF'
import os, asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_write():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db = client[os.getenv("DB_NAME")]
    try:
        result = await db.test_collection.insert_one({"test": "data"})
        await db.test_collection.delete_one({"_id": result.inserted_id})
        print("✓ Database write permissions OK")
    except Exception as e:
        print(f"✗ Database write failed: {e}")
    client.close()

asyncio.run(test_write())
EOF
```

## Quick Fixes

### Fix 1: Restart Backend Service
```bash
sudo supervisorctl restart backend
sleep 3
tail -n 20 /var/log/supervisor/backend.err.log
```

### Fix 2: Check and Update Environment Variables

If APP_URL was changed, ensure all dependent services are restarted:
```bash
sudo supervisorctl restart all
```

### Fix 3: Verify Database Name

The .env file has `DB_NAME="test_database"` - ensure this matches production:
```bash
cat /app/backend/.env | grep DB_NAME
```

## Next Steps

1. **Get exact error message**: Check browser network tab for actual error response
2. **Check backend logs**: Look for errors at the exact timestamp of registration
3. **Test database**: Ensure MongoDB is accessible and writable
4. **Verify env vars**: Especially MONGO_URL, DB_NAME, JWT_SECRET

## Contact Support

If issue persists, provide:
- Exact error message from browser network tab
- Backend logs from registration attempt timestamp
- Output of database connection test
- Browser console errors (if any)

---

**Note**: The generic "Registration failed" error comes from line 795 in server.py which catches all exceptions. The actual error will be in the backend logs.
