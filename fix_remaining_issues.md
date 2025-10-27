# Remaining Issues Fix Plan

## Issues to Fix:

1. **Notification Modal Z-Index**: Modal hidden behind dashboard content
2. **Attachment Viewing Error**: Double `/api/api/` in URLs causing 404
3. **Admin Notifications**: Only dates visible, no content
4. **KYC Document Viewing**: Failed to load image error

## Root Causes:

### 1. Notification Modal Z-Index
- Modal has z-50 but dashboard elements might have higher z-index
- Need to increase modal z-index to z-[9999]

### 2. Attachment URLs
- Backend returns: `/api/tickets/attachment/{id}`
- Frontend calls: `${API_URL}${url}` where API_URL = `${BACKEND_URL}/api`
- Result: `/api/api/tickets/attachment/{id}` (404 error)
- **FIX**: Remove `/api` prefix from backend URLs since frontend already adds it

### 3. Admin Notifications Content
- Backend field names: `title` and `message`
- Frontend displays: `subject` and `body`
- **FIX**: Change frontend to use `title` and `message` fields

### 4. KYC Document URLs  
- Same issue as attachments - double `/api/api/` prefix
- **FIX**: Update KYC document URLs in backend

## Implementation Plan:

1. Fix backend attachment URLs (remove `/api` prefix)
2. Fix backend KYC document URLs (remove `/api` prefix)  
3. Fix frontend admin notification display fields
4. Increase notification modal z-index
5. Test all fixes
