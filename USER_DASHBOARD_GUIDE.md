# Proleads Network - User Dashboard Guide

## Dashboard Overview

The Proleads user dashboard is a comprehensive control center where members manage their affiliate business, track earnings, access leads, and monitor their network growth. The dashboard features a left sidebar navigation with 11 main sections accessible through tabs.

---

## Navigation Structure

### Sidebar Menu Items

```
📊 Dashboard (Overview)
📄 My Leads
🔗 Affiliate (Expandable Menu)
   ├─ 🔗 Affiliate Tools
   ├─ 🌐 Network Tree
   └─ 👥 Referrals
💰 Earnings
📈 Payment History
🏆 Milestones
📧 Autoresponder
⚙️  Account
💬 Tickets
```

---

## Detailed Tab Descriptions

### 1. 📊 Dashboard (Overview Tab)

**Purpose**: Main landing page showing key performance metrics at a glance

**Content:**
- **Welcome Banner**: Personalized greeting with username
- **Quick Stats Cards** (4 cards):
  - Total Earnings (with icon)
  - Total Referrals count
  - Network Size
  - Current Membership Tier
- **Subscription Status**:
  - Tier level badge
  - Expiration date
  - Renewal button (if expiring soon)
  - Upgrade options
- **KYC Verification Status**:
  - Verification badge (verified/pending/unverified)
  - Quick action button to complete KYC
  - Warning if verification required for certain features
- **Quick Actions**:
  - Copy referral link
  - Share on social media
  - View network tree
  - Access leads
- **Recent Activity Feed**:
  - Latest commissions earned
  - New referrals joined
  - Milestone achievements
  - System notifications

**Key Features:**
- Real-time statistics
- Visual tier badge
- Subscription renewal alerts
- KYC status warnings
- One-click access to critical features

---

### 2. 📄 My Leads

**Purpose**: Access and manage CSV lead files provided by the platform

**Content:**
- **Lead Files List**:
  - File name display
  - Upload date
  - File size
  - Number of leads in file
  - Status (Available/Processing)
  
- **File Actions**:
  - **Download CSV**: Export leads to your computer
  - **Export to Sendloop**: One-click transfer via SSO integration
  - File preview (first 10 rows)
  
- **Lead Statistics**:
  - Total leads available
  - Files uploaded this month
  - Most recent file date
  - Lead quality indicators

- **Filter Options**:
  - Sort by date
  - Sort by size
  - Search by filename
  - Filter by status

**Key Features:**
- Direct CSV downloads
- Seamless Sendloop integration
- File management
- Lead tracking

**Integration:**
- Clicking "Export to Sendloop" initiates SSO and redirects to Sendloop with file_id
- URL format: `https://marketing-hub-162.preview.emergentagent.com/import?sso_token=<TOKEN>&file_id=<FILE_ID>`

---

### 3. 🔗 Affiliate (Nested Menu)

This section contains 3 sub-tabs accessible via expandable menu:

#### 3a. 🔗 Affiliate Tools

**Purpose**: Marketing resources and referral link management

**Content:**
- **Your Referral Code**:
  - Unique code display (large, prominent)
  - Copy button with confirmation
  - QR code generation
  
- **Referral Link**:
  - Full URL display
  - One-click copy
  - Short URL option
  - Link customization (if VIP tier)
  
- **Tracking Stats**:
  - Link clicks (last 7/30 days)
  - Click-through rate
  - Conversion rate
  - Source tracking (social, email, direct)

- **Marketing Materials**:
  - Downloadable banners (various sizes)
  - Email templates
  - Social media graphics
  - Pre-written copy
  
- **Share Buttons**:
  - Facebook share
  - Twitter share
  - LinkedIn share
  - WhatsApp share
  - Email template

- **Sendloop Integration**:
  - "Open Sendloop" button
  - Quick access to email marketing platform
  - One-click SSO login

**Key Features:**
- Easy link copying
- Pre-made marketing assets
- Social sharing integration
- Performance tracking
- Sendloop direct access

---

#### 3b. 🌐 Network Tree

**Purpose**: Visual representation of your referral network

**Content:**
- **Interactive Tree Diagram**:
  - You at the center/top
  - Direct referrals (Level 1)
  - Indirect referrals (Levels 2-4)
  - Visual connections showing relationships
  
- **Member Cards** (each node):
  - Username/ID
  - Membership tier badge
  - Join date
  - Status (active/inactive)
  - Total referrals count
  
- **Network Statistics**:
  - Total members in network
  - Breakdown by level (1-4)
  - Active vs inactive members
  - Network growth chart
  - Tier distribution pie chart
  
- **View Options**:
  - Expand/collapse levels
  - Zoom in/out
  - Filter by tier
  - Filter by activity
  - Search member
  
- **Export Options**:
  - Download network as CSV
  - Print network tree
  - Generate PDF report

**Key Features:**
- Visual network visualization
- Interactive drill-down
- Performance metrics per level
- Growth tracking
- Export capabilities

---

#### 3c. 👥 Referrals

**Purpose**: Detailed list and management of all your referrals

**Content:**
- **Referral List Table**:
  - Username
  - Email (partially masked)
  - Membership tier
  - Join date
  - Status (active/pending/expired)
  - Level in your network (1-4)
  - Their referral count
  - Actions (view details)
  
- **Summary Statistics**:
  - Total direct referrals
  - Total network size
  - Average tier level
  - Retention rate
  
- **Performance Metrics**:
  - Conversion rate
  - Upgrade rate (free → paid)
  - Average time to first referral
  - Most productive referrers
  
- **Filters & Sorting**:
  - Filter by tier
  - Filter by level
  - Filter by status
  - Filter by date range
  - Sort by join date, tier, referral count
  
- **Bulk Actions**:
  - Export selected to CSV
  - Send message (future feature)
  - Create group (future feature)

**Key Features:**
- Complete referral directory
- Performance analytics
- Advanced filtering
- Export capabilities
- Direct referral tracking

---

### 4. 💰 Earnings

**Purpose**: Track all commissions and income

**Content:**
- **Earnings Overview**:
  - Total lifetime earnings (large display)
  - This month's earnings
  - Pending earnings (not yet paid)
  - Paid earnings
  - Average monthly income
  
- **Earnings by Level**:
  - Level 1 earnings (direct referrals)
  - Level 2 earnings
  - Level 3 earnings
  - Level 4 earnings
  - Percentage breakdown pie chart
  
- **Commission History Table**:
  - Date received
  - Amount earned
  - From member (username)
  - Commission level (1-4)
  - New member's tier
  - Commission rate applied
  - Status (pending/paid)
  
- **Charts & Graphs**:
  - Monthly earnings trend (line chart)
  - Earnings by tier (bar chart)
  - Growth projection
  - Income sources breakdown
  
- **Filter Options**:
  - Date range selector
  - Filter by level
  - Filter by status
  - Filter by amount
  - Search by member
  
- **Export Features**:
  - Download as CSV
  - Generate PDF report
  - Email summary

**Key Features:**
- Comprehensive earnings tracking
- Visual analytics
- Commission details
- Historical data
- Export reports

---

### 5. 📈 Payment History

**Purpose**: Track all membership payments and transactions

**Content:**
- **Payment Summary**:
  - Total amount paid to platform
  - Number of transactions
  - Last payment date
  - Next payment due (if recurring)
  
- **Transaction History Table**:
  - Date/time
  - Amount
  - Payment method (DePay, crypto type)
  - Transaction ID
  - Purpose (new membership, renewal, upgrade)
  - Tier purchased
  - Status (completed/pending/failed)
  - Receipt download
  
- **Payment Details** (per transaction):
  - Full transaction hash (for crypto)
  - Wallet address used
  - Conversion rate (if applicable)
  - Fees paid
  - Net amount received
  
- **Filters**:
  - Date range
  - Payment status
  - Payment type
  - Tier
  - Amount range
  
- **Quick Actions**:
  - Download receipt
  - View transaction on blockchain
  - Request refund (if eligible)
  - Contact support

**Key Features:**
- Complete payment records
- Blockchain verification
- Receipt generation
- Transaction tracking
- Support access

---

### 6. 🏆 Milestones

**Purpose**: Track achievements and earn bonus rewards

**Content:**
- **Achievement Progress**:
  - Visual milestone tracker (progress bar)
  - Current level/rank
  - Points to next milestone
  - Estimated time to achievement
  
- **Milestone Categories**:
  
  **Referral Milestones:**
  - First referral (Welcome bonus)
  - 10 direct referrals (Bronze Ambassador)
  - 50 direct referrals (Silver Ambassador)
  - 100+ direct referrals (Gold Ambassador)
  
  **Earnings Milestones:**
  - $100 earned (Starter)
  - $1,000 earned (Achiever)
  - $10,000 earned (Star Performer)
  - $50,000+ earned (Elite Member)
  
  **Network Milestones:**
  - 25 network members
  - 100 network members
  - 500 network members
  - 1,000+ network members
  
  **Activity Milestones:**
  - 30 days active
  - 90 days active
  - 365 days active
  - 2+ years active

- **Milestone Cards** (each achievement):
  - Milestone name
  - Description
  - Reward (cash bonus/badge/benefits)
  - Progress bar
  - Status (locked/in progress/achieved)
  - Achievement date (if completed)
  
- **Rewards Summary**:
  - Total bonus cash earned
  - Badges collected
  - Current rank
  - Exclusive benefits unlocked
  
- **Leaderboard** (optional):
  - Top achievers
  - Your ranking
  - Comparison with peers

**Key Features:**
- Gamification elements
- Bonus cash rewards
- Status badges
- Progress tracking
- Recognition system

---

### 7. 📧 Autoresponder

**Purpose**: Access Sendloop email marketing platform

**Content:**
- **Integration Overview**:
  - Sendloop platform description
  - Features available
  - Quick start guide
  
- **Quick Access Button**:
  - Large "Open Sendloop" button
  - One-click SSO login
  - No password required
  
- **Integration Benefits**:
  - Seamless lead import
  - Pre-built email templates
  - Campaign automation
  - Analytics integration
  
- **Usage Stats** (if available):
  - Campaigns sent
  - Open rates
  - Click rates
  - Last campaign date
  
- **Getting Started**:
  - Video tutorial
  - Step-by-step guide
  - Best practices
  - Support resources

**Key Features:**
- One-click access to Sendloop
- SSO integration (no separate login)
- Email marketing capabilities
- Lead synchronization
- Campaign management

**Technical:**
- Clicking button calls `/api/sso/initiate`
- Redirects to: `https://marketing-hub-162.preview.emergentagent.com/dashboard?sso_token=<TOKEN>`
- Auto-login on Sendloop side

---

### 8. ⚙️  Account (Has Sub-tabs)

**Purpose**: Manage account settings and profile

The Account section has its own sub-navigation with 4 tabs:

#### 8a. Settings
- **Profile Information**:
  - Username (display only)
  - Email address
  - Wallet address
  - Join date
  - Referral code
  
- **Security Settings**:
  - Change password
  - Two-factor authentication (if available)
  - Active sessions
  - Login history
  
- **Preferences**:
  - Language selection
  - Timezone
  - Date format
  - Currency display
  
- **Communication Preferences**:
  - Email notifications toggle
  - Marketing emails toggle
  - Newsletter subscription
  - SMS alerts (if available)

#### 8b. Notifications
- **Notification Preferences**:
  - Email notifications:
    - New referrals
    - Commission earned
    - Payment received
    - Milestones achieved
    - System updates
  
  - Push notifications:
    - Browser notifications toggle
    - Mobile app notifications
  
  - Frequency settings:
    - Instant
    - Daily digest
    - Weekly summary
    - Never

- **Notification History**:
  - All past notifications
  - Read/unread status
  - Archive feature
  - Delete option

#### 8c. KYC Verification
- **Verification Status**:
  - Current status badge
  - Verification level
  - Submitted date
  - Review timeline
  
- **Document Upload**:
  - ID document upload
  - Selfie upload
  - Proof of address (if required)
  - Additional documents
  
- **Upload Guidelines**:
  - Accepted document types
  - File size limits
  - Photo quality requirements
  - Privacy information
  
- **Review Status**:
  - Pending review indicator
  - Estimated processing time
  - Rejection reason (if rejected)
  - Resubmission option
  
- **Verification Benefits**:
  - List of features unlocked
  - Higher payout limits
  - Priority support
  - Trust badge

#### 8d. Cancel Account (Future)
- **Account Deletion**:
  - Warning messages
  - Impact explanation
  - Final confirmation
  - Data export before deletion

**Key Features:**
- Complete profile management
- Security controls
- KYC document upload and tracking
- Notification customization
- Privacy settings

---

### 9. 💬 Tickets

**Purpose**: Support ticket system for user assistance

**Content:**
- **View Selector**:
  - List view (default)
  - Create new ticket view
  - Ticket detail view

#### List View:
- **Ticket List Table**:
  - Ticket ID
  - Subject
  - Category (technical/billing/general)
  - Priority (low/medium/high)
  - Status (open/in progress/resolved/closed)
  - Created date
  - Last update
  - Unread replies indicator
  - Actions (view/reply)
  
- **Filter Options**:
  - Filter by status
  - Filter by category
  - Filter by priority
  - Search by keyword
  - Date range
  
- **Quick Stats**:
  - Open tickets count
  - Average response time
  - Resolution rate

#### Create Ticket View:
- **Ticket Form**:
  - Contact type (admin/sponsor)
  - Recipient selection (if applicable)
  - Category dropdown
  - Priority selector
  - Subject line
  - Message text area (with formatting)
  - File attachment (multiple files supported)
  
- **Attachment Handling**:
  - Drag & drop upload
  - File size limit display
  - Preview of attachments
  - Remove attachment option
  - Upload progress indicator
  
- **Actions**:
  - Send ticket button (with loading spinner)
  - Save as draft
  - Cancel button

#### Ticket Detail View:
- **Ticket Information**:
  - Full ticket header
  - Status badge
  - Priority indicator
  - Created date/time
  - Category
  
- **Message Thread**:
  - Original message
  - All replies (chronological)
  - Sender identification (you/admin)
  - Timestamps
  - Attachments with download links
  
- **Reply Form**:
  - Text area for reply
  - Attachment option
  - Send reply button
  
- **Ticket Actions**:
  - Mark as resolved
  - Close ticket
  - Reopen (if closed)
  - Print ticket
  - Email thread

**Key Features:**
- Support ticket creation with attachments
- Real-time status tracking
- File upload capability (7-10 sec delay for emails)
- Ticket history
- Admin response system
- Email notifications

---

## Top Navigation Bar

**Right Side Elements:**

1. **Welcome Message**:
   - "Welcome back"
   - Username display

2. **Notification Bell** 🔔:
   - Unread count badge
   - Dropdown panel with recent notifications
   - Click to view notification details
   - Mark as read
   - Mark all read
   - View all notifications link

3. **Profile Menu** (Dropdown):
   - Account settings
   - Upgrade membership
   - Referral link quick copy
   - Logout button

4. **Mobile Menu Toggle** (Mobile only):
   - Hamburger icon
   - Toggles sidebar visibility

---

## Key Features Across All Tabs

### Universal Elements:

1. **Responsive Design**:
   - Mobile-friendly sidebar (collapses on mobile)
   - Touch-optimized buttons
   - Adaptive layouts
   - Smooth animations

2. **Real-Time Updates**:
   - Statistics refresh automatically
   - Notification bell updates
   - WebSocket support for instant updates
   - Background data syncing

3. **Quick Actions**:
   - Copy referral link (available everywhere)
   - Quick access to support
   - Keyboard shortcuts
   - Search functionality

4. **Data Export**:
   - CSV downloads
   - PDF reports
   - Email summaries
   - Print-friendly views

5. **Help & Support**:
   - Tooltips on hover
   - Help icons
   - Tutorial videos
   - Knowledge base links

6. **Loading States**:
   - Skeleton screens
   - Progress indicators
   - Loading spinners
   - Success/error messages

7. **Error Handling**:
   - Friendly error messages
   - Retry options
   - Support contact
   - Detailed error logs (for support)

---

## Navigation Flow

### Common User Journeys:

**New User Setup:**
1. Dashboard → Review stats
2. Account → Complete KYC
3. Affiliate Tools → Copy referral link
4. Start promoting

**Daily Check-in:**
1. Dashboard → Check earnings
2. Notifications → Review activity
3. Earnings → View new commissions
4. Referrals → Check new sign-ups

**Lead Access:**
1. My Leads → Browse files
2. Download or Export to Sendloop
3. Autoresponder → Create campaigns

**Network Management:**
1. Network Tree → Visualize growth
2. Referrals → Analyze performance
3. Earnings → Track commissions
4. Milestones → Check progress

**Support:**
1. Tickets → Create new ticket
2. Attach screenshots
3. Track response
4. Close when resolved

---

## Technical Details

### Frontend Technology:
- React 18
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling
- Lucide React for icons
- Recharts for data visualization

### State Management:
- React useState for local state
- WebSocket for real-time updates
- Local storage for session data
- API polling for notifications

### Performance:
- Lazy loading for tab content
- Infinite scroll for long lists
- Debounced search
- Cached API responses
- Optimized re-renders

---

## Summary

The Proleads user dashboard provides a comprehensive, user-friendly interface for managing an affiliate marketing business. With 11 main sections and intuitive navigation, users can:

✅ Track earnings and commissions in real-time
✅ Visualize and manage their referral network
✅ Access and export premium leads
✅ Integrate with email marketing (Sendloop)
✅ Monitor achievements and milestones
✅ Manage account settings and KYC
✅ Access professional support

The dashboard combines powerful analytics with easy-to-use tools, making it accessible for beginners while providing depth for advanced users.
