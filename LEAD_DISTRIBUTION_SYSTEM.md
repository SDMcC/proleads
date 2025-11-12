# Lead Distribution System - Complete Overview

## System Purpose

The Lead Distribution System is designed to automatically distribute leads (sales prospects) from uploaded CSV files to paid members based on their membership tier. It ensures fair distribution while preventing duplicate lead assignments to the same member.

---

## How It Works

### 1. **Admin Uploads CSV File**

**Process:**
- Admin uploads a CSV file containing leads via the Admin Dashboard
- CSV must contain three required columns: `Name`, `Email`, `Address`
- System validates the CSV structure and content

**What Happens:**
```
1. CSV file is validated
2. Each lead is assigned a unique lead_id
3. Distribution record is created with status "queued"
4. Eligible members are counted (Bronze, Silver, Gold tiers only)
5. Estimated distribution timeline is calculated
```

**Database Collections Updated:**
- `lead_distributions` - Main distribution record
- `leads` - Individual lead records

### 2. **Lead Distribution is Triggered**

**Manual Trigger:**
- Admin clicks "Distribute" button on a queued distribution
- System immediately processes the distribution

**What Happens:**
```
1. Status changes to "processing"
2. System retrieves all eligible members (Bronze, Silver, Gold - not suspended)
3. System retrieves available leads (not yet distributed 10 times)
4. Distribution algorithm runs
5. CSV files are generated for each member
6. Email notifications sent to members
7. Status changes to "completed"
```

### 3. **Distribution Algorithm**

**Lead Allocation per Tier:**
```javascript
Bronze:  100 leads
Silver:  250 leads  
Gold:    500 leads
```

**Key Rules:**
- Each lead can be distributed to **maximum 10 different members**
- No member receives the same lead twice
- Members receive their full allocation based on tier
- If insufficient leads available, members get partial allocation

**Distribution Logic Flow:**
```
For each eligible member:
  1. Check if member already has CSV file for this distribution
  2. Determine how many leads they should get (based on tier)
  3. Find available leads:
     - Lead hasn't been assigned to this member before
     - Lead hasn't reached max 10 distributions
  4. Assign leads to member
  5. Generate CSV file with assigned leads
  6. Send email notification
  7. Update lead distribution counts
```

### 4. **CSV File Generation**

**For Each Member:**
```
File format: leads_{username}_{distribution_id}.csv
Content: Name,Email,Address
         "John Doe","john@example.com","123 Main St"
         ...
```

**File Storage:**
- CSV content stored in `member_csv_files` collection
- Not stored as physical files (stored in database)
- Generated on-demand when member downloads

### 5. **Member Access**

**Member Dashboard - "My Leads" Tab:**
- Members see list of available CSV files
- Each file shows:
  - Filename
  - Number of leads
  - Member tier when received
  - Creation date
  - Download count
  - Download button

**Download Process:**
```
1. Member clicks "Download" button
2. System retrieves CSV content from database
3. Browser downloads CSV file
4. Download count increments
5. Downloaded timestamp updated
```

---

## Database Schema

### Collections:

#### 1. `lead_distributions`
```json
{
  "distribution_id": "uuid",
  "filename": "leads_jan_2025.csv",
  "total_leads": 1000,
  "status": "queued|processing|completed|failed",
  "uploaded_by": "admin_username",
  "uploaded_at": "2025-01-09T...",
  "processing_started_at": "2025-01-09T...",
  "processing_completed_at": "2025-01-09T...",
  "eligible_members": 50,
  "estimated_weeks": 2,
  "distributions_made": 2500
}
```

#### 2. `leads`
```json
{
  "lead_id": "uuid",
  "distribution_id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "address": "123 Main St",
  "distribution_count": 3,
  "created_at": "2025-01-09T..."
}
```

#### 3. `member_csv_files`
```json
{
  "file_id": "uuid",
  "member_address": "0x...",
  "member_username": "user123",
  "member_tier": "bronze",
  "distribution_id": "uuid",
  "filename": "leads_user123_abc123.csv",
  "csv_content": "Name,Email,Address\n...",
  "lead_count": 100,
  "created_at": "2025-01-09T...",
  "downloaded": true,
  "downloaded_at": "2025-01-09T...",
  "download_count": 3
}
```

#### 4. `member_leads`
```json
{
  "assignment_id": "uuid",
  "member_address": "0x...",
  "member_username": "user123",
  "member_tier": "bronze",
  "lead_id": "uuid",
  "distribution_id": "uuid",
  "lead_name": "John Doe",
  "lead_email": "john@example.com",
  "lead_address": "123 Main St",
  "assigned_at": "2025-01-09T...",
  "downloaded": true,
  "downloaded_at": "2025-01-09T...",
  "csv_file_id": "uuid"
}
```

---

## API Endpoints

### Admin Endpoints:

#### Upload CSV
```
POST /api/admin/leads/upload
Content-Type: multipart/form-data
Body: csv_file (file)

Response:
{
  "distribution_id": "uuid",
  "total_leads": 1000,
  "eligible_members": 50,
  "estimated_weeks": 2,
  "status": "queued"
}
```

#### Get Distributions
```
GET /api/admin/leads/distributions?page=1&limit=20

Response:
{
  "distributions": [...],
  "total_count": 10,
  "page": 1,
  "limit": 20,
  "total_pages": 1
}
```

#### Trigger Distribution
```
POST /api/admin/leads/distribute/{distribution_id}

Response:
{
  "message": "Lead distribution completed successfully"
}
```

### User Endpoints:

#### Get My CSV Files
```
GET /api/users/leads?page=1&limit=10

Response:
{
  "csv_files": [...],
  "total_count": 5,
  "page": 1,
  "total_pages": 1
}
```

#### Download CSV File
```
GET /api/users/leads/download/{file_id}
Response: CSV file (text/csv)
```

---

## Email Notifications

### Member Notification:
**Trigger:** When leads are distributed to a member
**Subject:** "New Leads Available - {lead_count} Leads"
**Content:**
- Number of leads distributed
- CSV filename
- Instructions to download from dashboard
- Link to dashboard

**Preference:** Can be disabled in Account → Notifications → Lead Distribution

### Admin Notification:
**Trigger:** When distribution completes
**Subject:** "Lead Distribution Complete"
**Content:**
- Distribution ID
- Total leads distributed
- Number of members who received leads
- Status (completed/failed)

---

## Distribution Statistics

### Calculation Examples:

**Example 1: Small Distribution**
```
Uploaded: 100 leads
Members: 5 Bronze (100 each), 2 Silver (250 each), 1 Gold (500)
Total demand: 5×100 + 2×250 + 1×500 = 1500 leads
Available capacity: 100 leads × 10 distributions = 1000

Result: Each lead distributed 10 times
- Bronze members: 62-63 leads each (partial allocation)
- Silver members: 155-156 leads each (partial allocation)
- Gold member: 311 leads (partial allocation)
```

**Example 2: Large Distribution**
```
Uploaded: 10,000 leads
Members: 10 Bronze, 5 Silver, 2 Gold
Total demand: 10×100 + 5×250 + 2×500 = 3,250 leads
Available capacity: 10,000 × 10 = 100,000

Result: All members get full allocation
- Each Bronze: 100 leads
- Each Silver: 250 leads
- Each Gold: 500 leads
- Total distributed: 3,250 assignments
- Each lead distributed: 0-10 times (average 0.3 times)
```

---

## User Interface

### Admin Dashboard - Leads Management

**Upload Section:**
- CSV file upload button
- File format requirements
- Upload progress indicator

**Distributions Table:**
Columns:
- Distribution ID
- Filename
- Total Leads
- Distributed Count
- Status
- Uploaded By
- Upload Date
- Actions (Distribute button)

**Status Indicators:**
- 🟡 Queued - Ready to distribute
- 🔵 Processing - Currently distributing
- 🟢 Completed - Distribution finished
- 🔴 Failed - Distribution encountered error

### Member Dashboard - My Leads

**Summary Cards:**
- Total Files
- Total Leads
- Total Downloads

**CSV Files Table:**
Columns:
- Filename (with icon)
- Lead Count (badge)
- Tier (colored badge)
- Created Date
- Download Count (with last download date)
- Download Button

**Features:**
- Pagination (10 files per page)
- Download tracking
- Unlimited re-downloads

---

## Business Rules

### Eligibility:
✅ **Eligible for Leads:**
- Bronze tier ($20/month)
- Silver tier ($50/month)
- Gold tier ($100/month)

❌ **Not Eligible:**
- Affiliate (free tier)
- VIP Affiliate (free tier)
- Suspended members

### Distribution Limits:
- Maximum 10 distributions per lead
- One distribution per member per lead
- Full allocation based on tier (if available)
- Partial allocation if insufficient leads

### Download Rules:
- Unlimited downloads per CSV file
- Download count tracked
- No expiration on CSV files
- Files persist even after subscription ends

---

## Monitoring & Analytics

### Admin Can Track:
- Total leads uploaded
- Total leads distributed
- Number of active distributions
- Distribution success rate
- Average leads per member
- Download statistics

### Metrics Available:
```javascript
// In Admin Dashboard
{
  "leads": {
    "total": 10000,           // Total leads uploaded
    "distributed": 8500,      // Total assignments made
    "pending": 1500           // Leads in queued/processing distributions
  }
}
```

---

## Error Handling

### CSV Upload Errors:
- Missing required headers → 400 error with details
- Empty CSV → 400 error
- Invalid data in rows → 400 error with row number
- Large file → Progress indicator (no limit set)

### Distribution Errors:
- No eligible members → Warning logged, distribution completes
- No available leads → Warning logged, distribution completes
- Database error → Status set to "failed", error message stored

### Download Errors:
- File not found → 404 error
- Permission denied → 403 error
- Database error → 500 error

---

## Future Enhancement Ideas

### Potential Improvements:
1. **Scheduled Distributions** - Auto-distribute weekly/monthly
2. **Lead Recycling** - Reuse leads after X days
3. **Lead Categories** - Different types of leads (B2B, B2C, etc.)
4. **Member Preferences** - Choose lead categories
5. **Lead Quality Tracking** - Members rate lead quality
6. **Performance Reports** - Which leads convert best
7. **Expiration Dates** - Leads expire after X months
8. **Geographic Filtering** - Distribute by location
9. **Duplicate Detection** - Check for duplicate emails
10. **Lead Verification** - Validate emails before distribution

### Scalability Considerations:
- Current: In-memory CSV processing
- Future: Stream processing for large files (>10MB)
- Current: Synchronous distribution
- Future: Queue-based async distribution for 1000+ members
- Current: Full lead list in memory
- Future: Cursor-based pagination for 100,000+ leads

---

## Technical Notes

### Performance:
- CSV parsing: Uses Python `csv` module
- Distribution: Single-pass algorithm
- Database: Bulk insert for member_leads
- File generation: String concatenation (fast for <10k leads)

### Security:
- Admin-only CSV upload
- User can only download their own files
- No SQL injection (uses MongoDB parameterized queries)
- File content sanitized (CSV escaping)

### Dependencies:
- Python `csv` module (built-in)
- Motor (async MongoDB driver)
- FastAPI for endpoints
- Email service for notifications

---

## Testing Checklist

- [ ] Upload CSV with valid data
- [ ] Upload CSV with missing headers
- [ ] Upload CSV with empty rows
- [ ] Distribute to Bronze members
- [ ] Distribute to Silver members
- [ ] Distribute to Gold members
- [ ] Verify lead count limits per tier
- [ ] Verify no duplicate assignments
- [ ] Verify max 10 distributions per lead
- [ ] Download CSV file
- [ ] Verify download count increments
- [ ] Check email notifications sent
- [ ] Test with insufficient leads
- [ ] Test with no eligible members
- [ ] Verify suspended members excluded
- [ ] Verify free tier members excluded

---

**Status:** ✅ Fully Implemented and Operational
**Last Updated:** January 9, 2025
