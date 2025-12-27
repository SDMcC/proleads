# Proleads Network - Admin Dashboard Guide

## Overview

The Admin Dashboard is the central control panel for platform administrators. It provides comprehensive tools for managing members, monitoring revenue, processing payments, handling support tickets, and configuring platform settings.

**Access URL:** `/admin/dashboard`  
**Login URL:** `/admin/login`

---

## Table of Contents

1. [Navigation Structure](#navigation-structure)
2. [Overview Tab](#overview-tab)
3. [Analytics Tab](#analytics-tab)
4. [Members Management](#members-management)
5. [Payments Tab](#payments-tab)
6. [Commissions Tab](#commissions-tab)
7. [Escrow Tab](#escrow-tab)
8. [Milestones Tab](#milestones-tab)
9. [KYC Verification Tab](#kyc-verification-tab)
10. [Leads Distribution Tab](#leads-distribution-tab)
11. [Tickets Tab](#tickets-tab)
12. [Integrations Tab](#integrations-tab)
13. [Configuration Tab](#configuration-tab)

---

## Navigation Structure

The Admin Dashboard sidebar contains the following sections:

| Tab | Icon | Description |
|-----|------|-------------|
| Overview | BarChart3 | Dashboard home with key metrics |
| Analytics | TrendingUp | Financial performance graphs |
| Members | Users | User management and profiles |
| Payments | DollarSign | Payment history and processing |
| Commissions | Activity | Commission tracking and payouts |
| Escrow | AlertCircle | Held payments pending review |
| Milestones | Award | Referral milestone bonuses |
| KYC Verification | Shield | Identity verification management |
| Leads Distribution | FileText | CSV upload and lead management |
| Tickets | MessageCircle | Support ticket system |
| Integrations | Link | API key management |
| Configuration | Settings | Platform configuration |

---

## Overview Tab

The Overview tab provides a quick snapshot of platform health and activity.

### Key Metrics Cards

- **Total Members:** Current member count with monthly growth
- **Total Revenue:** All-time revenue with recent payment count
- **Leads Status:** Remaining leads and CSV upload status
- **Commission Payouts:** Total commissions paid with monthly count
- **Milestones:** Number of milestone achievements this month

### Recent Activity Section

Four cards displaying the latest activity:

1. **Recent Members:** New registrations with tier breakdown
2. **Recent Payments:** Latest completed payments
3. **Recent Milestones:** Recently achieved referral bonuses
4. **Recent Tickets:** Latest support tickets requiring attention

---

## Analytics Tab

The Analytics tab provides visual reports on platform financial performance.

### Summary Metrics

- **Total Income:** Sum of all confirmed payments
- **Total Commissions:** Amount paid to affiliates
- **Net Profit:** Income minus commissions
- **Held Payments:** Funds pending KYC verification (over $50 threshold)

### Time Period Filters

Select from: 1 Day | 1 Week | 1 Month | 1 Year | All Time

### Graphs

1. **Member Growth:** New member registrations over time
2. **Income Growth:** Revenue trends by period
3. **Profit Growth:** Net profit trajectory

All graphs use interactive line charts with tooltips showing exact values.

---

## Members Management

### Features

- **View All Members:** Paginated list with 10 members per page
- **Filter by Tier:** Affiliate, Test, Bronze, Silver, Gold, VIP Affiliate
- **Sortable Columns:** Username, Tier, Referrals, Earnings, Join Date

### Member Table Columns

| Column | Description |
|--------|-------------|
| Member | Username, email, and wallet address |
| Tier | Membership level badge |
| Referrals | Total direct referrals |
| Earnings | Total commission earnings |
| Joined | Registration date |
| Expiry Date | Subscription expiration |
| Status | Active/Suspended, Expired flags |
| Actions | View/Suspend/Unsuspend buttons |

### Member Details Modal

When clicking "View," a detailed modal shows:

**Member Information:**
- Username, Email, Sponsor
- Wallet address
- Join date and subscription expiry
- KYC status (Verified/Pending/Rejected/Unverified)
- Account status (Active/Suspended)

**Statistics:**
- Total Referrals
- Total Earnings
- Total Payments

**Admin Actions:**
- Edit membership tier (dropdown selector)
- Suspend/Unsuspend member
- Save changes

---

## Payments Tab

### Filters

- **User Search:** Filter by username or email
- **Tier:** Filter by membership tier
- **Status:** Completed, Success, Failed, Pending, Processing
- **Date Range:** From/To date pickers

### Payment Table Columns

| Column | Description |
|--------|-------------|
| Payment ID | Unique identifier (+ NowPayments ID if applicable) |
| User | Username, email, wallet address |
| Amount | Payment amount and currency |
| Tier | Membership tier purchased |
| Status | Payment status badge |
| Date | Payment date |

### Actions

- **Clear Filters:** Reset all filter selections
- **Export CSV:** Download filtered payments as CSV file

---

## Commissions Tab

### Filters

Same filtering capabilities as Payments tab:
- User search, tier, status, date range

### Commission Table Columns

| Column | Description |
|--------|-------------|
| Commission ID | Unique identifier |
| Recipient | User receiving commission |
| Source | Payment that generated commission |
| Level | Commission tier level (1-4) |
| Amount | Commission amount |
| Status | Paid/Pending |
| Date | Commission date |

### Actions

- **Clear Filters**
- **Export CSV:** Download commission records

---

## Escrow Tab

The Escrow tab manages held payments requiring manual review.

### Status Filters

- **Pending Review:** Awaiting admin decision
- **Released:** Approved and paid out
- **Held:** Indefinitely held

### Record Details

Each escrow record shows:
- User information
- Payment reason
- Amount held
- Date created
- Current status

### Admin Actions

- Review individual records
- Release funds to user
- Mark as permanently held

---

## Milestones Tab

Manages referral milestone bonuses achieved by members.

### Milestone Thresholds

| Referrals | Bonus |
|-----------|-------|
| 25 | $25 |
| 100 | $100 |
| 250 | $250 |
| 1,000 | $1,000 |
| 5,000 | $2,500 |
| 10,000 | $5,000 |

### Filters

- **Username:** Search by user
- **Date Range:** From/To dates
- **Award Amount:** Filter by specific milestone
- **Status:** Pending or Paid

### Table Columns

| Column | Description |
|--------|-------------|
| Date | Achievement date |
| User | Username and email |
| Total Referrals | Current referral count |
| Milestone Award | Bonus amount |
| Status | Pending/Paid badge |
| Actions | View details button |

### Milestone Details Modal

Shows complete information:
- User details (username, email, wallet)
- Achievement date
- Milestone target and current count
- Bonus amount
- Status with "Mark as Paid" action

### Actions

- **Export CSV:** Download milestone data
- **Mark as Paid:** Update individual milestone status

---

## KYC Verification Tab

Manages Know Your Customer identity verification submissions.

### Status Filters

- **Pending:** Awaiting review
- **Verified:** Approved submissions
- **Rejected:** Declined submissions
- **Unverified:** No submission yet

### Submission Table

| Column | Description |
|--------|-------------|
| User | Username |
| Email | User email |
| Earnings | Total earnings (KYC required above $50) |
| Status | Verification status |
| Submitted | Submission date |
| Action | Review button |

### KYC Review Modal

**User Information:**
- Username, Email
- Total Earnings
- Membership Tier

**Submitted Documents:**
- ID Document image
- Selfie image

**Admin Actions:**
- **Approve KYC:** Mark as verified
- **Reject KYC:** Requires rejection reason

> **Note:** KYC images are stored at FTP path: `https://files.proleads.network/uploads/files.proleads.network/uploads/kyc_documents/`

---

## Leads Distribution Tab

Manages the lead delivery system with four sub-sections.

### 1. Overview Sub-tab

**Global Statistics:**
- Total Leads in system
- Remaining leads available
- Distributed leads count
- Estimated weeks remaining

**Progress Bar:** Visual distribution progress

**Next Scheduled Distribution:** Shows upcoming automated distribution

**Active CSVs:** Lists current CSV files being distributed:
- Filename
- Upload date
- Total/Distributed/Remaining counts
- Progress percentage

**Completed CSVs:** Historical list of exhausted CSV files

### 2. Distributions Sub-tab

**CSV Upload Form:**
- File selector (requires Name, Email, Address columns)
- Options:
  - Skip Duplicates (auto-removes duplicate emails)
  - Validate Emails (checks format & deliverability)

**Distributions Table:**
| Column | Description |
|--------|-------------|
| Filename | CSV file name and uploader |
| Total Leads | Original lead count |
| Distributed | Leads sent out |
| Remaining | Leads available |
| Status | queued/processing/completed/failed |
| Uploaded | Upload date |
| Actions | Distribute/Retry buttons |

### 3. Schedules Sub-tab

Automated distribution scheduling:

**Create/Edit Schedule:**
- Schedule Name
- Frequency (Weekly/Monthly)
- Day of Week/Month
- Time (UTC)
- Minimum Leads Required
- Enabled toggle

**Schedule List Shows:**
- Name and timing
- Next/Last run dates
- Run count
- Enable/Disable toggle
- Edit/Delete actions

### 4. Duplicates Sub-tab

Lists duplicate email addresses found across uploads:
- Email address
- Occurrence count
- Number of distributions affected
- Associated names

---

## Tickets Tab

Full support ticket management system.

### Filters

- **Status:** Open, In Progress, Closed
- **Category:** General, Billing, Leads, Technical
- **Contact Type:** Admin, Sponsor, Downline, News
- **User Search:** Username or email

### Ticket List Table

| Column | Description |
|--------|-------------|
| Subject | Ticket title and ID |
| From | Sender username |
| Type | Contact type |
| Category | Ticket category |
| Priority | High/Medium/Low |
| Status | Open/In Progress/Closed |
| Updated | Last activity date |
| Actions | View button |

### Ticket Details View

**Header Section:**
- Subject and ticket ID
- Status and priority badges
- Category label
- Status change dropdown

**Ticket Information:**
- From/To users
- Contact type
- Created date

**Conversation Thread:**
- All messages in chronological order
- Admin replies highlighted with red border
- User messages with blue border
- Attachment download links

**Admin Reply Section:**
- Text area for response
- Send Admin Reply button

### Mass Message Feature

Send announcements to multiple users:

**Target Options:**
- All Users
- Specific Tiers (checkboxes)

**Message Fields:**
- Subject (required)
- Message body (required)

---

## Integrations Tab

Manages API keys for external system integrations (e.g., AutoMailer).

### API Key List

| Column | Description |
|--------|-------------|
| Integration | Service name |
| Description | Key description |
| Permissions | Granted access levels |
| Rate Limit | Requests per hour |
| Status | Active/Rotating/Revoked |
| Usage | Request count |
| Last Used | Last activity date |
| Actions | Rotate/Revoke buttons |

### Create API Key Modal

**Fields:**
- Integration Name
- Description
- Permissions (checkboxes):
  - csv_export
  - user_info
  - sso_verify
- Rate Limit (requests per hour)

**Important:** The API key is shown only once upon creation. Users must copy and store it securely.

### Key Management

- **Rotate Key:** Generate new key (old key valid for 24 hours)
- **Revoke Key:** Immediately invalidate key

---

## Configuration Tab

Platform-wide configuration management with three sections.

### 1. Membership Tiers

Configure each tier's settings:

- **Price (USD):** Monthly subscription cost
- **Description:** Tier description text
- **Commission Rates:** Multi-level commission percentages (as decimals, e.g., 0.25 = 25%)
- **Enabled:** Toggle tier availability

**Actions:**
- Save Changes
- Reset to Defaults

### 2. Payment Processors

Configure payment gateway credentials:

**Per Processor:**
- API Key (masked)
- Public Key
- IPN Secret (masked)
- Supported Currencies (comma-separated)
- Enabled toggle

> **Note:** Changes may require application restart.

### 3. System Tools

**Migrate Referral Codes:**
Converts old format (`REFFIRSTUSER5DCBEE`) to username-based format (`firstuser`).

- Safe to run multiple times
- Old referral links continue working
- Users see new URLs after re-login

**Migration Result Shows:**
- Total users processed
- Updated count
- Skipped count
- Any warnings/errors

---

## Admin Authentication

### Login Process

1. Navigate to `/admin/login`
2. Enter admin credentials
3. Upon success, redirected to `/admin/dashboard`
4. Admin token stored in `localStorage` as `adminToken`

### Session Management

- Token-based authentication
- Logout clears `adminToken` and redirects to login

### Default Credentials (Test Environment)

- **Username:** `admin`
- **Password:** `admin123`

---

## Best Practices

1. **Regular Monitoring:** Check Overview tab daily for anomalies
2. **KYC Processing:** Review pending submissions promptly to unlock user earnings
3. **Ticket Response:** Prioritize high-priority tickets
4. **Lead Management:** Maintain adequate lead supply (check remaining count)
5. **Backup:** Export payment and commission data regularly
6. **Security:** Rotate API keys periodically; never share in plain text

---

## Troubleshooting

### Common Issues

**KYC Images Not Loading:**
- Check FTP server availability
- Verify image path follows: `files.proleads.network/uploads/files.proleads.network/uploads/kyc_documents/`

**CSV Upload Fails:**
- Ensure CSV has required columns: Name, Email, Address
- Check file size limits
- Verify no encoding issues (use UTF-8)

**Member Not Receiving Leads:**
- Verify subscription is active (not expired)
- Check if member tier is included in distribution schedule
- Ensure leads are available in active CSV

**API Key Issues:**
- Verify key is not revoked
- Check rate limits
- Confirm permissions match required actions

---

*Last Updated: December 2024*
