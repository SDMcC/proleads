# How to Generate an API Key for AutoMailer Integration

## Step-by-Step Guide

### 1. Login to Admin Dashboard
- Go to your admin dashboard
- Login with credentials: `admin` / `admin123`

### 2. Navigate to Integrations
- In the left sidebar, click on **"Integrations"** tab
- You'll see the API Key Management interface

### 3. Create New API Key
- Click the **"Create API Key"** button (top right)
- Fill in the form:
  - **Integration Name:** `automailer` (or custom name)
  - **Description:** `Production API key for AutoMailer integration`
  - **Permissions:** Check all three:
    - ✅ csv_export
    - ✅ user_info
    - ✅ sso_verify
  - **Rate Limit:** `100` (requests per hour)
- Click **"Create API Key"**

### 4. Save the API Key
⚠️ **IMPORTANT:** The API key will only be shown ONCE!

- A green modal will appear with your new API key
- Click **"Copy"** to copy the key to clipboard
- **Save it immediately** in a secure location:
  - Password manager (1Password, LastPass, etc.)
  - Secrets vault (AWS Secrets Manager, HashiCorp Vault, etc.)
  - Secure document/note (encrypted)

### 5. Share with AutoMailer Team
Send them:
- The API key you just generated
- The setup guide: `/app/AUTOMAILER_INTEGRATION_SETUP.md`

## Managing API Keys

### View All Keys
- The Integrations page shows all your API keys
- You can see:
  - Integration name
  - Description
  - Permissions granted
  - Rate limits
  - Status (active/rotating/revoked)
  - Usage statistics
  - Last used date

### Rotate a Key (if compromised)
- Click the 🔄 rotate icon next to a key
- A new key will be generated
- **Old key remains valid for 24 hours** (grace period)
- Copy the new key immediately!
- Update AutoMailer with the new key within 24 hours

### Revoke a Key
- Click the 🗑️ trash icon next to a key
- Confirm the action
- **The key is immediately revoked** and cannot be used
- AutoMailer will receive 401 errors if they try to use it

## API Key Format
```
automailer_live_key_<random_string>
```

Example:
```
automailer_live_key_abc123xyz789def456ghi
```

## Security Best Practices

✅ **DO:**
- Store keys in secure, encrypted locations
- Use environment variables in production
- Rotate keys periodically (every 90 days recommended)
- Revoke keys immediately if compromised
- Monitor API key usage regularly

❌ **DON'T:**
- Share keys via email or chat
- Commit keys to version control (Git)
- Expose keys in client-side code
- Reuse keys across multiple integrations
- Store keys in plain text files

## Troubleshooting

### Can't see the Integrations tab?
- Make sure you're logged in as admin
- The tab should appear between "Tickets" and "Configuration"
- Refresh the page if needed

### Forgot to save the API key?
- You'll need to rotate the key to get a new one
- Click the rotate icon on the key you just created
- The new key will be displayed

### API key not working?
- Check the key is copied correctly (no extra spaces)
- Verify the key status is "active" (not "revoked")
- Check if rate limit has been exceeded
- Ensure permissions are correct for the operation

## Need Help?
Contact: support@proleads.network
