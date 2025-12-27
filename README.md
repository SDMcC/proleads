# Proleads Network

A comprehensive affiliate marketing platform with advanced features including multi-tier commission structures, KYC verification, ticket support system, lead distribution, and SSO integration with external applications.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [External Integrations](#external-integrations)
- [Deployment](#deployment)
- [Known Issues](#known-issues)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Proleads Network is a full-stack affiliate marketing platform that enables users to earn commissions through a multi-level referral system. The platform includes advanced features such as:

- Multi-tier membership system (Affiliate, Bronze, Silver, Gold, Test, VIP Affiliate)
- Commission tracking and payouts
- KYC verification system
- Lead distribution and management
- CSV file import/export
- Ticket support system with attachments
- Admin dashboard with analytics
- SSO integration with Sendloop for email marketing

## ✨ Features

### User Features
- **Authentication**: Secure JWT-based authentication with wallet address integration
- **Dashboard**: Comprehensive overview of earnings, referrals, and account status
- **Referral System**: Multi-level commission structure with unlimited depth
- **KYC Verification**: Document upload and verification system
- **Ticket System**: Create and manage support tickets with file attachments
- **Lead Management**: Access to uploaded lead files with export functionality
- **Payment History**: Track all payments and commissions
- **Milestones**: Achievement tracking and rewards
- **Autoresponder**: Integration with Sendloop for email campaigns

### Admin Features
- **User Management**: View, edit, suspend/unsuspend users
- **Member Tier Management**: Change user membership tiers
- **KYC Review**: Review and approve/reject KYC submissions with document viewing
- **Payment Processing**: Track and manage all platform payments
- **Commission Management**: Calculate and distribute commissions
- **Analytics**: Comprehensive dashboard with statistics and trends
- **Lead Distribution**: Upload and manage CSV lead files for users
- **Ticket Management**: Handle user support requests
- **System Configuration**: Manage platform settings and integrations
- **Notification System**: Real-time notifications for admin actions

## 🛠 Tech Stack

### Frontend
- **React 18**: Modern UI library
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Recharts**: Data visualization library

### Backend
- **FastAPI**: High-performance Python web framework
- **Motor**: Async MongoDB driver
- **Pydantic**: Data validation using Python type annotations
- **PyJWT**: JSON Web Token implementation
- **Bcrypt**: Password hashing
- **Python-Multipart**: File upload handling

### Database
- **MongoDB**: NoSQL database for flexible data storage

### External Services
- **DePay**: Crypto payment processor
- **FTP Storage**: File storage for KYC documents and ticket attachments
- **Sendloop**: Email marketing platform (SSO integration)
- **SMTP**: Email notifications

## 📦 Prerequisites

- **Node.js** 16.x or higher
- **Python** 3.9 or higher
- **MongoDB** 4.4 or higher
- **Yarn** package manager
- **FTP Server** access for file storage

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd proleads-network
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install
```

## ⚙️ Configuration

### Backend Configuration

Create `/app/backend/.env` file:

```bash
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=proleads_network

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256

# Application URLs
APP_URL=https://your-app-url.com

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password

# SSO Configuration
SSO_SECRET_KEY=your-sso-secret-key

# FTP File Storage Configuration
FTP_HOST=files.proleads.network
FTP_PORT=21
FTP_USERNAME=uploads@files.proleads.network
FTP_PASSWORD=your-ftp-password
FTP_UPLOAD_DIR=/files.proleads.network/uploads
FTP_PUBLIC_URL=https://files.proleads.network/uploads

# DePay Payment Configuration
DEPAY_INTEGRATION_ID=your-depay-integration-id
DEPAY_PUBLIC_KEY=your-depay-public-key

# Wallet Configuration (Optional - for blockchain features)
HOT_WALLET_ADDRESS=0x...
COLD_WALLET_ADDRESS=0x...
POLYGON_RPC_URL=https://polygon-rpc.com

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=noreply@proleads.network
```

### Frontend Configuration

Create `/app/frontend/.env` file:

```bash
# Backend API URL
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

## 🏃 Running the Application

### Development Mode

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Frontend:**
```bash
cd frontend
yarn start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Documentation: http://localhost:8001/docs

### Production Mode

**Using Supervisor:**

The application uses Supervisor for process management. Configuration files are located in `/etc/supervisor/conf.d/`.

```bash
# Restart services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# Check status
sudo supervisorctl status

# View logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log
```

## 📁 Project Structure

```
proleads-network/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── crypto_utils.py        # Blockchain utilities
│   ├── depay_utils.py         # DePay payment integration
│   ├── ftp_storage.py         # FTP file storage utilities
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend configuration
│
├── frontend/
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── components/        # Reusable components
│   │   │   ├── admin/        # Admin-specific components
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── dashboard/    # User dashboard components
│   │   │   ├── landing/      # Landing page sections
│   │   │   └── shared/       # Shared components
│   │   ├── pages/            # Full page components
│   │   │   ├── admin/        # Admin pages
│   │   │   ├── AffiliatesPage.js
│   │   │   ├── PrivacyPolicyPage.js
│   │   │   ├── RegisterPage.js
│   │   │   └── TermsPage.js
│   │   └── utils/
│   │       └── helpers.js    # Utility functions
│   ├── package.json          # Node dependencies
│   └── .env                  # Frontend configuration
│
├── README.md                  # This file
└── SENDLOOP_URL_UPDATE_AFTER_FORK.md  # SSO configuration guide
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/admin/login` - Admin login

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/kyc/upload-document` - Upload KYC document
- `POST /api/users/kyc/submit` - Submit KYC for verification
- `GET /api/users/referrals` - Get user referrals
- `GET /api/users/earnings` - Get earnings history

### Admin Endpoints

- `GET /api/admin/members` - List all members
- `GET /api/admin/members/{member_id}` - Get member details
- `PUT /api/admin/members/{member_id}` - Update member
- `GET /api/admin/kyc/submissions` - List KYC submissions
- `POST /api/admin/kyc/approve/{submission_id}` - Approve KYC
- `POST /api/admin/kyc/reject/{submission_id}` - Reject KYC
- `GET /api/admin/analytics` - Get platform analytics

### Payment Endpoints

- `POST /api/payments/create` - Create payment
- `GET /api/payments/{payment_id}` - Get payment status
- `GET /api/payments/history` - Get payment history

### Ticket Endpoints

- `POST /api/tickets/create` - Create support ticket
- `POST /api/tickets/upload-attachment` - Upload ticket attachment
- `GET /api/tickets` - List tickets
- `POST /api/tickets/{ticket_id}/reply` - Reply to ticket

### SSO Endpoints

- `POST /api/sso/initiate` - Initiate SSO session
- `POST /api/sso/verify` - Verify SSO token
- `GET /api/sso/user-info` - Get user info from SSO token

For complete API documentation, visit `/docs` endpoint when the backend is running.

## 🔗 External Integrations

### DePay Integration

DePay is used for crypto payment processing. Configuration requires:
- Integration ID
- Public Key
- Webhook configuration for payment callbacks

### FTP File Storage

Files are stored on an external FTP server:
- **KYC Documents**: `/uploads/files.proleads.network/uploads/kyc_documents/`
- **Ticket Attachments**: `/uploads/files.proleads.network/uploads/attachments/`

### Sendloop SSO Integration

The platform integrates with Sendloop for email marketing via SSO:

**Configuration:**
- Proleads initiates SSO with token generation
- Sendloop verifies token via API callback
- Users are automatically logged into Sendloop

**Endpoints:**
- Dashboard: `https://marketing-hub-162.preview.emergentagent.com/dashboard?sso_token=<TOKEN>`
- CSV Import: `https://marketing-hub-162.preview.emergentagent.com/import?sso_token=<TOKEN>&file_id=<FILE_ID>`

See `SENDLOOP_URL_UPDATE_AFTER_FORK.md` for detailed SSO configuration.

## 🚀 Deployment

### Prerequisites for Deployment

1. **Database Queries Optimization**
   - All `.to_list(None)` calls should be replaced with proper limits
   - See "Known Issues" section for details

2. **Environment Variables**
   - Ensure all .env files are properly configured
   - Never commit .env files to version control

3. **FTP Configuration**
   - Verify FTP credentials and connectivity
   - Test file upload/download functionality

4. **SSL Certificates**
   - Ensure HTTPS is configured for production
   - Update CORS settings for production domains

### Deployment Checklist

- [ ] Set up MongoDB instance
- [ ] Configure environment variables
- [ ] Set up FTP server access
- [ ] Configure DePay integration
- [ ] Set up Sendloop SSO
- [ ] Configure email SMTP
- [ ] Test all API endpoints
- [ ] Verify file uploads work
- [ ] Test payment flow
- [ ] Review security settings
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## ⚠️ Known Issues

### 1. Blockchain Dependencies

The application includes blockchain libraries (`web3`, `eth-account`, etc.) for wallet management and crypto payment features. These are used in:
- `backend/crypto_utils.py`
- Wallet address validation
- Hot wallet balance checking

**Note:** If deploying to platforms that don't support blockchain operations, these features may need to be refactored or removed.

### 2. Unoptimized Database Queries

Several database queries use `.to_list(None)` which fetches all documents without limits. These should be updated with appropriate limits:

**Locations in `backend/server.py`:**
- Line 1512: Notifications query
- Line 1589: Admin notifications query
- Line 3526: User search query
- Line 3566: Payments query
- Line 3623: Users export query
- Line 3653: Payments export query
- Line 4519: Earnings query
- Line 4583: Earnings export query
- Line 4681: User payments query

**Recommended fix:**
```python
# Change from:
.to_list(None)

# To:
.to_list(length=100)      # For regular queries
.to_list(length=1000)     # For search queries
.to_list(length=10000)    # For export queries
```

### 3. Ticket Creation Delay

Ticket creation may experience 7-10 second delays due to synchronous email notification sending. This is expected behavior. A loading spinner is shown to users during this time.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Backend**: Follow PEP 8 Python style guide
- **Frontend**: Use ESLint configuration provided
- **Components**: Keep components small (<200 lines)
- **Naming**: Use descriptive variable and function names

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/docs`

---

**Version:** 2.0.0  
**Last Updated:** December 2025  
**Maintained by:** Proleads Network Team
