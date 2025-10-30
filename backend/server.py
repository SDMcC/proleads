import os
import sys
from fastapi import FastAPI, HTTPException, Depends, Request, WebSocket, WebSocketDisconnect, Header, UploadFile, File, Form
from ftp_storage import upload_file_to_ftp, download_file_from_ftp, get_public_url, get_content_type
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import json
import hmac
import hashlib
import httpx
import asyncio
from datetime import datetime, timedelta
from jose import JWTError, jwt
import uuid
from decimal import Decimal
import logging
from dotenv import load_dotenv
import csv
import io

# Import email service from the same directory
try:
    from email_service import (
        send_new_referral_email,
        send_lead_distribution_email,
        send_payment_confirmation_email,
        send_subscription_reminder_email,
        send_commission_payout_email,
        send_referral_upgrade_email,
        send_admin_milestone_notification,
        send_admin_payment_confirmation,
        send_admin_lead_distribution_status,
        send_admin_ticket_notification
    )
except ImportError as e:
    logging.error(f"Failed to import email_service: {str(e)}")
    # Define dummy functions if import fails
    async def send_new_referral_email(*args, **kwargs): pass
    async def send_lead_distribution_email(*args, **kwargs): pass
    async def send_payment_confirmation_email(*args, **kwargs): pass
    async def send_subscription_reminder_email(*args, **kwargs): pass
    async def send_commission_payout_email(*args, **kwargs): pass
    async def send_referral_upgrade_email(*args, **kwargs): pass
    async def send_admin_ticket_notification(*args, **kwargs): pass
    async def send_admin_milestone_notification(*args, **kwargs): pass
    async def send_admin_payment_confirmation(*args, **kwargs): pass
    async def send_admin_lead_distribution_status(*args, **kwargs): pass

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Web3 Membership Platform")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to load configuration
@app.on_event("startup")
async def startup_event():
    """Load system configuration on startup"""
    await load_system_config()

# Database connection
client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
db = client[os.getenv("DB_NAME")]

# Configuration
NOWPAYMENTS_API_KEY = os.getenv("NOWPAYMENTS_API_KEY")
NOWPAYMENTS_PUBLIC_KEY = os.getenv("NOWPAYMENTS_PUBLIC_KEY")
NOWPAYMENTS_IPN_SECRET = os.getenv("NOWPAYMENTS_IPN_SECRET")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
APP_URL = os.getenv("APP_URL")

# Admin Configuration
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")  # Change in production

# Default membership tiers and commission rates (will be overridden by database config)
DEFAULT_MEMBERSHIP_TIERS = {
    "affiliate": {"price": 0, "commissions": [0.25, 0.05]},
    "test": {"price": 2, "commissions": [0.25, 0.05, 0.03, 0.02]},
    "bronze": {"price": 20, "commissions": [0.25, 0.05, 0.03, 0.02]},
    "silver": {"price": 50, "commissions": [0.27, 0.10, 0.05, 0.03]},
    "gold": {"price": 100, "commissions": [0.30, 0.15, 0.10, 0.05]},
    "vip_affiliate": {"price": 0, "commissions": [0.30, 0.15, 0.10, 0.05]}
}

# Global variable to hold current membership tiers (loaded from database)
MEMBERSHIP_TIERS = DEFAULT_MEMBERSHIP_TIERS.copy()

import bcrypt

# Pydantic models
class UserRegistration(BaseModel):
    username: str
    email: str
    password: str
    wallet_address: str
    referrer_code: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UpdateProfile(BaseModel):
    email: Optional[str] = None
    wallet_address: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class NonceRequest(BaseModel):
    address: str

class VerifySignature(BaseModel):
    address: str
    signature: str

class SimpleLoginRequest(BaseModel):
    address: str
    username: str

class PaymentRequest(BaseModel):
    tier: str
    currency: str = "BTC"

class PayoutRequest(BaseModel):
    address: str
    amount: float
    currency: str = "USDC"

class AdminLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    membership_tier: Optional[str] = None
    wallet_address: Optional[str] = None
    suspended: Optional[bool] = None

class LeadsUpload(BaseModel):
    filename: str
    
class LeadDistribution(BaseModel):
    distribution_id: str
    status: str
    eligible_members: int
    estimated_weeks: int

class MembershipTierConfig(BaseModel):
    tier_name: str
    price: float
    commissions: List[float]
    enabled: bool = True
    description: Optional[str] = None

class PaymentProcessorConfig(BaseModel):
    processor_name: str = "nowpayments"  # nowpayments, atlos, etc.
    api_key: Optional[str] = None
    public_key: Optional[str] = None
    ipn_secret: Optional[str] = None
    enabled: bool = True
    supported_currencies: List[str] = ["BTC", "ETH", "USDC", "USDT"]

class SystemConfig(BaseModel):
    membership_tiers: Dict[str, MembershipTierConfig] = {}
    payment_processors: Dict[str, PaymentProcessorConfig] = {}
    app_settings: Dict[str, Any] = {}
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None

# Ticket system Pydantic models
class TicketCreate(BaseModel):
    contact_type: str  # 'admin', 'sponsor', 'downline_individual', 'downline_mass'
    recipient_address: Optional[str] = None  # For individual downline messages
    category: str  # 'general', 'billing', 'leads', 'technical'
    priority: str  # 'low', 'medium', 'high'
    subject: str
    message: str

class TicketReply(BaseModel):
    ticket_id: str
    message: str

class TicketStatusUpdate(BaseModel):
    status: str  # 'open', 'in_progress', 'closed'

class MassNewsMessage(BaseModel):
    target_type: str  # 'all_users', 'specific_tiers', 'specific_users'
    target_tiers: Optional[List[str]] = None  # ['bronze', 'silver', 'gold']
    target_users: Optional[List[str]] = None  # List of user addresses
    subject: str
    message: str

class Ticket(BaseModel):
    ticket_id: str
    sender_address: str
    sender_username: str
    contact_type: str
    recipient_address: Optional[str] = None
    recipient_username: Optional[str] = None
    category: str
    priority: str
    subject: str
    status: str  # 'open', 'in_progress', 'closed'
    created_at: datetime
    updated_at: datetime
    attachment_count: Optional[int] = 0

class TicketMessage(BaseModel):
    message_id: str
    ticket_id: str
    sender_address: str
    sender_username: str
    sender_role: str  # 'user', 'admin'
    message: str
    attachment_urls: Optional[List[str]] = []
    created_at: datetime

class EmailNotificationPreferences(BaseModel):
    new_referrals: bool = True
    lead_distribution: bool = True
    payment_confirmation: bool = True
    subscription_reminders: bool = True
    commission_payouts: bool = True
    referral_upgrade: bool = True

class UpdateNotificationPreferences(BaseModel):
    new_referrals: Optional[bool] = None
    lead_distribution: Optional[bool] = None
    payment_confirmation: Optional[bool] = None
    subscription_reminders: Optional[bool] = None
    commission_payouts: Optional[bool] = None
    referral_upgrade: Optional[bool] = None

class KYCSubmission(BaseModel):
    id_document: str  # Will be file path
    selfie: str  # Will be file path

class KYCApproval(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                await self.disconnect(connection)

websocket_manager = ConnectionManager()

# Legacy referral code generator - removed in favor of username-based codes

async def load_system_config():
    """Load system configuration from database"""
    global MEMBERSHIP_TIERS
    
    try:
        config_doc = await db.system_config.find_one({"config_type": "main"})
        if config_doc and "membership_tiers" in config_doc:
            # Convert database config to the format expected by the application
            for tier_name, tier_data in config_doc["membership_tiers"].items():
                if tier_data.get("enabled", True):  # Only load enabled tiers
                    MEMBERSHIP_TIERS[tier_name] = {
                        "price": tier_data.get("price", 0),
                        "commissions": tier_data.get("commissions", [])
                    }
            logger.info(f"Loaded configuration: {len(MEMBERSHIP_TIERS)} membership tiers")
        else:
            # Initialize with default configuration
            await save_system_config()
            logger.info("Initialized system configuration with defaults")
    except Exception as e:
        logger.error(f"Failed to load system config: {str(e)}. Using defaults.")
        MEMBERSHIP_TIERS = DEFAULT_MEMBERSHIP_TIERS.copy()

async def save_system_config(membership_tiers=None, payment_processors=None, updated_by="system"):
    """Save system configuration to database"""
    global MEMBERSHIP_TIERS
    
    try:
        # Prepare membership tiers config
        if membership_tiers is None:
            membership_tiers_config = {}
            for tier_name, tier_data in MEMBERSHIP_TIERS.items():
                membership_tiers_config[tier_name] = {
                    "tier_name": tier_name,
                    "price": tier_data["price"],
                    "commissions": tier_data["commissions"],
                    "enabled": True,
                    "description": f"{tier_name.capitalize()} membership tier"
                }
        else:
            membership_tiers_config = membership_tiers
        
        # Prepare payment processors config
        if payment_processors is None:
            payment_processors_config = {
                "nowpayments": {
                    "processor_name": "nowpayments",
                    "api_key": NOWPAYMENTS_API_KEY,
                    "public_key": NOWPAYMENTS_PUBLIC_KEY,
                    "ipn_secret": NOWPAYMENTS_IPN_SECRET,
                    "enabled": True,
                    "supported_currencies": ["BTC", "ETH", "USDC", "USDT", "LTC"]
                }
            }
        else:
            payment_processors_config = payment_processors
        
        # Save to database
        config_doc = {
            "config_type": "main",
            "membership_tiers": membership_tiers_config,
            "payment_processors": payment_processors_config,
            "app_settings": {
                "maintenance_mode": False,
                "registration_enabled": True,
                "referral_system_enabled": True
            },
            "updated_at": datetime.utcnow(),
            "updated_by": updated_by
        }
        
        await db.system_config.update_one(
            {"config_type": "main"},
            {"$set": config_doc},
            upsert=True
        )
        
        logger.info("System configuration saved successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to save system config: {str(e)}")
        return False

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current user from JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Handle different token formats
        if "address" in payload:
            # Web3 authentication
            user = await db.users.find_one({"address": payload["address"]})
        elif "username" in payload and payload.get("role") != "admin":
            # Traditional authentication
            user = await db.users.find_one({"username": payload["username"]})
        else:
            raise HTTPException(status_code=401, detail="Invalid token format")
            
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(authorization: Optional[str] = Header(None)):
    """Get current admin from JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return {"username": payload["username"], "role": "admin"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_user_or_admin(authorization: Optional[str] = Header(None)):
    """Get current user OR admin from JWT token - accepts both"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Check if admin
        if payload.get("role") == "admin":
            return {"username": payload["username"], "role": "admin", "is_admin": True}
        
        # Otherwise it's a regular user
        return {
            "address": payload.get("address"),
            "username": payload.get("username"),
            "email": payload.get("email"),
            "membership_tier": payload.get("membership_tier"),
            "referral_code": payload.get("referral_code"),
            "role": "user",
            "is_admin": False
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def calculate_commissions(new_member_address: str, new_member_tier: str, new_member_amount: float):
    """Calculate and distribute commissions through the referral chain
    
    Logic: 
    - Referrer's tier determines commission RATES
    - Referrer's level/depth determines which rate to use
    - New member's membership price is what commission is calculated from
    """
    commissions_paid = []
    current_referrer_address = None
    
    # Get the new member to find their referrer
    new_member = await db.users.find_one({"address": new_member_address})
    if not new_member or not new_member.get("referrer_address"):
        logger.info(f"No referrer found for {new_member_address}")
        return commissions_paid
    
    current_referrer_address = new_member.get("referrer_address")
    
    # Walk up the referral chain
    for level in range(4):  # Maximum 4 levels
        if not current_referrer_address:
            break
            
        # Get the referrer at this level
        referrer = await db.users.find_one({"address": current_referrer_address})
        if not referrer:
            logger.warning(f"Referrer not found: {current_referrer_address}")
            break
            
        referrer_tier = referrer.get("membership_tier", "affiliate")
        referrer_commission_rates = MEMBERSHIP_TIERS[referrer_tier]["commissions"]
        
        # Move to next level up the chain BEFORE checking eligibility
        # This ensures we continue through all levels even if someone doesn't qualify
        next_referrer_address = referrer.get("referrer_address")
        
        # Check if this referrer's tier has enough commission levels
        if level < len(referrer_commission_rates):
            commission_rate = referrer_commission_rates[level]
            commission_amount = new_member_amount * commission_rate
            
            # Only create commission if amount > 0
            if commission_amount > 0:
                # Record commission
                commission_doc = {
                    "commission_id": str(uuid.uuid4()),
                    "recipient_address": current_referrer_address,
                    "recipient_tier": referrer_tier,
                    "amount": commission_amount,
                    "commission_rate": commission_rate,
                    "level": level + 1,
                    "new_member_address": new_member_address,
                    "new_member_tier": new_member_tier,
                    "new_member_amount": new_member_amount,
                    "status": "pending",
                    "created_at": datetime.utcnow()
                }
                
                await db.commissions.insert_one(commission_doc)
                commissions_paid.append(commission_doc)
                
                # Create commission notification
                await create_notification(
                    user_address=current_referrer_address,
                    notification_type="commission",
                    title="Commission Earned!",
                    message=f"You earned ${commission_amount:.2f} commission from {new_member.get('username', 'new member')}'s {new_member_tier} membership!"
                )
                
                logger.info(f"Commission Level {level + 1}: {referrer_tier} earns {commission_rate*100}% of ${new_member_amount} = ${commission_amount}")
                
                # Initiate instant payout
                await initiate_payout(current_referrer_address, commission_amount)
            else:
                logger.info(f"No commission for level {level + 1} - rate is 0%")
        else:
            logger.info(f"Referrer {referrer_tier} tier only has {len(referrer_commission_rates)} commission levels, skipping level {level + 1}")
            # Don't break - continue to next level in the chain
        
        # Update current_referrer_address for next iteration
        current_referrer_address = next_referrer_address
    
    logger.info(f"Total commissions calculated: {len(commissions_paid)}")
    return commissions_paid

async def initiate_payout(address: str, amount: float):
    """Initiate instant USDC payout"""
    try:
        headers = {
            "x-api-key": NOWPAYMENTS_API_KEY,
            "Content-Type": "application/json"
        }
        
        payout_data = {
            "withdrawals": [{
                "address": address,
                "currency": "USDC",
                "amount": amount,
                "ipn_callback_url": f"{APP_URL}/api/payout-callback"
            }]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.nowpayments.io/v1/payout",
                headers=headers,
                json=payout_data
            )
            
            if response.status_code == 201:
                payout_result = response.json()
                
                # Update commission status
                await db.commissions.update_many(
                    {"recipient_address": address, "status": "pending"},
                    {"$set": {"status": "processing", "payout_id": payout_result.get("id")}}
                )
                
                logger.info(f"Payout initiated for {address}: ${amount} USDC")
                return payout_result
            else:
                logger.error(f"Payout failed: {response.text}")
                return None
                
    except Exception as e:
        logger.error(f"Payout error: {str(e)}")
        return None

@app.post("/api/auth/simple-login")
async def simple_login(request: SimpleLoginRequest):
    """Simple login with wallet address and username (no signature required)"""
    try:
        # Find user by wallet address
        user = await db.users.find_one({"address": request.address.lower()})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify username matches
        if user.get("username") != request.username:
            raise HTTPException(status_code=400, detail="Invalid username for this wallet address")
        
        # Generate JWT token
        token_data = {
            "address": user["address"],
            "username": user["username"],
            "email": user["email"],
            "membership_tier": user.get("membership_tier", "affiliate"),
            "exp": datetime.utcnow() + timedelta(hours=24)
        }
        
        token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        return {"token": token, "user": token_data}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Simple login failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.post("/api/auth/login")
async def login_user(login_data: UserLogin):
    """Login user with username and password"""
    try:
        # Find user by username
        user = await db.users.find_one({"username": login_data.username})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Check if user is suspended
        if user.get("suspended", False):
            raise HTTPException(status_code=403, detail="Account is suspended")
        
        # Verify password
        password_hash = user.get("password_hash")
        if not password_hash or not bcrypt.checkpw(login_data.password.encode('utf-8'), password_hash.encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Generate JWT token
        token_data = {
            "address": user["address"],
            "username": user["username"],
            "email": user["email"],
            "membership_tier": user.get("membership_tier", "affiliate"),
            "referral_code": user.get("referral_code"),
            "exp": datetime.utcnow() + timedelta(hours=24)
        }
        
        token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # Update last active
        await db.users.update_one(
            {"username": login_data.username},
            {"$set": {"last_active": datetime.utcnow()}}
        )
        
        return {"token": token, "user": token_data}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.put("/api/users/profile")
async def update_profile(profile_data: UpdateProfile, current_user: dict = Depends(get_current_user)):
    """Update user profile including wallet address"""
    try:
        update_fields = {}
        
        # Update email if provided
        if profile_data.email:
            # Check if email is already taken by another user
            existing_email = await db.users.find_one({
                "email": profile_data.email,
                "username": {"$ne": current_user["username"]}
            })
            if existing_email:
                raise HTTPException(status_code=400, detail="Email already registered")
            update_fields["email"] = profile_data.email
        
        # Update wallet address if provided
        if profile_data.wallet_address:
            # Check if wallet address is already taken by another user
            existing_wallet = await db.users.find_one({
                "address": profile_data.wallet_address.lower(),
                "username": {"$ne": current_user["username"]}
            })
            if existing_wallet:
                raise HTTPException(status_code=400, detail="Wallet address already registered")
            update_fields["address"] = profile_data.wallet_address.lower()
        
        # Update password if provided
        if profile_data.new_password:
            if not profile_data.current_password:
                raise HTTPException(status_code=400, detail="Current password required to change password")
            
            # Verify current password
            user = await db.users.find_one({"username": current_user["username"]})
            current_hash = user.get("password_hash")
            if not current_hash or not bcrypt.checkpw(profile_data.current_password.encode('utf-8'), current_hash.encode('utf-8')):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
            
            # Hash new password
            new_password_hash = bcrypt.hashpw(profile_data.new_password.encode('utf-8'), bcrypt.gensalt())
            update_fields["password_hash"] = new_password_hash.decode('utf-8')
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields["updated_at"] = datetime.utcnow()
        
        # Update user
        result = await db.users.update_one(
            {"username": current_user["username"]},
            {"$set": update_fields}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get updated user data
        updated_user = await db.users.find_one({"username": current_user["username"]})
        
        return {
            "message": "Profile updated successfully",
            "user": {
                "username": updated_user["username"],
                "email": updated_user["email"],
                "address": updated_user["address"],
                "membership_tier": updated_user["membership_tier"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Profile update failed")

# Legacy Web3 authentication endpoints removed - app now uses username/password authentication only

# Admin authentication endpoint
@app.post("/api/admin/login")
async def admin_login(request: AdminLogin):
    """Admin login with username and password"""
    if request.username != ADMIN_USERNAME or request.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    # Generate admin JWT token
    token_data = {
        "username": request.username,
        "role": "admin",
        "exp": datetime.utcnow() + timedelta(hours=8)  # 8 hour admin session
    }
    token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {"token": token, "role": "admin", "username": request.username}

# User management endpoints
@app.post("/api/users/register", response_model=dict)
async def register_user(user_data: UserRegistration):
    """Register a new user with username, email, password, and wallet address"""
    try:
        # Check if username already exists
        existing_user = await db.users.find_one({"username": user_data.username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Check if email already exists
        existing_email = await db.users.find_one({"email": user_data.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Check if wallet address already exists
        existing_wallet = await db.users.find_one({"address": user_data.wallet_address.lower()})
        if existing_wallet:
            raise HTTPException(status_code=400, detail="Wallet address already registered")
        
        # Hash password
        password_hash = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
        
        # Generate referral code - use lowercase username for clean URLs
        referral_code = user_data.username.lower()
        
        # Handle referrer
        referrer_address = None
        if user_data.referrer_code:
            referrer = await db.users.find_one({"referral_code": user_data.referrer_code})
            if referrer:
                referrer_address = referrer["address"]
        
        # Create user document
        user_doc = {
            "user_id": str(uuid.uuid4()),
            "username": user_data.username,
            "email": user_data.email,
            "password_hash": password_hash.decode('utf-8'),
            "address": user_data.wallet_address.lower(),
            "membership_tier": "affiliate",
            "referral_code": referral_code,
            "referrer_code": user_data.referrer_code,
            "referrer_address": referrer_address,
            "created_at": datetime.utcnow(),
            "suspended": False,
            "kyc_status": "unverified",
            "email_notifications": {
                "new_referrals": True,
                "lead_distribution": True,
                "payment_confirmation": True,
                "subscription_reminders": True,
                "commission_payouts": True,
                "referral_upgrade": True
            }
        }
        
        # Insert user
        result = await db.users.insert_one(user_doc)
        
        # Create referral notification for sponsor if exists
        if referrer_address:
            referrer = await db.users.find_one({"address": referrer_address})
            if referrer:
                await create_notification(
                    user_address=referrer_address,
                    notification_type="referral",
                    title="New Referral!",
                    message=f"{user_data.username} has joined using your referral link!"
                )
                
                # Send email notification to referrer if enabled
                referrer_prefs = referrer.get("email_notifications", {})
                if referrer_prefs.get("new_referrals", True):
                    try:
                        await send_new_referral_email(
                            referrer["email"],
                            referrer["username"],
                            user_data.username
                        )
                    except Exception as e:
                        logger.error(f"Failed to send new referral email: {str(e)}")
                
                # Check milestone achievements for referrer
                await check_milestone_achievements(referrer_address)
        
        logger.info(f"New user registered: {user_data.username} ({user_data.email})")
        
        return {
            "user_id": user_doc["user_id"],
            "username": user_data.username,
            "email": user_data.email,
            "referral_code": referral_code,
            "membership_tier": "affiliate"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.get("/api/users/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile"""
    # Get referral stats
    referral_count = await db.users.count_documents({"referrer_address": current_user["address"]})
    total_earnings = await db.commissions.aggregate([
        {"$match": {"recipient_address": current_user["address"], "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    earnings = total_earnings[0]["total"] if total_earnings else 0.0
    
    return {
        "address": current_user["address"],
        "username": current_user["username"],
        "email": current_user["email"],
        "membership_tier": current_user["membership_tier"],
        "referral_code": current_user["referral_code"],
        "total_referrals": referral_count,
        "total_earnings": earnings,
        "referral_link": f"{APP_URL}/r/{current_user['referral_code']}"
    }

@app.get("/api/users/notification-preferences")
async def get_notification_preferences(current_user: dict = Depends(get_current_user)):
    """Get user's email notification preferences"""
    try:
        user = await db.users.find_one({"address": current_user["address"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get preferences or return defaults
        preferences = user.get("email_notifications", {
            "new_referrals": True,
            "lead_distribution": True,
            "payment_confirmation": True,
            "subscription_reminders": True,
            "commission_payouts": True,
            "referral_upgrade": True
        })
        
        return {"email_notifications": preferences}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch notification preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch notification preferences")

@app.put("/api/users/notification-preferences")
async def update_notification_preferences(
    preferences: UpdateNotificationPreferences,
    current_user: dict = Depends(get_current_user)
):
    """Update user's email notification preferences"""
    try:
        # Get current preferences
        user = await db.users.find_one({"address": current_user["address"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_prefs = user.get("email_notifications", {
            "new_referrals": True,
            "lead_distribution": True,
            "payment_confirmation": True,
            "subscription_reminders": True,
            "commission_payouts": True,
            "referral_upgrade": True
        })
        
        # Update only provided fields
        update_data = {}
        if preferences.new_referrals is not None:
            current_prefs["new_referrals"] = preferences.new_referrals
        if preferences.lead_distribution is not None:
            current_prefs["lead_distribution"] = preferences.lead_distribution
        if preferences.payment_confirmation is not None:
            current_prefs["payment_confirmation"] = preferences.payment_confirmation
        if preferences.subscription_reminders is not None:
            current_prefs["subscription_reminders"] = preferences.subscription_reminders
        if preferences.commission_payouts is not None:
            current_prefs["commission_payouts"] = preferences.commission_payouts
        if preferences.referral_upgrade is not None:
            current_prefs["referral_upgrade"] = preferences.referral_upgrade
        
        # Save updated preferences
        await db.users.update_one(
            {"address": current_user["address"]},
            {"$set": {"email_notifications": current_prefs}}
        )
        
        return {
            "message": "Notification preferences updated successfully",
            "email_notifications": current_prefs
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update notification preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update notification preferences")


@app.get("/api/users/notifications")
async def get_user_notifications(
    page: int = 1,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get paginated notification history for the current user"""
    try:
        user = await db.users.find_one({"address": current_user["address"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_email = user.get("email")
        if not user_email:
            return {
                "notifications": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "total_pages": 0
            }
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Get total count
        total = await db.notifications.count_documents({"user_email": user_email})
        
        # Get unread count
        unread_count = await db.notifications.count_documents({
            "user_email": user_email,
            "read": False
        })
        
        # Get paginated notifications, sorted by most recent first
        notifications = await db.notifications.find(
            {"user_email": user_email}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
        
        # Clean up MongoDB _id field
        for notification in notifications:
            notification.pop("_id", None)
        
        total_pages = (total + limit - 1) // limit  # Ceiling division
        
        return {
            "notifications": notifications,
            "total": total,
            "unread_count": unread_count,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")

@app.put("/api/users/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    try:
        user = await db.users.find_one({"address": current_user["address"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_email = user.get("email")
        
        # Update notification
        result = await db.notifications.update_one(
            {
                "notification_id": notification_id,
                "user_email": user_email
            },
            {"$set": {"read": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"message": "Notification marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update notification")

@app.get("/api/users/notifications/{notification_id}")
async def get_notification_details(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get details of a specific notification"""
    try:
        user = await db.users.find_one({"address": current_user["address"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_email = user.get("email")
        
        notification = await db.notifications.find_one({
            "notification_id": notification_id,
            "user_email": user_email
        })
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Remove MongoDB _id
        notification.pop("_id", None)
        
        # Mark as read when viewing
        await db.notifications.update_one(
            {"notification_id": notification_id},
            {"$set": {"read": True}}
        )
        
        return notification
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch notification details: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch notification")


# KYC System Endpoints
@app.post("/api/users/kyc/upload-document")
async def upload_kyc_document(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Upload KYC document (ID or selfie) to cPanel FTP"""
    try:
        form = await request.form()
        file = form.get("file")
        doc_type = form.get("doc_type")  # 'id_document' or 'selfie'
        
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        if doc_type not in ['id_document', 'selfie']:
            raise HTTPException(status_code=400, detail="Invalid document type")
        
        # Read file content
        contents = await file.read()
        
        # Generate unique filename
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        filename = f"{current_user['address']}_{doc_type}_{uuid.uuid4().hex[:8]}.{file_ext}"
        
        # Upload to FTP
        remote_path = f"kyc_documents/{filename}"
        content_type = get_content_type(filename)
        
        result = await upload_file_to_ftp(contents, remote_path, content_type)
        
        logger.info(f"KYC document uploaded to FTP: {filename} for user {current_user['username']}")
        
        return {
            "message": "Document uploaded successfully",
            "file_path": filename,
            "doc_type": doc_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload KYC document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload document")

@app.post("/api/users/kyc/submit")
async def submit_kyc(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Submit KYC for review"""
    try:
        data = await request.json()
        id_document = data.get("id_document")
        selfie = data.get("selfie")
        
        if not id_document or not selfie:
            raise HTTPException(status_code=400, detail="Both ID document and selfie are required")
        
        # Update user KYC status
        await db.users.update_one(
            {"address": current_user["address"]},
            {"$set": {
                "kyc_status": "pending",
                "kyc_submitted_at": datetime.utcnow(),
                "kyc_documents": {
                    "id_document": id_document,
                    "selfie": selfie
                }
            }}
        )
        
        # Create admin notification
        await create_admin_notification(
            notification_type="kyc",
            title="New KYC Submission",
            message=f"{current_user['username']} has submitted KYC documents for review",
            related_user=current_user["address"]
        )
        
        logger.info(f"KYC submitted for review: {current_user['username']}")
        
        return {"message": "KYC submitted successfully. Your documents are under review."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit KYC: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit KYC")

@app.get("/api/users/kyc/status")
async def get_kyc_status(current_user: dict = Depends(get_current_user)):
    """Get user's KYC status and earning limit"""
    try:
        user = await db.users.find_one({"address": current_user["address"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Calculate total earnings
        total_earnings = await db.commissions.aggregate([
            {"$match": {"recipient_address": current_user["address"], "status": {"$in": ["completed", "pending"]}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
        
        earnings = total_earnings[0]["total"] if total_earnings else 0.0
        
        kyc_status = user.get("kyc_status", "unverified")
        
        # Determine earning limit
        if kyc_status == "verified":
            earning_limit = None  # Unlimited
            earnings_capped = False
        else:
            earning_limit = 50.0
            earnings_capped = earnings >= earning_limit
        
        return {
            "kyc_status": kyc_status,
            "total_earnings": earnings,
            "earning_limit": earning_limit,
            "earnings_capped": earnings_capped,
            "kyc_submitted_at": user.get("kyc_submitted_at"),
            "kyc_verified_at": user.get("kyc_verified_at"),
            "kyc_rejection_reason": user.get("kyc_rejection_reason")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get KYC status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get KYC status")

@app.get("/api/admin/kyc/submissions")
async def get_kyc_submissions(
    status_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    admin: dict = Depends(get_admin_user)
):
    """Get all KYC submissions for admin review"""
    try:
        skip = (page - 1) * limit
        
        # Build query
        query = {}
        if status_filter:
            query["kyc_status"] = status_filter
        else:
            query["kyc_status"] = {"$in": ["pending", "verified", "rejected"]}
        
        # Get total count
        total_count = await db.users.count_documents(query)
        
        # Get submissions
        submissions = await db.users.find(query).skip(skip).limit(limit).sort("kyc_submitted_at", -1).to_list(None)
        
        # Format submissions
        formatted_submissions = []
        for user in submissions:
            # Calculate earnings
            earnings = await db.commissions.aggregate([
                {"$match": {"recipient_address": user["address"], "status": {"$in": ["completed", "pending"]}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]).to_list(1)
            
            total_earnings = earnings[0]["total"] if earnings else 0.0
            
            formatted_submissions.append({
                "user_id": user["address"],
                "username": user["username"],
                "email": user["email"],
                "kyc_status": user.get("kyc_status", "unverified"),
                "kyc_submitted_at": user.get("kyc_submitted_at"),
                "kyc_verified_at": user.get("kyc_verified_at"),
                "kyc_documents": user.get("kyc_documents", {}),
                "kyc_rejection_reason": user.get("kyc_rejection_reason"),
                "total_earnings": total_earnings,
                "membership_tier": user.get("membership_tier")
            })
        
        return {
            "submissions": formatted_submissions,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Failed to get KYC submissions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get KYC submissions")

@app.put("/api/admin/kyc/{user_id}/review")
async def review_kyc(
    user_id: str,
    review: KYCApproval,
    admin: dict = Depends(get_admin_user)
):
    """Approve or reject KYC submission"""
    try:
        user = await db.users.find_one({"address": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if review.approved:
            # Approve KYC
            await db.users.update_one(
                {"address": user_id},
                {"$set": {
                    "kyc_status": "verified",
                    "kyc_verified_at": datetime.utcnow(),
                    "kyc_rejection_reason": None
                }}
            )
            
            # Create notification for user
            await create_notification(
                user_address=user_id,
                notification_type="kyc",
                title="KYC Verified!",
                message="Congratulations! Your KYC has been verified. You can now earn unlimited commissions."
            )
            
            logger.info(f"KYC approved for user {user['username']} by admin {admin['username']}")
            
            return {"message": "KYC approved successfully"}
        else:
            # Reject KYC
            if not review.rejection_reason:
                raise HTTPException(status_code=400, detail="Rejection reason is required")
            
            await db.users.update_one(
                {"address": user_id},
                {"$set": {
                    "kyc_status": "rejected",
                    "kyc_rejection_reason": review.rejection_reason
                }}
            )
            
            # Create notification for user
            await create_notification(
                user_address=user_id,
                notification_type="kyc",
                title="KYC Rejected",
                message=f"Your KYC submission was rejected. Reason: {review.rejection_reason}. Please resubmit with correct documents."
            )
            
            logger.info(f"KYC rejected for user {user['username']} by admin {admin['username']}")
            
            return {"message": "KYC rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to review KYC: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to review KYC")

@app.get("/api/users/kyc/document/{filename}")
async def get_kyc_document(
    filename: str,
    token: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Get KYC document from FTP (admin only)"""
    try:
        # Download from FTP
        remote_path = f"kyc_documents/{filename}"
        content = await download_file_from_ftp(remote_path)
        
        if content is None:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Determine content type based on file extension
        content_type = get_content_type(filename)
        
        from fastapi.responses import Response
        return Response(content=content, media_type=content_type)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get KYC document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get document")

# Notification system functions
async def create_notification(user_address: str, notification_type: str, title: str, message: str):
    """Create a notification for a user"""
    try:
        notification_doc = {
            "notification_id": str(uuid.uuid4()),
            "user_address": user_address,
            "type": notification_type,
            "title": title,
            "message": message,
            "created_at": datetime.utcnow(),
            "read_status": False
        }
        
        await db.notifications.insert_one(notification_doc)
        logger.info(f"Notification created for {user_address}: {title}")
        
    except Exception as e:
        logger.error(f"Failed to create notification: {str(e)}")

async def check_milestone_achievements(user_address: str):
    """Check and create milestone notifications for user based on referral count"""
    try:
        # Get current referral count
        referral_count = await db.users.count_documents({"referrer_address": user_address})
        
        # Define milestone thresholds and rewards
        milestones = {
            25: 25,
            100: 100, 
            250: 250,
            1000: 1000,
            5000: 2500,
            10000: 5000
        }
        
        # Check which milestones have been achieved
        for threshold, reward in milestones.items():
            if referral_count >= threshold:
                # Check if notification already exists for this milestone
                existing_notification = await db.notifications.find_one({
                    "user_address": user_address,
                    "type": "milestone",
                    "message": {"$regex": f"{threshold} referrals"}
                })
                
                if not existing_notification:
                    # Create user notification
                    await create_notification(
                        user_address=user_address,
                        notification_type="milestone",
                        title="Milestone Achievement!",
                        message=f"Congratulations! You've reached {threshold} referrals and earned a ${reward} milestone bonus!"
                    )
                    
                    # Create admin notification for milestone
                    user = await db.users.find_one({"address": user_address})
                    username = user.get("username", "Unknown User") if user else "Unknown User"
                    await create_admin_notification(
                        notification_type="milestone",
                        title="User Milestone Achieved",
                        message=f"{username} reached {threshold} referrals milestone - ${reward} bonus earned!",
                        related_user=user_address
                    )
                    
    except Exception as e:
        logger.error(f"Failed to check milestone achievements: {str(e)}")

@app.get("/api/users/notifications")
async def get_user_notifications(current_user: dict = Depends(get_current_user)):
    """Get notifications for the current user"""
    try:
        notifications = await db.notifications.find(
            {"user_address": current_user["address"]}
        ).sort("created_at", -1).to_list(None)
        
        # Convert ObjectId and datetime for JSON serialization
        for notification in notifications:
            if "_id" in notification:
                del notification["_id"]  # Remove MongoDB ObjectId
            if "created_at" in notification:
                notification["created_at"] = notification["created_at"].isoformat()
        
        return {
            "notifications": notifications,
            "unread_count": len([n for n in notifications if not n["read_status"]])
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")

@app.delete("/api/users/notifications/{notification_id}")
async def clear_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Clear/delete a specific notification"""
    try:
        result = await db.notifications.delete_one({
            "notification_id": notification_id,
            "user_address": current_user["address"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"message": "Notification cleared successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to clear notification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear notification")

@app.post("/api/users/notifications/mark-read")
async def mark_notifications_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read for the current user"""
    try:
        result = await db.notifications.update_many(
            {"user_address": current_user["address"], "read_status": False},
            {"$set": {"read_status": True}}
        )
        
        return {"message": f"Marked {result.modified_count} notifications as read"}
        
    except Exception as e:
        logger.error(f"Failed to mark notifications as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to mark notifications as read")
# Admin notification system functions
async def create_admin_notification(notification_type: str, title: str, message: str, related_user: str = None):
    """Create a notification for admin"""
    try:
        notification_doc = {
            "notification_id": str(uuid.uuid4()),
            "user_address": "admin",  # Special address for admin notifications
            "type": notification_type,
            "title": title,
            "message": message,
            "related_user": related_user,  # Track which user the notification is about
            "created_at": datetime.utcnow(),
            "read_status": False
        }
        
        await db.admin_notifications.insert_one(notification_doc)
        logger.info(f"Admin notification created: {title}")
        
    except Exception as e:
        logger.error(f"Failed to create admin notification: {str(e)}")

@app.get("/api/admin/notifications")
async def get_admin_notifications(admin: dict = Depends(get_admin_user)):
    """Get notifications for admin"""
    try:
        notifications = await db.admin_notifications.find().sort("created_at", -1).to_list(None)
        
        # Convert ObjectId and datetime for JSON serialization
        for notification in notifications:
            if "_id" in notification:
                del notification["_id"]  # Remove MongoDB ObjectId
            if "created_at" in notification:
                notification["created_at"] = notification["created_at"].isoformat()
        
        return {
            "notifications": notifications,
            "unread_count": len([n for n in notifications if not n["read_status"]])
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch admin notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch admin notifications")

@app.delete("/api/admin/notifications/{notification_id}")
async def clear_admin_notification(notification_id: str, admin: dict = Depends(get_admin_user)):
    """Clear/delete a specific admin notification"""
    try:
        result = await db.admin_notifications.delete_one({
            "notification_id": notification_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"message": "Admin notification cleared successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to clear admin notification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear admin notification")

@app.post("/api/admin/notifications/mark-read")
async def mark_admin_notifications_read(admin: dict = Depends(get_admin_user)):
    """Mark all admin notifications as read"""
    try:
        result = await db.admin_notifications.update_many(
            {"read_status": False},
            {"$set": {"read_status": True}}
        )
        
        return {"message": f"Marked {result.modified_count} admin notifications as read"}
        
    except Exception as e:
        logger.error(f"Failed to mark admin notifications as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to mark admin notifications as read")

# Payment endpoints
@app.post("/api/payments/create")
async def create_payment(request: PaymentRequest, current_user: dict = Depends(get_current_user)):
    """Create payment for membership upgrade using NOWPayments White-Label"""
    logger.info(f"Payment request received: tier={request.tier}, currency={request.currency}")
    
    tier_info = MEMBERSHIP_TIERS.get(request.tier)
    if not tier_info:
        raise HTTPException(status_code=400, detail="Invalid membership tier")
    
    if tier_info["price"] == 0:
        # Free affiliate tier - no payment required
        await db.users.update_one(
            {"address": current_user["address"]},
            {"$set": {"membership_tier": request.tier}}
        )
        return {"message": "Membership updated to Affiliate", "payment_required": False}
    
    try:
        headers = {
            "x-api-key": NOWPAYMENTS_API_KEY,
            "Content-Type": "application/json"
        }
        
        # User selects pay_currency from frontend (e.g., "usdcmatic", "btc", "eth")
        # We want to receive USDCMATIC in Custody (auto-conversion enabled)
        pay_currency = request.currency.lower() if request.currency else "usdcmatic"
        
        # Create payment with NOWPayments
        payment_data = {
            "price_amount": tier_info["price"],
            "price_currency": "usd",
            "pay_currency": pay_currency,
            "ipn_callback_url": f"{APP_URL}/api/payments/callback",
            "order_id": f"{current_user['address']}_{request.tier}_{int(datetime.utcnow().timestamp())}",
            "order_description": f"{request.tier.capitalize()} Membership - {current_user['username']}"
        }
        
        logger.info(f"APP_URL: {APP_URL}")
        logger.info(f"IPN Callback URL: {APP_URL}/api/payments/callback")
        logger.info(f"Creating NOWPayments payment: {payment_data}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.nowpayments.io/v1/payment",
                headers=headers,
                json=payment_data,
                timeout=30.0
            )
            
            logger.info(f"NOWPayments response status: {response.status_code}")
            logger.info(f"NOWPayments response: {response.text}")
            
            if response.status_code == 201:
                payment_result = response.json()
                
                # Round pay_amount to 6 decimals for USDC (Polygon has 6 decimal places)
                pay_amount = payment_result.get("pay_amount")
                if isinstance(pay_amount, (int, float)):
                    pay_amount = round(float(pay_amount), 6)
                
                # Store payment record
                payment_doc = {
                    "payment_id": payment_result["payment_id"],
                    "user_address": current_user["address"],
                    "username": current_user.get("username", ""),
                    "email": current_user.get("email", ""),
                    "tier": request.tier,
                    "amount": tier_info["price"],
                    "price_currency": "usd",
                    "pay_currency": payment_result.get("pay_currency"),
                    "status": "waiting",
                    "created_at": datetime.utcnow(),
                    "pay_address": payment_result.get("pay_address"),
                    "pay_amount": pay_amount,
                    "order_id": payment_result.get("order_id")
                }
                
                await db.payments.insert_one(payment_doc)
                
                return {
                    "payment_id": payment_result["payment_id"],
                    "pay_address": payment_result.get("pay_address"),
                    "pay_amount": pay_amount,
                    "pay_currency": payment_result.get("pay_currency"),
                    "price_amount": tier_info["price"],
                    "price_currency": "USD",
                    "status": "created"
                }
            else:
                error_text = response.text
                logger.error(f"NOWPayments error: {error_text}")
                
                try:
                    error_data = response.json()
                    error_message = error_data.get("message", "Payment creation failed")
                except:
                    error_message = "Payment service error"
                
                raise HTTPException(status_code=400, detail=f"Payment creation failed: {error_message}")
                
    except httpx.TimeoutException:
        logger.error("NOWPayments request timeout")
        raise HTTPException(status_code=500, detail="Payment service timeout")
    except Exception as e:
        logger.error(f"Payment creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment service error: {str(e)}")

# Get Payment Status Endpoint
@app.get("/api/payments/{payment_id}")
async def get_payment_status(payment_id: str):
    """Get payment status by payment ID"""
    try:
        payment = await db.payments.find_one({"payment_id": str(payment_id)})
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        return {
            "payment_id": payment.get("payment_id"),
            "status": payment.get("status", "waiting"),
            "tier": payment.get("tier"),
            "amount": payment.get("amount"),
            "created_at": payment.get("created_at").isoformat() if payment.get("created_at") else None,
            "confirmed_at": payment.get("confirmed_at").isoformat() if payment.get("confirmed_at") else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payment status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment status")

# NOWPayments IPN Callback Handler
@app.post("/api/payments/callback")
async def nowpayments_callback(request: Request):
    """Handle NOWPayments IPN (Instant Payment Notification) callbacks"""
    try:
        # Get raw request body
        body = await request.body()
        
        # Get signature from header
        signature = request.headers.get("x-nowpayments-sig")
        
        if not signature:
            logger.warning("NOWPayments IPN: Missing signature header")
            raise HTTPException(status_code=400, detail="Missing signature header")
        
        # Verify IPN signature
        computed_signature = hmac.new(
            NOWPAYMENTS_IPN_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(computed_signature, signature):
            logger.warning("NOWPayments IPN: Invalid signature")
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse IPN payload
        data = json.loads(body)
        payment_id = data.get("payment_id")
        payment_status = data.get("payment_status")
        
        logger.info(f"NOWPayments IPN received: payment_id={payment_id}, status={payment_status}")
        
        # Find payment in database
        payment = await db.payments.find_one({"payment_id": str(payment_id)})
        
        if not payment:
            logger.warning(f"Payment not found for ID: {payment_id}")
            return {"status": "payment not found"}
        
        # Update payment status
        await db.payments.update_one(
            {"payment_id": str(payment_id)},
            {"$set": {"status": payment_status, "updated_at": datetime.utcnow()}}
        )
        
        # Handle payment confirmation
        if payment_status in ["finished", "confirmed"]:
            await handle_payment_confirmed_nowpayments(payment, data)
        
        return {"status": "received"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"NOWPayments IPN error: {str(e)}")
        return {"status": "error", "message": str(e)}

async def handle_payment_confirmed_nowpayments(payment: dict, ipn_data: dict):
    """Handle confirmed NOWPayments payment - upgrade membership and send notifications"""
    try:
        payment_id = ipn_data.get("payment_id")
        user_address = payment["user_address"]
        tier = payment["tier"]
        amount = payment["amount"]
        
        logger.info(f"Processing confirmed NOWPayments payment: {payment_id} for user {user_address}")
        
        # Update payment status to completed
        await db.payments.update_one(
            {"payment_id": str(payment_id)},
            {"$set": {
                "status": "completed",
                "confirmed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "actually_paid": ipn_data.get("actually_paid"),
                "price_amount": ipn_data.get("price_amount"),
                "price_currency": ipn_data.get("price_currency"),
                "pay_amount": ipn_data.get("pay_amount"),
                "pay_currency": ipn_data.get("pay_currency")
            }}
        )
        
        # Calculate subscription expiry (1 year from now for paid tiers)
        subscription_expires_at = None
        if tier not in ["affiliate", "vip_affiliate"]:
            subscription_expires_at = datetime.utcnow() + timedelta(days=365)
        
        # Upgrade membership
        update_data = {"membership_tier": tier}
        if subscription_expires_at:
            update_data["subscription_expires_at"] = subscription_expires_at
        
        await db.users.update_one(
            {"address": user_address},
            {"$set": update_data}
        )
        
        logger.info(f"Upgraded user {user_address} to {tier}")
        
        # Get user info for notifications
        user = await db.users.find_one({"address": user_address})
        username = user.get("username", "Unknown User") if user else "Unknown User"
        user_email = user.get("email", "") if user else ""
        
        # Send payment confirmation email to user
        if user and user_email:
            user_prefs = user.get("email_notifications", {})
            if user_prefs.get("payment_confirmation", True):
                try:
                    await send_payment_confirmation_email(user_email, username, tier, amount)
                    logger.info(f"Sent payment confirmation email to {user_email}")
                except Exception as e:
                    logger.error(f"Failed to send payment confirmation email: {str(e)}")
        
        # Send referral upgrade email to sponsor if exists
        if user:
            referrer_address = user.get("referrer_address")
            if referrer_address:
                referrer = await db.users.find_one({"address": referrer_address})
                if referrer:
                    referrer_prefs = referrer.get("email_notifications", {})
                    if referrer_prefs.get("referral_upgrade", True):
                        try:
                            await send_referral_upgrade_email(
                                referrer["email"],
                                referrer["username"],
                                username,
                                tier
                            )
                            logger.info(f"Sent referral upgrade email to {referrer['email']}")
                        except Exception as e:
                            logger.error(f"Failed to send referral upgrade email: {str(e)}")
        
        # Create admin notification
        await create_admin_notification(
            notification_type="payment",
            title="Payment Confirmed - NOWPayments",
            message=f"{username} upgraded to {tier.capitalize()} membership - ${amount} USD",
            related_user=user_address
        )
        
        # Send admin email notification
        try:
            await send_admin_payment_confirmation(username, tier, amount)
            logger.info(f"Sent admin payment notification for {username}")
        except Exception as e:
            logger.error(f"Failed to send admin payment email: {str(e)}")
        
        # Calculate and distribute commissions
        await calculate_commissions(user_address, tier, amount)
        
        # Broadcast update via WebSocket
        await websocket_manager.broadcast(json.dumps({
            "type": "payment_confirmed",
            "user_address": user_address,
            "tier": tier,
            "amount": amount,
            "processor": "nowpayments"
        }))
        
        logger.info(f"Successfully processed NOWPayments payment confirmation for {username}")
        
    except Exception as e:
        logger.error(f"Error handling NOWPayments payment confirmation: {str(e)}")
        raise

async def coinbase_commerce_webhook(request: Request):
    """Handle Coinbase Commerce webhook events"""
    try:
        # Get raw request body
        body = await request.body()
        
        # Get signature from header
        signature = request.headers.get("X-CC-Webhook-Signature")
        
        if not signature:
            logger.warning("Coinbase Commerce webhook: Missing signature header")
            raise HTTPException(status_code=400, detail="Missing signature header")
        
        # Verify webhook signature
        computed_signature = hmac.new(
            COINBASE_COMMERCE_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(computed_signature, signature):
            logger.warning("Coinbase Commerce webhook: Invalid signature")
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse webhook payload
        payload = json.loads(body)
        
        event_type = payload.get("event", {}).get("type")
        charge_data = payload.get("event", {}).get("data")
        
        logger.info(f"Coinbase Commerce webhook received: {event_type}")
        
        if not charge_data:
            return {"status": "received"}
        
        charge_id = charge_data.get("id")
        charge_code = charge_data.get("code")
        
        # Find payment in database
        payment = await db.payments.find_one({"payment_id": charge_id})
        
        if not payment:
            logger.warning(f"Payment not found for charge ID: {charge_id}")
            return {"status": "payment not found"}
        
        # Handle different event types
        if event_type == "charge:pending":
            # Payment detected but not yet confirmed
            await db.payments.update_one(
                {"payment_id": charge_id},
                {"$set": {"status": "PENDING", "updated_at": datetime.utcnow()}}
            )
            logger.info(f"Payment {charge_id} is pending")
            
        elif event_type == "charge:confirmed":
            # Payment confirmed - upgrade membership
            await handle_payment_confirmed(payment, charge_data)
            
        elif event_type == "charge:failed":
            # Payment failed
            await db.payments.update_one(
                {"payment_id": charge_id},
                {"$set": {"status": "FAILED", "updated_at": datetime.utcnow()}}
            )
            logger.info(f"Payment {charge_id} failed")
            
        elif event_type == "charge:delayed":
            # Payment is delayed (underpaid)
            await db.payments.update_one(
                {"payment_id": charge_id},
                {"$set": {"status": "DELAYED", "updated_at": datetime.utcnow()}}
            )
            logger.info(f"Payment {charge_id} is delayed")
            
        elif event_type == "charge:resolved":
            # Delayed payment was resolved
            await handle_payment_confirmed(payment, charge_data)
        
        return {"status": "received"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Coinbase Commerce webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

async def handle_payment_confirmed(payment: dict, charge_data: dict):
    """Handle confirmed payment - upgrade membership and send notifications"""
    try:
        charge_id = charge_data.get("id")
        user_address = payment["user_address"]
        tier = payment["tier"]
        amount = payment["amount"]
        
        logger.info(f"Processing confirmed payment: {charge_id} for user {user_address}")
        
        # Update payment status
        await db.payments.update_one(
            {"payment_id": charge_id},
            {"$set": {
                "status": "COMPLETED",
                "confirmed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Calculate subscription expiry (1 year from now for paid tiers)
        subscription_expires_at = None
        if tier not in ["affiliate", "vip_affiliate"]:
            subscription_expires_at = datetime.utcnow() + timedelta(days=365)
        
        # Upgrade membership
        update_data = {"membership_tier": tier}
        if subscription_expires_at:
            update_data["subscription_expires_at"] = subscription_expires_at
        
        await db.users.update_one(
            {"address": user_address},
            {"$set": update_data}
        )
        
        logger.info(f"Upgraded user {user_address} to {tier}")
        
        # Get user info for notifications
        user = await db.users.find_one({"address": user_address})
        username = user.get("username", "Unknown User") if user else "Unknown User"
        user_email = user.get("email", "") if user else ""
        
        # Send payment confirmation email to user
        if user and user_email:
            user_prefs = user.get("email_notifications", {})
            if user_prefs.get("payment_confirmation", True):
                try:
                    await send_payment_confirmation_email(user_email, username, tier, amount)
                    logger.info(f"Sent payment confirmation email to {user_email}")
                except Exception as e:
                    logger.error(f"Failed to send payment confirmation email: {str(e)}")
        
        # Send referral upgrade email to sponsor if exists
        if user:
            referrer_address = user.get("referrer_address")
            if referrer_address:
                referrer = await db.users.find_one({"address": referrer_address})
                if referrer:
                    referrer_prefs = referrer.get("email_notifications", {})
                    if referrer_prefs.get("referral_upgrade", True):
                        try:
                            await send_referral_upgrade_email(
                                referrer["email"],
                                referrer["username"],
                                username,
                                tier
                            )
                            logger.info(f"Sent referral upgrade email to {referrer['email']}")
                        except Exception as e:
                            logger.error(f"Failed to send referral upgrade email: {str(e)}")
        
        # Create admin notification
        await create_admin_notification(
            notification_type="payment",
            title="Payment Confirmed - Coinbase Commerce",
            message=f"{username} upgraded to {tier.capitalize()} membership - ${amount} (USDC)",
            related_user=user_address
        )
        
        # Send admin email notification
        try:
            await send_admin_payment_confirmation(username, tier, amount)
            logger.info(f"Sent admin payment notification for {username}")
        except Exception as e:
            logger.error(f"Failed to send admin payment email: {str(e)}")
        
        # Calculate and distribute commissions
        await calculate_commissions(user_address, tier, amount)
        
        # Broadcast update via WebSocket
        await websocket_manager.broadcast(json.dumps({
            "type": "payment_confirmed",
            "user_address": user_address,
            "tier": tier,
            "amount": amount,
            "processor": "coinbase_commerce"
        }))
        
        logger.info(f"Successfully processed payment confirmation for {username}")
        
    except Exception as e:
        logger.error(f"Error handling payment confirmation: {str(e)}")
        raise

async def payment_callback(request: Request):
    """Handle NOWPayments IPN callback"""
    try:
        body = await request.body()
        signature = request.headers.get("x-nowpayments-sig")
        
        # Verify signature
        computed_sig = hmac.new(
            NOWPAYMENTS_IPN_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if signature != computed_sig:
            raise HTTPException(status_code=403, detail="Invalid signature")
        
        data = json.loads(body)
        payment_id = data.get("payment_id") or data.get("invoice_id")
        payment_status = data.get("payment_status") or data.get("status")
        
        logger.info(f"Payment callback received: payment_id={payment_id}, status={payment_status}")
        
        # Update payment status - try both payment_id and invoice_id
        payment = await db.payments.find_one({
            "$or": [
                {"payment_id": payment_id},
                {"invoice_id": payment_id},
                {"nowpayments_id": payment_id}
            ]
        })
        if not payment:
            logger.warning(f"Payment not found for ID: {payment_id}")
            return {"status": "payment not found"}
        
        await db.payments.update_one(
            {"_id": payment["_id"]},
            {"$set": {"status": payment_status, "updated_at": datetime.utcnow()}}
        )
        
        # If payment confirmed, upgrade membership and calculate commissions
        if payment_status == "confirmed":
            user_address = payment["user_address"]
            tier = payment["tier"]
            amount = payment["amount"]
            
            # Calculate subscription expiry (1 year from now for paid tiers)
            subscription_expires_at = None
            if tier != "affiliate" and tier != "vip_affiliate":  # Paid tiers get 1 year subscription
                subscription_expires_at = datetime.utcnow() + timedelta(days=365)
            
            # Upgrade membership with expiry date
            update_data = {"membership_tier": tier}
            if subscription_expires_at:
                update_data["subscription_expires_at"] = subscription_expires_at
                
            await db.users.update_one(
                {"address": user_address},
                {"$set": update_data}
            )
            
            # Get user info for notifications
            user = await db.users.find_one({"address": user_address})
            username = user.get("username", "Unknown User") if user else "Unknown User"
            user_email = user.get("email", "") if user else ""
            
            # Send payment confirmation email to user if enabled
            if user:
                user_prefs = user.get("email_notifications", {})
                if user_prefs.get("payment_confirmation", True) and user_email:
                    try:
                        await send_payment_confirmation_email(user_email, username, tier, amount)
                    except Exception as e:
                        logger.error(f"Failed to send payment confirmation email: {str(e)}")
                
                # Send referral upgrade email to sponsor if exists
                referrer_address = user.get("referrer_address")
                if referrer_address:
                    referrer = await db.users.find_one({"address": referrer_address})
                    if referrer:
                        referrer_prefs = referrer.get("email_notifications", {})
                        if referrer_prefs.get("referral_upgrade", True):
                            try:
                                await send_referral_upgrade_email(
                                    referrer["email"],
                                    referrer["username"],
                                    username,
                                    tier
                                )
                            except Exception as e:
                                logger.error(f"Failed to send referral upgrade email: {str(e)}")
            
            # Create admin notification for payment
            await create_admin_notification(
                notification_type="payment",
                title="Payment Confirmed",
                message=f"{username} upgraded to {tier.capitalize()} membership - ${amount}",
                related_user=user_address
            )
            
            # Send admin email notification
            try:
                await send_admin_payment_confirmation(username, tier, amount)
            except Exception as e:
                logger.error(f"Failed to send admin payment email: {str(e)}")
            
            # Calculate commissions with corrected logic
            await calculate_commissions(user_address, tier, amount)
            
            # Broadcast update
            await websocket_manager.broadcast(json.dumps({
                "type": "payment_confirmed",
                "user_address": user_address,
                "tier": tier,
                "amount": amount
            }))
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Payment callback error: {str(e)}")
        return {"status": "error"}

@app.post("/api/payout-callback")
async def payout_callback(request: Request):
    """Handle NOWPayments payout callback"""
    try:
        body = await request.body()
        signature = request.headers.get("x-nowpayments-sig")
        
        # Verify signature
        computed_sig = hmac.new(
            NOWPAYMENTS_IPN_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if signature != computed_sig:
            raise HTTPException(status_code=403, detail="Invalid signature")
        
        data = json.loads(body)
        payout_id = data["id"]
        status = data["status"]
        
        # Update commission status
        await db.commissions.update_many(
            {"payout_id": payout_id},
            {"$set": {"status": "completed" if status == "finished" else status}}
        )
        
        # Broadcast update
        await websocket_manager.broadcast(json.dumps({
            "type": "payout_update",
            "payout_id": payout_id,
            "status": status
        }))
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Payout callback error: {str(e)}")
        return {"status": "error"}

# Dashboard endpoints
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get user dashboard statistics"""
    # Get earnings
    earnings_pipeline = [
        {"$match": {"recipient_address": current_user["address"]}},
        {"$group": {
            "_id": "$status",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    
    earnings_stats = await db.commissions.aggregate(earnings_pipeline).to_list(None)
    
    # Get referral network
    referrals = await db.users.find({"referrer_address": current_user["address"]}).to_list(None)
    
    # Get recent activity
    recent_commissions = await db.commissions.find(
        {"recipient_address": current_user["address"]}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Format commissions for display
    formatted_commissions = []
    for commission in recent_commissions:
        formatted_commissions.append({
            "id": commission.get("commission_id"),
            "amount": commission.get("amount", 0),
            "commission_rate": commission.get("commission_rate", 0),
            "level": commission.get("level"),
            "new_member_tier": commission.get("new_member_tier"),
            "new_member_amount": commission.get("new_member_amount"),
            "recipient_tier": commission.get("recipient_tier"),
            "status": commission.get("status"),
            "created_at": commission.get("created_at")
        })
    
    # Format earnings by status
    earnings_by_status = {stat["_id"]: stat["total"] for stat in earnings_stats}
    
    # Format referrals for display (avoid ObjectId serialization issues)
    formatted_referrals = []
    for referral in referrals:
        formatted_referrals.append({
            "username": referral.get("username"),
            "email": referral.get("email"), 
            "address": referral.get("address"),
            "membership_tier": referral.get("membership_tier"),
            "created_at": referral.get("created_at"),
            "referral_code": referral.get("referral_code")
        })
    
    return {
        "total_earnings": earnings_by_status.get("completed", 0),
        "pending_earnings": earnings_by_status.get("pending", 0) + earnings_by_status.get("processing", 0),
        "total_referrals": len(referrals),
        "direct_referrals": len([r for r in referrals if r.get("referrer_address") == current_user["address"]]),
        "recent_commissions": formatted_commissions,
        "referral_network": formatted_referrals
    }

@app.get("/api/dashboard/network")
async def get_referral_network(current_user: dict = Depends(get_current_user)):
    """Get referral network for genealogy tree"""
    async def build_network_tree(address: str, level: int = 0, max_level: int = 4):
        if level >= max_level:
            return None
            
        user = await db.users.find_one({"address": address})
        if not user:
            return None
            
        # Get direct referrals
        referrals = await db.users.find({"referrer_address": address}).to_list(None)
        
        # Get earnings from this user
        earnings = await db.commissions.find(
            {"recipient_address": address}
        ).to_list(None)
        
        total_earnings = sum(e["amount"] for e in earnings if e["status"] == "completed")
        
        node = {
            "address": address,
            "username": user.get("username", "Unknown"),
            "membership_tier": user.get("membership_tier", "affiliate"),
            "total_earnings": total_earnings,
            "referral_count": len(referrals),
            "level": level,
            "children": []
        }
        
        # Recursively build children
        for referral in referrals:
            child_node = await build_network_tree(referral["address"], level + 1, max_level)
            if child_node:
                node["children"].append(child_node)
        
        return node
    
    network_tree = await build_network_tree(current_user["address"])
    return {"network_tree": network_tree}

# Admin dashboard endpoints
@app.get("/api/admin/dashboard/overview")
async def get_admin_dashboard_overview(admin: dict = Depends(get_admin_user)):
    """Get admin dashboard overview with summary statistics"""
    try:
        # Get total members count by tier
        total_members = await db.users.count_documents({})
        members_by_tier = await db.users.aggregate([
            {"$group": {"_id": "$membership_tier", "count": {"$sum": 1}}}
        ]).to_list(None)
        
        # Get total payments statistics
        total_payments = await db.payments.count_documents({})
        payments_by_status = await db.payments.aggregate([
            {"$group": {"_id": "$status", "count": {"$sum": 1}, "total_amount": {"$sum": "$amount"}}}
        ]).to_list(None)
        
        # Get total revenue
        total_revenue = await db.payments.aggregate([
            {"$match": {"status": "confirmed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
        
        # Get total commissions statistics
        total_commissions = await db.commissions.count_documents({})
        commissions_by_status = await db.commissions.aggregate([
            {"$group": {"_id": "$status", "count": {"$sum": 1}, "total_amount": {"$sum": "$amount"}}}
        ]).to_list(None)
        
        # Get total commission payouts
        total_payouts = await db.commissions.aggregate([
            {"$match": {"status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
        
        # Get recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        recent_members = await db.users.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        recent_payments = await db.payments.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        recent_commissions = await db.commissions.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        # Format members by tier data
        members_tier_data = {tier["_id"]: tier["count"] for tier in members_by_tier}
        
        # Format payments by status data
        payments_status_data = {
            payment["_id"]: {
                "count": payment["count"],
                "total_amount": payment["total_amount"]
            } for payment in payments_by_status
        }
        
        # Format commissions by status data
        commissions_status_data = {
            comm["_id"]: {
                "count": comm["count"],
                "total_amount": comm["total_amount"]
            } for comm in commissions_by_status
        }
        
        return {
            "members": {
                "total": total_members,
                "by_tier": members_tier_data,
                "recent_30_days": recent_members
            },
            "payments": {
                "total": total_payments,
                "by_status": payments_status_data,
                "total_revenue": total_revenue[0]["total"] if total_revenue else 0,
                "recent_30_days": recent_payments
            },
            "commissions": {
                "total": total_commissions,
                "by_status": commissions_status_data,
                "total_payouts": total_payouts[0]["total"] if total_payouts else 0,
                "recent_30_days": recent_commissions
            },
            "leads": {
                "total": await db.lead_distributions.count_documents({}),
                "distributed": await db.member_leads.count_documents({}),
                "pending": await db.lead_distributions.count_documents({"status": {"$in": ["queued", "processing"]}})
            },
            "milestones": {
                "total_achieved": await db.milestones.count_documents({}),
                "pending_bonuses": await db.milestones.count_documents({"status": "pending"}),
                "total_bonuses_paid": (await db.milestones.aggregate([
                    {"$match": {"status": "paid"}},
                    {"$group": {"_id": None, "total": {"$sum": "$bonus_amount"}}}
                ]).to_list(1))[0]["total"] if await db.milestones.count_documents({"status": "paid"}) > 0 else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Admin dashboard overview error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard overview")

# Admin members management endpoints
@app.get("/api/admin/members")
async def get_all_members(
    tier: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = "desc",
    page: int = 1,
    limit: int = 50,
    admin: dict = Depends(get_admin_user)
):
    """Get all members with optional filtering, sorting, and pagination"""
    try:
        skip = (page - 1) * limit
        
        # Build filter query
        filter_query = {}
        if tier:
            filter_query["membership_tier"] = tier
        
        # Get total count
        total_count = await db.users.count_documents(filter_query)
        
        # Get ALL filtered members first (we need to enrich them for sorting)
        all_filtered_members = await db.users.find(filter_query).to_list(None)
        
        # Enrich ALL members with referral count and earnings for proper sorting
        enriched_all = []
        total_active = 0
        tier_counts = {}
        total_earnings_all = 0
        total_referrals_all = 0
        
        for member in all_filtered_members:
            # Count by tier
            member_tier = member.get("membership_tier", "affiliate")
            tier_counts[member_tier] = tier_counts.get(member_tier, 0) + 1
            
            # Count active
            if not member.get("suspended", False):
                total_active += 1
            
            # Get referral count
            referral_count = await db.users.count_documents({"referrer_address": member["address"]})
            total_referrals_all += referral_count
            
            # Get total earnings
            earnings_pipeline = [
                {"$match": {"recipient_address": member["address"], "status": "completed"}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
            earnings_result = await db.commissions.aggregate(earnings_pipeline).to_list(1)
            total_earnings = earnings_result[0]["total"] if earnings_result else 0.0
            total_earnings_all += total_earnings
            
            # Get sponsor info
            sponsor_info = None
            if member.get("referrer_address"):
                sponsor = await db.users.find_one({"address": member["referrer_address"]})
                if sponsor:
                    sponsor_info = {
                        "username": sponsor["username"],
                        "address": sponsor["address"]
                    }
            
            # Check if subscription is expired
            subscription_expires_at = member.get("subscription_expires_at")
            is_expired = False
            if subscription_expires_at and subscription_expires_at < datetime.utcnow():
                is_expired = True
            
            enriched_member = {
                "id": member["address"],
                "username": member["username"],
                "email": member["email"],
                "wallet_address": member["address"],
                "membership_tier": member["membership_tier"],
                "total_referrals": referral_count,
                "total_earnings": total_earnings,
                "sponsor": sponsor_info,
                "created_at": member["created_at"],
                "last_active": member.get("last_active"),
                "suspended": member.get("suspended", False),
                "referral_code": member["referral_code"],
                "subscription_expires_at": subscription_expires_at,
                "is_expired": is_expired,
                "kyc_status": member.get("kyc_status", "unverified"),
                "kyc_verified_at": member.get("kyc_verified_at")
            }
            enriched_all.append(enriched_member)
        
        # Sort the enriched members
        if sort_by:
            reverse = (sort_direction == "desc")
            if sort_by == "total_referrals":
                enriched_all.sort(key=lambda x: x["total_referrals"], reverse=reverse)
            elif sort_by == "total_earnings":
                enriched_all.sort(key=lambda x: x["total_earnings"], reverse=reverse)
            elif sort_by == "created_at":
                enriched_all.sort(key=lambda x: x["created_at"] if x["created_at"] else datetime.min, reverse=reverse)
            elif sort_by == "username":
                enriched_all.sort(key=lambda x: x["username"].lower(), reverse=reverse)
            elif sort_by == "membership_tier":
                enriched_all.sort(key=lambda x: x["membership_tier"], reverse=reverse)
        else:
            # Default sort by created_at desc
            enriched_all.sort(key=lambda x: x["created_at"] if x["created_at"] else datetime.min, reverse=True)
        
        # Apply pagination AFTER sorting
        enriched_members = enriched_all[skip:skip + limit]
        
        return {
            "members": enriched_members,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
            "stats": {
                "total_members": total_count,
                "active_members": total_active,
                "tier_counts": tier_counts,
                "total_earnings": total_earnings_all,
                "total_referrals": total_referrals_all
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch members: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch members")

@app.get("/api/admin/members/{member_id}")
async def get_member_details(member_id: str, admin: dict = Depends(get_admin_user)):
    """Get detailed information about a specific member"""
    try:
        # Find member by address (using address as member_id)
        member = await db.users.find_one({"address": member_id})
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Get referral count and details
        referrals = await db.users.find({"referrer_address": member_id}).to_list(None)
        
        # Get earnings details
        earnings = await db.commissions.find({"recipient_address": member_id}).to_list(None)
        total_earnings = sum(e["amount"] for e in earnings if e["status"] == "completed")
        pending_earnings = sum(e["amount"] for e in earnings if e["status"] in ["pending", "processing"])
        
        # Get payment history
        payments = await db.payments.find({"user_address": member_id}).to_list(None)
        
        # Get sponsor info
        sponsor_info = None
        if member.get("referrer_address"):
            sponsor = await db.users.find_one({"address": member["referrer_address"]})
            if sponsor:
                sponsor_info = {
                    "username": sponsor["username"],
                    "email": sponsor["email"],
                    "address": sponsor["address"],
                    "membership_tier": sponsor["membership_tier"]
                }
        
        # Check if subscription is expired
        subscription_expires_at = member.get("subscription_expires_at")
        is_expired = False
        if subscription_expires_at and subscription_expires_at < datetime.utcnow():
            is_expired = True
        
        return {
            "member": {
                "id": member["address"],
                "username": member["username"],
                "email": member["email"],
                "wallet_address": member["address"],
                "membership_tier": member["membership_tier"],
                "referral_code": member["referral_code"],
                "created_at": member["created_at"],
                "last_active": member.get("last_active"),
                "suspended": member.get("suspended", False),
                "subscription_expires_at": subscription_expires_at,
                "is_expired": is_expired,
                "kyc_status": member.get("kyc_status", "unverified"),
                "kyc_submitted_at": member.get("kyc_submitted_at"),
                "kyc_verified_at": member.get("kyc_verified_at"),
                "kyc_rejection_reason": member.get("kyc_rejection_reason")
            },
            "sponsor": sponsor_info,
            "stats": {
                "total_referrals": len(referrals),
                "total_earnings": total_earnings,
                "pending_earnings": pending_earnings,
                "total_payments": len(payments)
            },
            "referrals": [
                {
                    "username": r["username"],
                    "email": r["email"],
                    "membership_tier": r["membership_tier"],
                    "created_at": r["created_at"]
                } for r in referrals
            ],
            "recent_earnings": [
                {
                    "amount": e["amount"],
                    "status": e["status"],
                    "created_at": e["created_at"],
                    "level": e.get("level"),
                    "new_member_tier": e.get("new_member_tier")
                } for e in sorted(earnings, key=lambda x: x["created_at"], reverse=True)[:10]
            ],
            "recent_payments": [
                {
                    "amount": p["amount"],
                    "tier": p["tier"],
                    "status": p["status"],
                    "created_at": p["created_at"]
                } for p in sorted(payments, key=lambda x: x["created_at"], reverse=True)[:10]
            ],
            "sponsor": sponsor_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch member details: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch member details")

@app.put("/api/admin/members/{member_id}")
async def update_member(member_id: str, update_data: UserUpdate, admin: dict = Depends(get_admin_user)):
    """Update member information"""
    try:
        # Check if member exists
        existing_member = await db.users.find_one({"address": member_id})
        if not existing_member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Build update query
        update_fields = {}
        if update_data.email is not None:
            update_fields["email"] = update_data.email
        if update_data.membership_tier is not None:
            # Validate membership tier
            if update_data.membership_tier not in MEMBERSHIP_TIERS:
                raise HTTPException(status_code=400, detail="Invalid membership tier")
            update_fields["membership_tier"] = update_data.membership_tier
        if update_data.wallet_address is not None:
            # Check if new wallet address is already taken
            if update_data.wallet_address != member_id:
                existing_wallet = await db.users.find_one({"address": update_data.wallet_address.lower()})
                if existing_wallet:
                    raise HTTPException(status_code=400, detail="Wallet address already in use")
                update_fields["address"] = update_data.wallet_address.lower()
        if update_data.suspended is not None:
            update_fields["suspended"] = update_data.suspended
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        # Update the member
        result = await db.users.update_one(
            {"address": member_id},
            {"$set": update_fields}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        # If wallet address was changed, update related records
        if "address" in update_fields:
            new_address = update_fields["address"]
            
            # Update referrals pointing to this user
            await db.users.update_many(
                {"referrer_address": member_id},
                {"$set": {"referrer_address": new_address}}
            )
            
            # Update payments
            await db.payments.update_many(
                {"user_address": member_id},
                {"$set": {"user_address": new_address}}
            )
            
            # Update commissions
            await db.commissions.update_many(
                {"recipient_address": member_id},
                {"$set": {"recipient_address": new_address}}
            )
            
            await db.commissions.update_many(
                {"new_member_address": member_id},
                {"$set": {"new_member_address": new_address}}
            )
        
        return {"message": "Member updated successfully", "modified_count": result.modified_count}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update member: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update member")

@app.delete("/api/admin/members/{member_id}")
async def suspend_member(member_id: str, admin: dict = Depends(get_admin_user)):
    """Suspend a member (soft delete)"""
    try:
        # Check if member exists
        member = await db.users.find_one({"address": member_id})
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Suspend the member
        result = await db.users.update_one(
            {"address": member_id},
            {"$set": {"suspended": True, "suspended_at": datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Failed to suspend member")
        
        return {"message": "Member suspended successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to suspend member: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to suspend member")

@app.post("/api/admin/members/{member_id}/unsuspend")
async def unsuspend_member(member_id: str, admin: dict = Depends(get_admin_user)):
    """Unsuspend a member (restore access)"""
    try:
        # Check if member exists
        member = await db.users.find_one({"address": member_id})
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Check if member is actually suspended
        if not member.get("suspended", False):
            raise HTTPException(status_code=400, detail="Member is not suspended")
        
        # Unsuspend the member
        result = await db.users.update_one(
            {"address": member_id},
            {"$set": {"suspended": False}, "$unset": {"suspended_at": ""}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Failed to unsuspend member")
        
        return {"message": "Member unsuspended successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to unsuspend member: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to unsuspend member")
# Admin payments management endpoints
@app.get("/api/admin/payments")
async def get_all_payments(
    user_filter: Optional[str] = None,
    tier_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    admin: dict = Depends(get_admin_user)
):
    """Get all payments with optional filtering and pagination"""
    try:
        skip = (page - 1) * limit
        
        # Build filter query
        filter_query = {}
        
        if user_filter:
            # Search by username or email
            users = await db.users.find({
                "$or": [
                    {"username": {"$regex": user_filter, "$options": "i"}},
                    {"email": {"$regex": user_filter, "$options": "i"}}
                ]
            }).to_list(None)
            user_addresses = [user["address"] for user in users]
            if user_addresses:
                filter_query["user_address"] = {"$in": user_addresses}
            else:
                # No users found matching the filter
                return {
                    "payments": [],
                    "total_count": 0,
                    "page": page,
                    "limit": limit,
                    "total_pages": 0
                }
        
        if tier_filter:
            filter_query["tier"] = tier_filter
            
        if status_filter:
            filter_query["status"] = status_filter
            
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            filter_query["created_at"] = {"$gte": date_from_obj}
            
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            if "created_at" in filter_query:
                filter_query["created_at"]["$lte"] = date_to_obj
            else:
                filter_query["created_at"] = {"$lte": date_to_obj}
        
        # Get total count
        total_count = await db.payments.count_documents(filter_query)
        
        # Get payments with pagination
        payments_cursor = db.payments.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        payments = await payments_cursor.to_list(length=None)
        
        # Enrich payment data with user information
        enriched_payments = []
        for payment in payments:
            # Get user info
            user = await db.users.find_one({"address": payment["user_address"]})
            
            enriched_payment = {
                "id": payment["payment_id"],
                "user_address": payment["user_address"],
                "username": user["username"] if user else "Unknown",
                "email": user["email"] if user else "Unknown",
                "amount": payment["amount"],
                "currency": payment.get("currency", "ETH"),
                "tier": payment["tier"],
                "status": payment["status"],
                "payment_url": payment.get("payment_url"),
                "created_at": payment["created_at"],
                "updated_at": payment.get("updated_at"),
                "nowpayments_id": payment.get("nowpayments_payment_id"),
                "invoice_id": payment.get("invoice_id")
            }
            enriched_payments.append(enriched_payment)
        
        return {
            "payments": enriched_payments,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch payments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch payments")

@app.get("/api/admin/payments/export")
async def export_payments_csv(
    user_filter: Optional[str] = None,
    tier_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Export payments to CSV file"""
    try:
        # Use the same filter logic as get_all_payments but without pagination
        filter_query = {}
        
        if user_filter:
            users = await db.users.find({
                "$or": [
                    {"username": {"$regex": user_filter, "$options": "i"}},
                    {"email": {"$regex": user_filter, "$options": "i"}}
                ]
            }).to_list(None)
            user_addresses = [user["address"] for user in users]
            if user_addresses:
                filter_query["user_address"] = {"$in": user_addresses}
            else:
                filter_query["user_address"] = {"$in": []}  # No matches
        
        if tier_filter:
            filter_query["tier"] = tier_filter
            
        if status_filter:
            filter_query["status"] = status_filter
            
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            filter_query["created_at"] = {"$gte": date_from_obj}
            
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            if "created_at" in filter_query:
                filter_query["created_at"]["$lte"] = date_to_obj
            else:
                filter_query["created_at"] = {"$lte": date_to_obj}
        
        # Get all payments matching the filter
        payments_cursor = db.payments.find(filter_query).sort("created_at", -1)
        payments = await payments_cursor.to_list(length=None)
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Payment ID',
            'Username',
            'Email', 
            'Wallet Address',
            'Amount',
            'Currency',
            'Membership Tier',
            'Status',
            'Created Date',
            'Updated Date',
            'NOWPayments ID',
            'Invoice ID'
        ])
        
        # Write data rows
        for payment in payments:
            user = await db.users.find_one({"address": payment["user_address"]})
            
            writer.writerow([
                payment["payment_id"],
                user["username"] if user else "Unknown",
                user["email"] if user else "Unknown",
                payment["user_address"],
                payment["amount"],
                payment.get("currency", "ETH"),
                payment["tier"],
                payment["status"],
                payment["created_at"].strftime("%Y-%m-%d %H:%M:%S") if payment["created_at"] else "",
                payment.get("updated_at").strftime("%Y-%m-%d %H:%M:%S") if payment.get("updated_at") else "",
                payment.get("nowpayments_payment_id", ""),
                payment.get("invoice_id", "")
            ])
        
        # Prepare the CSV for download
        output.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"payments_export_{timestamp}.csv"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Failed to export payments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export payments")

# Admin commissions management endpoints
@app.get("/api/admin/commissions")
async def get_all_commissions(
    user_filter: Optional[str] = None,
    tier_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    admin: dict = Depends(get_admin_user)
):
    """Get all commissions with optional filtering and pagination"""
    try:
        skip = (page - 1) * limit
        
        # Build filter query
        filter_query = {}
        
        if user_filter:
            # Search by recipient username or email
            users = await db.users.find({
                "$or": [
                    {"username": {"$regex": user_filter, "$options": "i"}},
                    {"email": {"$regex": user_filter, "$options": "i"}}
                ]
            }).to_list(None)
            user_addresses = [user["address"] for user in users]
            if user_addresses:
                filter_query["recipient_address"] = {"$in": user_addresses}
            else:
                # No users found matching the filter
                return {
                    "commissions": [],
                    "total_count": 0,
                    "page": page,
                    "limit": limit,
                    "total_pages": 0
                }
        
        if tier_filter:
            filter_query["new_member_tier"] = tier_filter
            
        if status_filter:
            filter_query["status"] = status_filter
            
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            filter_query["created_at"] = {"$gte": date_from_obj}
            
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            if "created_at" in filter_query:
                filter_query["created_at"]["$lte"] = date_to_obj
            else:
                filter_query["created_at"] = {"$lte": date_to_obj}
        
        # Get total count
        total_count = await db.commissions.count_documents(filter_query)
        
        # Get commissions with pagination
        commissions_cursor = db.commissions.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        commissions = await commissions_cursor.to_list(length=None)
        
        # Enrich commission data with user information
        enriched_commissions = []
        for commission in commissions:
            # Get recipient user info
            recipient = await db.users.find_one({"address": commission["recipient_address"]})
            
            # Get new member info
            new_member = await db.users.find_one({"address": commission.get("new_member_address", "")})
            
            enriched_commission = {
                "id": commission["commission_id"],
                "recipient_address": commission["recipient_address"],
                "recipient_username": recipient["username"] if recipient else "Unknown",
                "recipient_email": recipient["email"] if recipient else "Unknown",
                "new_member_address": commission.get("new_member_address", ""),
                "new_member_username": new_member["username"] if new_member else "Unknown",
                "new_member_tier": commission.get("new_member_tier", ""),
                "amount": commission["amount"],
                "level": commission.get("level", 1),
                "status": commission["status"],
                "created_at": commission["created_at"],
                "updated_at": commission.get("updated_at"),
                "payout_tx_hash": commission.get("payout_tx_hash"),
                "payout_address": commission.get("payout_address")
            }
            enriched_commissions.append(enriched_commission)
        
        return {
            "commissions": enriched_commissions,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch commissions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch commissions")

@app.get("/api/admin/commissions/export")
async def export_commissions_csv(
    user_filter: Optional[str] = None,
    tier_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Export commissions to CSV file"""
    try:
        # Use the same filter logic as get_all_commissions but without pagination
        filter_query = {}
        
        if user_filter:
            users = await db.users.find({
                "$or": [
                    {"username": {"$regex": user_filter, "$options": "i"}},
                    {"email": {"$regex": user_filter, "$options": "i"}}
                ]
            }).to_list(None)
            user_addresses = [user["address"] for user in users]
            if user_addresses:
                filter_query["recipient_address"] = {"$in": user_addresses}
            else:
                filter_query["recipient_address"] = {"$in": []}  # No matches
        
        if tier_filter:
            filter_query["new_member_tier"] = tier_filter
            
        if status_filter:
            filter_query["status"] = status_filter
            
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            filter_query["created_at"] = {"$gte": date_from_obj}
            
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            if "created_at" in filter_query:
                filter_query["created_at"]["$lte"] = date_to_obj
            else:
                filter_query["created_at"] = {"$lte": date_to_obj}
        
        # Get all commissions matching the filter
        commissions_cursor = db.commissions.find(filter_query).sort("created_at", -1)
        commissions = await commissions_cursor.to_list(length=None)
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Commission ID',
            'Recipient Username',
            'Recipient Email',
            'Recipient Wallet Address',
            'New Member Username',
            'New Member Tier',
            'Commission Amount',
            'Level',
            'Status',
            'Created Date',
            'Updated Date',
            'Payout TX Hash',
            'Payout Address'
        ])
        
        # Write data rows
        for commission in commissions:
            recipient = await db.users.find_one({"address": commission["recipient_address"]})
            new_member = await db.users.find_one({"address": commission.get("new_member_address", "")})
            
            writer.writerow([
                commission["commission_id"],
                recipient["username"] if recipient else "Unknown",
                recipient["email"] if recipient else "Unknown",
                commission["recipient_address"],
                new_member["username"] if new_member else "Unknown",
                commission.get("new_member_tier", ""),
                commission["amount"],
                commission.get("level", 1),
                commission["status"],
                commission["created_at"].strftime("%Y-%m-%d %H:%M:%S") if commission["created_at"] else "",
                commission.get("updated_at").strftime("%Y-%m-%d %H:%M:%S") if commission.get("updated_at") else "",
                commission.get("payout_tx_hash", ""),
                commission.get("payout_address", "")
            ])
        
        # Prepare the CSV for download
        output.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"commissions_export_{timestamp}.csv"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Failed to export commissions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export commissions")

# Admin Milestone Management
@app.get("/api/admin/milestones")
async def get_admin_milestones(
    page: int = 1,
    limit: int = 10,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    username_filter: Optional[str] = None,
    award_filter: Optional[float] = None,
    status_filter: Optional[str] = None,
    admin_user: dict = Depends(get_admin_user)
):
    """Get paginated list of all milestones with filtering for admin"""
    try:
        # Build query
        query = {}
        
        # Date filtering
        if date_from or date_to:
            date_query = {}
            if date_from:
                date_query["$gte"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            if date_to:
                date_query["$lte"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query["achieved_date"] = date_query
        
        # Award amount filtering
        if award_filter is not None:
            query["bonus_amount"] = award_filter
            
        # Status filtering
        if status_filter:
            query["status"] = status_filter
        
        # Get total count
        total_count = await db.milestones.count_documents(query)
        
        # Calculate pagination
        skip = (page - 1) * limit
        total_pages = (total_count + limit - 1) // limit
        
        # Get milestones
        milestones_cursor = db.milestones.find(query).sort("achieved_date", -1).skip(skip).limit(limit)
        milestones_list = await milestones_cursor.to_list(length=None)
        
        # Enhance with user information
        enhanced_milestones = []
        for milestone in milestones_list:
            # Get user info
            user = await db.users.find_one({"address": milestone["user_address"]})
            
            # Filter by username if specified
            if username_filter and user:
                if username_filter.lower() not in user.get("username", "").lower():
                    total_count -= 1  # Adjust count for filtered item
                    continue
            elif username_filter and not user:
                total_count -= 1  # Adjust count for filtered item
                continue
            
            # Count current paid downlines
            paid_downlines = await db.users.count_documents({
                "referrer_address": milestone["user_address"],
                "membership_tier": {"$ne": "affiliate"},
                "suspended": {"$ne": True}
            })
            
            enhanced_milestone = {
                "milestone_id": milestone["milestone_id"],
                "user_address": milestone["user_address"],
                "username": user["username"] if user else "Unknown",
                "email": user["email"] if user else "Unknown",
                "wallet_address": milestone["user_address"],
                "achieved_date": milestone["achieved_date"],
                "milestone_count": milestone["milestone_count"],
                "bonus_amount": milestone["bonus_amount"],
                "status": milestone["status"],
                "total_referrals": paid_downlines,
                "created_at": milestone.get("created_at", milestone["achieved_date"])
            }
            enhanced_milestones.append(enhanced_milestone)
        
        # Recalculate pagination after filtering
        if username_filter:
            total_pages = (len(enhanced_milestones) + limit - 1) // limit if enhanced_milestones else 1
            total_count = len(enhanced_milestones)
        
        return {
            "milestones": enhanced_milestones,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch admin milestones: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch admin milestones")

@app.put("/api/admin/milestones/{milestone_id}/mark-paid")
async def mark_milestone_as_paid(
    milestone_id: str,
    admin_user: dict = Depends(get_admin_user)
):
    """Mark milestone as paid"""
    try:
        # Find the milestone
        milestone = await db.milestones.find_one({"milestone_id": milestone_id})
        if not milestone:
            raise HTTPException(status_code=404, detail="Milestone not found")
        
        # Update milestone status to paid
        await db.milestones.update_one(
            {"milestone_id": milestone_id},
            {
                "$set": {
                    "status": "paid",
                    "paid_at": datetime.utcnow(),
                    "paid_by_admin": admin_user["username"]
                }
            }
        )
        
        # Get user info for logging
        user = await db.users.find_one({"address": milestone["user_address"]})
        username = user["username"] if user else "Unknown"
        user_email = user.get("email", "") if user else ""
        
        # Send commission payout email to user if enabled
        if user:
            user_prefs = user.get("email_notifications", {})
            if user_prefs.get("commission_payouts", True) and user_email:
                try:
                    await send_commission_payout_email(
                        user_email,
                        username,
                        milestone["bonus_amount"],
                        milestone["milestone_count"]
                    )
                except Exception as e:
                    logger.error(f"Failed to send commission payout email: {str(e)}")
        
        logger.info(f"MILESTONE MARKED PAID: Milestone {milestone_id} for user {username} (${milestone['bonus_amount']}) marked as paid by admin {admin_user['username']}")
        
        return {"message": "Milestone marked as paid successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark milestone as paid: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to mark milestone as paid")

@app.get("/api/admin/milestones/export")
async def export_admin_milestones(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    username_filter: Optional[str] = None,
    award_filter: Optional[float] = None,
    status_filter: Optional[str] = None,
    admin_user: dict = Depends(get_admin_user)
):
    """Export milestones data as CSV"""
    try:
        # Build query (same as get_admin_milestones)
        query = {}
        
        # Date filtering
        if date_from or date_to:
            date_query = {}
            if date_from:
                date_query["$gte"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            if date_to:
                date_query["$lte"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query["achieved_date"] = date_query
        
        # Award amount filtering
        if award_filter is not None:
            query["bonus_amount"] = award_filter
            
        # Status filtering
        if status_filter:
            query["status"] = status_filter
        
        # Get all milestones (no pagination for export)
        milestones_cursor = db.milestones.find(query).sort("achieved_date", -1)
        milestones_list = await milestones_cursor.to_list(length=None)
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow([
            "Milestone ID",
            "Date",
            "Username", 
            "Email",
            "Wallet Address",
            "Total Referrals",
            "Milestone Award Amount",
            "Status"
        ])
        
        # Write milestone data
        for milestone in milestones_list:
            # Get user info
            user = await db.users.find_one({"address": milestone["user_address"]})
            
            # Apply username filter
            if username_filter and user:
                if username_filter.lower() not in user.get("username", "").lower():
                    continue
            elif username_filter and not user:
                continue
            
            # Count current paid downlines
            paid_downlines = await db.users.count_documents({
                "referrer_address": milestone["user_address"],
                "membership_tier": {"$ne": "affiliate"},
                "suspended": {"$ne": True}
            })
            
            writer.writerow([
                milestone["milestone_id"],
                milestone["achieved_date"].strftime("%Y-%m-%d %H:%M:%S") if milestone["achieved_date"] else "",
                user["username"] if user else "Unknown",
                user["email"] if user else "Unknown",
                milestone["user_address"],
                paid_downlines,
                milestone["bonus_amount"],
                milestone["status"]
            ])
        
        # Prepare the CSV for download
        output.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"milestones_export_{timestamp}.csv"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Failed to export milestones: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export milestones")
# User earnings and payment history endpoints
@app.get("/api/users/earnings")
async def get_user_earnings(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user's commission earnings history with filtering"""
    try:
        skip = (page - 1) * limit
        user_address = current_user["address"]
        
        # Build filter query
        filter_query = {"recipient_address": user_address}
        
        if status_filter:
            filter_query["status"] = status_filter
            
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            filter_query["created_at"] = {"$gte": date_from_obj}
            
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            if "created_at" in filter_query:
                filter_query["created_at"]["$lte"] = date_to_obj
            else:
                filter_query["created_at"] = {"$lte": date_to_obj}
        
        # Get total count
        total_count = await db.commissions.count_documents(filter_query)
        
        # Get earnings with pagination
        earnings_cursor = db.commissions.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        earnings = await earnings_cursor.to_list(length=None)
        
        # Enrich earnings data
        enriched_earnings = []
        for earning in earnings:
            # Get new member info
            new_member = await db.users.find_one({"address": earning.get("new_member_address", "")})
            
            enriched_earning = {
                "id": earning["commission_id"],
                "amount": earning["amount"],
                "level": earning.get("level", 1),
                "status": earning["status"],
                "new_member_username": new_member["username"] if new_member else "Unknown",
                "new_member_tier": earning.get("new_member_tier", ""),
                "created_at": earning["created_at"],
                "updated_at": earning.get("updated_at"),
                "payout_tx_hash": earning.get("payout_tx_hash"),
                "payout_address": earning.get("payout_address")
            }
            enriched_earnings.append(enriched_earning)
        
        return {
            "earnings": enriched_earnings,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch user earnings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user earnings")

@app.get("/api/users/earnings/export")
async def export_user_earnings_csv(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Export user's earnings to CSV file"""
    try:
        user_address = current_user["address"]
        
        # Build filter query
        filter_query = {"recipient_address": user_address}
        
        if status_filter:
            filter_query["status"] = status_filter
            
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            filter_query["created_at"] = {"$gte": date_from_obj}
            
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            if "created_at" in filter_query:
                filter_query["created_at"]["$lte"] = date_to_obj
            else:
                filter_query["created_at"] = {"$lte": date_to_obj}
        
        # Get all earnings matching the filter
        earnings_cursor = db.commissions.find(filter_query).sort("created_at", -1)
        earnings = await earnings_cursor.to_list(length=None)
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Commission ID',
            'Amount',
            'Level',
            'Status',
            'New Member Username',
            'New Member Tier',
            'Earned Date',
            'Updated Date',
            'Payout TX Hash',
            'Payout Address'
        ])
        
        # Write data rows
        for earning in earnings:
            new_member = await db.users.find_one({"address": earning.get("new_member_address", "")})
            
            writer.writerow([
                earning["commission_id"],
                earning["amount"],
                earning.get("level", 1),
                earning["status"],
                new_member["username"] if new_member else "Unknown",
                earning.get("new_member_tier", ""),
                earning["created_at"].strftime("%Y-%m-%d %H:%M:%S") if earning["created_at"] else "",
                earning.get("updated_at").strftime("%Y-%m-%d %H:%M:%S") if earning.get("updated_at") else "",
                earning.get("payout_tx_hash", ""),
                earning.get("payout_address", "")
            ])
        
        # Prepare the CSV for download
        output.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"earnings_export_{timestamp}.csv"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Failed to export user earnings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export user earnings")

@app.get("/api/users/payments")
async def get_user_payments(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status_filter: Optional[str] = None,
    tier_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user's payment history with filtering"""
    try:
        skip = (page - 1) * limit
        user_address = current_user["address"]
        
        # Build filter query
        filter_query = {"user_address": user_address}
        
        if status_filter:
            filter_query["status"] = status_filter
            
        if tier_filter:
            filter_query["tier"] = tier_filter
            
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            filter_query["created_at"] = {"$gte": date_from_obj}
            
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            if "created_at" in filter_query:
                filter_query["created_at"]["$lte"] = date_to_obj
            else:
                filter_query["created_at"] = {"$lte": date_to_obj}
        
        # Get total count
        total_count = await db.payments.count_documents(filter_query)
        
        # Get payments with pagination
        payments_cursor = db.payments.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        payments = await payments_cursor.to_list(length=None)
        
        # Format payment data
        formatted_payments = []
        for payment in payments:
            formatted_payment = {
                "id": payment["payment_id"],
                "amount": payment["amount"],
                "currency": payment.get("currency", "ETH"),
                "tier": payment["tier"],
                "status": payment["status"],
                "payment_url": payment.get("payment_url"),
                "created_at": payment["created_at"],
                "updated_at": payment.get("updated_at"),
                "nowpayments_id": payment.get("nowpayments_payment_id"),
                "invoice_id": payment.get("invoice_id")
            }
            formatted_payments.append(formatted_payment)
        
        return {
            "payments": formatted_payments,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch user payments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user payments")

@app.get("/api/users/payments/export")
async def export_user_payments_csv(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status_filter: Optional[str] = None,
    tier_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Export user's payments to CSV file"""
    try:
        user_address = current_user["address"]
        
        # Build filter query
        filter_query = {"user_address": user_address}
        
        if status_filter:
            filter_query["status"] = status_filter
            
        if tier_filter:
            filter_query["tier"] = tier_filter
            
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            filter_query["created_at"] = {"$gte": date_from_obj}
            
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            if "created_at" in filter_query:
                filter_query["created_at"]["$lte"] = date_to_obj
            else:
                filter_query["created_at"] = {"$lte": date_to_obj}
        
        # Get all payments matching the filter
        payments_cursor = db.payments.find(filter_query).sort("created_at", -1)
        payments = await payments_cursor.to_list(length=None)
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Payment ID',
            'Amount',
            'Currency',
            'Membership Tier',
            'Status',
            'Payment Date',
            'Updated Date',
            'NOWPayments ID',
            'Invoice ID'
        ])
        
        # Write data rows
        for payment in payments:
            writer.writerow([
                payment["payment_id"],
                payment["amount"],
                payment.get("currency", "ETH"),
                payment["tier"],
                payment["status"],
                payment["created_at"].strftime("%Y-%m-%d %H:%M:%S") if payment["created_at"] else "",
                payment.get("updated_at").strftime("%Y-%m-%d %H:%M:%S") if payment.get("updated_at") else "",
                payment.get("nowpayments_payment_id", ""),
                payment.get("invoice_id", "")
            ])
        
        # Prepare the CSV for download
        output.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"payments_export_{timestamp}.csv"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Failed to export user payments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export user payments")

# Admin database cleanup endpoint
@app.delete("/api/admin/cleanup/wallet/{wallet_address}")
async def cleanup_wallet_records(wallet_address: str, admin: dict = Depends(get_admin_user)):
    """Clean up all database records for a specific wallet address"""
    try:
        wallet_address = wallet_address.lower()
        logger.info(f"Admin cleanup requested for wallet: {wallet_address}")
        
        cleanup_results = {
            "wallet_address": wallet_address,
            "deleted_records": {
                "users": 0,
                "payments": 0,
                "commissions": 0,
                "member_leads": 0,
                "referral_updates": 0
            },
            "success": True,
            "message": "Cleanup completed successfully"
        }
        
        # 1. Delete from users collection
        users_result = await db.users.delete_many({"address": wallet_address})
        cleanup_results["deleted_records"]["users"] = users_result.deleted_count
        logger.info(f"Deleted {users_result.deleted_count} user records")
        
        # 2. Delete from payments collection
        payments_result = await db.payments.delete_many({"user_address": wallet_address})
        cleanup_results["deleted_records"]["payments"] = payments_result.deleted_count
        logger.info(f"Deleted {payments_result.deleted_count} payment records")
        
        # 3. Delete from commissions collection (as recipient)
        commissions_recipient_result = await db.commissions.delete_many({"recipient_address": wallet_address})
        
        # 4. Delete from commissions collection (as new member)
        commissions_member_result = await db.commissions.delete_many({"new_member_address": wallet_address})
        
        total_commissions = commissions_recipient_result.deleted_count + commissions_member_result.deleted_count
        cleanup_results["deleted_records"]["commissions"] = total_commissions
        logger.info(f"Deleted {total_commissions} commission records")
        
        # 5. Delete from member_leads collection
        member_leads_result = await db.member_leads.delete_many({"member_address": wallet_address})
        cleanup_results["deleted_records"]["member_leads"] = member_leads_result.deleted_count
        logger.info(f"Deleted {member_leads_result.deleted_count} member leads records")
        
        # 6. Update referral relationships (remove referrer_address references)
        referral_update_result = await db.users.update_many(
            {"referrer_address": wallet_address},
            {"$unset": {"referrer_address": 1}}
        )
        cleanup_results["deleted_records"]["referral_updates"] = referral_update_result.modified_count
        logger.info(f"Updated {referral_update_result.modified_count} referral relationships")
        
        total_deleted = sum(cleanup_results["deleted_records"].values())
        
        if total_deleted == 0:
            cleanup_results["message"] = "No records found for cleanup"
        else:
            cleanup_results["message"] = f"Successfully cleaned up {total_deleted} records"
        
        logger.info(f"Cleanup completed for {wallet_address}: {cleanup_results}")
        
        return cleanup_results
        
    except Exception as e:
        logger.error(f"Failed to cleanup wallet records: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cleanup wallet records: {str(e)}")

# Milestones system
MILESTONE_BONUSES = {
    25: 25.0,
    100: 100.0,
    250: 250.0,
    1000: 1000.0,
    5000: 2500.0,
    10000: 5000.0
}

@app.get("/api/users/milestones")
async def get_user_milestones(current_user: dict = Depends(get_current_user)):
    """Get user's milestone progress and achieved milestones"""
    try:
        user_address = current_user["address"]
        
        # Count paid downlines (members with active/non-expired memberships who were referred by this user)
        paid_downlines = await db.users.count_documents({
            "referrer_address": user_address,
            "membership_tier": {"$ne": "affiliate"},  # Not free tier
            "suspended": {"$ne": True}  # Not suspended/cancelled
        })
        
        # Get achieved milestones
        achieved_milestones = []
        pending_milestones = []
        
        for milestone_count, bonus_amount in MILESTONE_BONUSES.items():
            if paid_downlines >= milestone_count:
                # Check if milestone bonus was already paid
                existing_milestone = await db.milestones.find_one({
                    "user_address": user_address,
                    "milestone_count": milestone_count
                })
                
                if existing_milestone:
                    achieved_milestones.append({
                        "milestone_count": milestone_count,
                        "bonus_amount": bonus_amount,
                        "achieved_date": existing_milestone["achieved_date"],
                        "status": existing_milestone["status"]
                    })
                else:
                    # Milestone achieved but not yet recorded - create it
                    milestone_doc = {
                        "milestone_id": str(uuid.uuid4()),
                        "user_address": user_address,
                        "milestone_count": milestone_count,
                        "bonus_amount": bonus_amount,
                        "achieved_date": datetime.utcnow(),
                        "status": "pending",
                        "created_at": datetime.utcnow()
                    }
                    
                    await db.milestones.insert_one(milestone_doc)
                    
                    achieved_milestones.append({
                        "milestone_count": milestone_count,
                        "bonus_amount": bonus_amount,
                        "achieved_date": milestone_doc["achieved_date"],
                        "status": "pending"
                    })
                    
                    # Send notification to admin (in-app)
                    await create_admin_notification(
                        notification_type="milestone",
                        title="User Milestone Achieved",
                        message=f"{current_user['username']} reached {milestone_count} referrals milestone - ${bonus_amount} bonus earned!",
                        related_user=user_address
                    )
                    
                    # Send admin email notification
                    try:
                        await send_admin_milestone_notification(
                            current_user['username'],
                            milestone_count,
                            bonus_amount
                        )
                    except Exception as e:
                        logger.error(f"Failed to send admin milestone email: {str(e)}")
                    
                    logger.info(f"MILESTONE ACHIEVED: User {current_user['username']} ({user_address}) reached {milestone_count} paid downlines. Bonus: ${bonus_amount}")
            else:
                # Calculate progress to next milestone
                progress = paid_downlines
                pending_milestones.append({
                    "milestone_count": milestone_count,
                    "bonus_amount": bonus_amount,
                    "progress": progress,
                    "remaining": milestone_count - progress
                })
        
        # Get next milestone
        next_milestone = None
        for milestone_count in sorted(MILESTONE_BONUSES.keys()):
            if paid_downlines < milestone_count:
                next_milestone = {
                    "milestone_count": milestone_count,
                    "bonus_amount": MILESTONE_BONUSES[milestone_count],
                    "progress": paid_downlines,
                    "remaining": milestone_count - paid_downlines
                }
                break
        
        return {
            "paid_downlines": paid_downlines,
            "achieved_milestones": achieved_milestones,
            "next_milestone": next_milestone,
            "all_milestones": [
                {
                    "milestone_count": count,
                    "bonus_amount": amount,
                    "achieved": paid_downlines >= count
                }
                for count, amount in MILESTONE_BONUSES.items()
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch user milestones: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user milestones")

# Account cancellation
@app.post("/api/users/cancel-account")
async def cancel_user_account(current_user: dict = Depends(get_current_user)):
    """Cancel user account and transfer downline to sponsor"""
    try:
        user_address = current_user["address"]
        
        # Check if user has a sponsor (referrer)
        sponsor_address = current_user.get("referrer_address")
        if not sponsor_address:
            raise HTTPException(status_code=400, detail="Cannot cancel account - no sponsor found")
        
        # Get all users referred by the cancelling user
        downline_users = await db.users.find({"referrer_address": user_address}).to_list(None)
        
        # Transfer downline to sponsor
        for downline_user in downline_users:
            await db.users.update_one(
                {"address": downline_user["address"]},
                {"$set": {"referrer_address": sponsor_address}}
            )
        
        # Update commissions - transfer pending commissions to sponsor
        await db.commissions.update_many(
            {"recipient_address": user_address, "status": {"$in": ["pending", "processing"]}},
            {"$set": {"recipient_address": sponsor_address, "transferred_from": user_address}}
        )
        
        # Mark user as cancelled/suspended
        cancellation_doc = {
            "cancelled_at": datetime.utcnow(),
            "suspended": True,
            "account_status": "cancelled",
            "downline_transferred_to": sponsor_address,
            "downline_count_transferred": len(downline_users)
        }
        
        await db.users.update_one(
            {"address": user_address},
            {"$set": cancellation_doc}
        )
        
        # Log the cancellation
        logger.info(f"ACCOUNT CANCELLED: User {current_user['username']} ({user_address}) cancelled account. {len(downline_users)} downline members transferred to sponsor {sponsor_address}")
        
        return {
            "message": "Account cancelled successfully",
            "downline_transferred": len(downline_users),
            "sponsor_address": sponsor_address,
            "cancelled_at": cancellation_doc["cancelled_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel user account: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel account")

# Network genealogy tree
@app.get("/api/users/network-tree")
async def get_network_tree(
    depth: int = 3,
    current_user: dict = Depends(get_current_user)
):
    """Get user's referral network tree"""
    try:
        user_address = current_user["address"]
        
        async def build_tree(parent_address: str, current_depth: int, max_depth: int):
            if current_depth >= max_depth:
                return []
            
            # Get direct referrals
            referrals = await db.users.find({"referrer_address": parent_address}).to_list(None)
            
            tree_nodes = []
            for referral in referrals:
                # Get referral stats
                referral_count = await db.users.count_documents({"referrer_address": referral["address"]})
                
                # Get earnings
                earnings_pipeline = [
                    {"$match": {"recipient_address": referral["address"], "status": "completed"}},
                    {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
                ]
                earnings_result = await db.commissions.aggregate(earnings_pipeline).to_list(1)
                total_earnings = earnings_result[0]["total"] if earnings_result else 0.0
                
                node = {
                    "address": referral["address"],
                    "username": referral["username"],
                    "email": referral["email"],
                    "membership_tier": referral["membership_tier"],
                    "total_referrals": referral_count,
                    "total_earnings": total_earnings,
                    "joined_date": referral["created_at"],
                    "suspended": referral.get("suspended", False),
                    "level": current_depth + 1,
                    "children": await build_tree(referral["address"], current_depth + 1, max_depth)
                }
                tree_nodes.append(node)
            
            return tree_nodes
        
        # Build the tree starting from current user
        network_tree = {
            "root": {
                "address": user_address,
                "username": current_user["username"],
                "email": current_user["email"],
                "membership_tier": current_user["membership_tier"],
                "level": 0
            },
            "children": await build_tree(user_address, 0, depth)
        }
        
        # Calculate network stats
        total_network_size = 0
        
        def count_network_size(nodes):
            count = len(nodes)
            for node in nodes:
                count += count_network_size(node["children"])
            return count
        
        total_network_size = count_network_size(network_tree["children"])
        
        return {
            "network_tree": network_tree,
            "network_stats": {
                "total_network_size": total_network_size,
                "direct_referrals": len(network_tree["children"]),
                "max_depth_shown": depth
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch network tree: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch network tree")

# WebSocket endpoint
@app.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for keep-alive
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Get membership tiers
@app.get("/api/membership/tiers")
async def get_membership_tiers():
    return {"tiers": MEMBERSHIP_TIERS}

# Get recent payments for user
@app.get("/api/payments/recent")
async def get_recent_payments(current_user: dict = Depends(get_current_user)):
    """Get recent payments for the current user"""
    try:
        payments = await db.payments.find(
            {"user_address": current_user["address"]}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        return {"payments": payments}
    except Exception as e:
        logger.error(f"Failed to fetch recent payments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch payments")

# Public endpoint to get referrer info (for public referral links)
@app.get("/api/referral/{referral_code}")
async def get_referral_info(referral_code: str):
    """Get referrer information for public referral links"""
    referrer = await db.users.find_one({"referral_code": referral_code})
    if not referrer:
        raise HTTPException(status_code=404, detail="Referral code not found")
    
    return {
        "referrer_username": referrer["username"],
        "referrer_tier": referrer["membership_tier"],
        "referral_code": referral_code
    }

# Leads Distribution System
@app.post("/api/admin/leads/upload")
async def upload_leads_csv(request: Request, admin: dict = Depends(get_admin_user)):
    """Upload CSV file for lead distribution"""
    try:
        form = await request.form()
        csv_file = form.get("csv_file")
        
        if not csv_file:
            raise HTTPException(status_code=400, detail="CSV file is required")
        
        # Read CSV content
        contents = await csv_file.read()
        csv_content = contents.decode('utf-8')
        
        # Parse CSV to validate structure and count rows
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        leads_data = []
        # Required headers (case-insensitive)
        required_headers = ['name', 'email', 'address']
        
        # Create a case mapping for headers
        header_mapping = {}
        for header in csv_reader.fieldnames:
            for required in required_headers:
                if header.lower() == required.lower():
                    header_mapping[required] = header
                    break
        
        # Validate headers
        missing_headers = [header for header in required_headers if header not in header_mapping]
        if missing_headers:
            raise HTTPException(
                status_code=400, 
                detail=f"CSV must contain headers: {', '.join(required_headers)}. Found headers: {', '.join(csv_reader.fieldnames)}"
            )
        
        # Process and validate CSV rows
        for row_num, row in enumerate(csv_reader, start=2):
            # Check if all required data is present using the mapped headers
            missing_data = []
            for required_header in required_headers:
                actual_header = header_mapping[required_header]
                value = row.get(actual_header, '').strip()
                if not value:
                    missing_data.append(actual_header)
            
            if missing_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required data in row {row_num}: {', '.join(missing_data)}"
                )
            
            lead_data = {
                "lead_id": str(uuid.uuid4()),
                "name": row.get(header_mapping['name'], '').strip(),
                "email": row.get(header_mapping['email'], '').strip(),
                "address": row.get(header_mapping['address'], '').strip(),
                "distribution_count": 0,
                "created_at": datetime.utcnow()
            }
            leads_data.append(lead_data)
        
        if len(leads_data) == 0:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Create lead distribution record
        distribution_id = str(uuid.uuid4())
        distribution_doc = {
            "distribution_id": distribution_id,
            "filename": csv_file.filename,
            "total_leads": len(leads_data),
            "status": "queued",
            "uploaded_by": admin["username"],
            "uploaded_at": datetime.utcnow(),
            "processing_started_at": None,
            "processing_completed_at": None
        }
        
        # Store distribution record
        await db.lead_distributions.insert_one(distribution_doc)
        
        # Store individual leads
        for lead in leads_data:
            lead["distribution_id"] = distribution_id
        await db.leads.insert_many(leads_data)
        
        # Calculate eligible members for distribution
        eligible_members = await db.users.count_documents({
            "membership_tier": {"$in": ["bronze", "silver", "gold"]},
            "suspended": {"$ne": True}
        })
        
        # Estimate distribution timeline (assuming weekly distribution)
        max_leads_per_member = 10  # Each lead can go to max 10 members
        total_distributions_possible = len(leads_data) * max_leads_per_member
        leads_per_week = eligible_members * 5  # Assume 5 leads per member per week
        estimated_weeks = max(1, total_distributions_possible // leads_per_week) if leads_per_week > 0 else 0
        
        # Update distribution with estimates
        await db.lead_distributions.update_one(
            {"distribution_id": distribution_id},
            {"$set": {
                "eligible_members": eligible_members,
                "estimated_weeks": estimated_weeks
            }}
        )
        
        return {
            "distribution_id": distribution_id,
            "total_leads": len(leads_data),
            "eligible_members": eligible_members,
            "estimated_weeks": estimated_weeks,
            "status": "queued"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload leads CSV: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process CSV file")

@app.get("/api/admin/leads/distributions")
async def get_lead_distributions(
    page: int = 1,
    limit: int = 20,
    admin: dict = Depends(get_admin_user)
):
    """Get all lead distributions with status"""
    try:
        skip = (page - 1) * limit
        
        # Get total count
        total_count = await db.lead_distributions.count_documents({})
        
        # Get distributions with pagination
        distributions_cursor = db.lead_distributions.find({}).skip(skip).limit(limit).sort("uploaded_at", -1)
        distributions = await distributions_cursor.to_list(length=None)
        
        # Enrich with current status data
        enriched_distributions = []
        for dist in distributions:
            # Get current distribution progress
            distributed_count = await db.member_leads.count_documents({
                "distribution_id": dist["distribution_id"]
            })
            
            # Get leads remaining
            total_leads = dist.get("total_leads", 0)
            remaining_leads = max(0, total_leads - distributed_count)  # Ensure it's not negative
            
            enriched_dist = {
                "distribution_id": dist["distribution_id"],
                "filename": dist["filename"],
                "total_leads": total_leads,
                "distributed_count": distributed_count,
                "remaining_leads": remaining_leads,
                "status": dist["status"],
                "eligible_members": dist.get("eligible_members", 0),
                "estimated_weeks": dist.get("estimated_weeks", 0),
                "uploaded_by": dist["uploaded_by"],
                "uploaded_at": dist["uploaded_at"],
                "processing_started_at": dist.get("processing_started_at"),
                "processing_completed_at": dist.get("processing_completed_at")
            }
            enriched_distributions.append(enriched_dist)
        
        return {
            "distributions": enriched_distributions,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch lead distributions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch distributions")

@app.post("/api/admin/leads/distribute/{distribution_id}")
async def manually_distribute_leads(
    distribution_id: str,
    admin: dict = Depends(get_admin_user)
):
    """Manually trigger lead distribution for a specific distribution"""
    try:
        # Find the distribution
        distribution = await db.lead_distributions.find_one({"distribution_id": distribution_id})
        if not distribution:
            raise HTTPException(status_code=404, detail="Distribution not found")
        
        if distribution["status"] == "processing":
            raise HTTPException(status_code=400, detail="Distribution is already processing")
        
        # Mark as processing
        await db.lead_distributions.update_one(
            {"distribution_id": distribution_id},
            {"$set": {
                "status": "processing",
                "processing_started_at": datetime.utcnow()
            }}
        )
        
        # Perform distribution
        await perform_lead_distribution(distribution_id)
        
        return {"message": "Lead distribution completed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to distribute leads: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to distribute leads")

async def perform_lead_distribution(distribution_id: str):
    """Perform the actual lead distribution logic"""
    try:
        # Get eligible members (bronze, silver, gold - not suspended)
        # Note: Using separate queries due to MongoDB $or/$in issues
        bronze_members = await db.users.find({
            "membership_tier": "bronze",
            "suspended": False
        }).to_list(None)
        
        silver_members = await db.users.find({
            "membership_tier": "silver", 
            "suspended": False
        }).to_list(None)
        
        gold_members = await db.users.find({
            "membership_tier": "gold",
            "suspended": False
        }).to_list(None)
        
        eligible_members = bronze_members + silver_members + gold_members
        
        if not eligible_members:
            logger.warning("No eligible members for lead distribution")
            return
        
        # Get leads that haven't reached max distribution count
        available_leads = await db.leads.find({
            "distribution_id": distribution_id,
            "distribution_count": {"$lt": 10}
        }).to_list(None)
        
        if not available_leads:
            logger.info("No available leads for distribution")
            return
        
        # Distribution logic: Each lead can be distributed to up to 10 different users
        # No user should receive the same lead more than once
        leads_per_member = {
            "bronze": 100,
            "silver": 250,
            "gold": 500
        }
        
        MAX_DISTRIBUTIONS_PER_LEAD = 10
        
        total_available_leads = len(available_leads)
        total_capacity = total_available_leads * MAX_DISTRIBUTIONS_PER_LEAD
        total_demand = sum(leads_per_member.get(member.get("membership_tier", "bronze"), 100) 
                          for member in eligible_members)
        
        logger.info(f"Distribution planning:")
        logger.info(f"  - Available leads: {total_available_leads}")
        logger.info(f"  - Max distributions per lead: {MAX_DISTRIBUTIONS_PER_LEAD}")
        logger.info(f"  - Total capacity: {total_capacity}")
        logger.info(f"  - Total demand: {total_demand} from {len(eligible_members)} members")
        logger.info(f"  - Can fulfill all requests: {total_capacity >= total_demand}")
        
        distributions_made = 0
        
        # Track which leads have been assigned to which members to prevent duplicates
        lead_assignments = {}  # lead_id -> set of member addresses who received it
        for lead in available_leads:
            lead_assignments[lead["lead_id"]] = set()
        
        # Process each member and give them their full allocation
        for member in eligible_members:
            member_tier = member.get("membership_tier", "bronze")
            desired_leads = leads_per_member.get(member_tier, 100)
            member_address = member["address"]
            
            logger.info(f"Processing {member['username']} ({member_tier} tier): needs {desired_leads} leads")
            
            # Check if member already has a CSV file for this distribution
            existing_csv = await db.member_csv_files.find_one({
                "member_address": member_address,
                "distribution_id": distribution_id
            })
            
            if existing_csv:
                logger.info(f"Member {member['username']} already has CSV file for distribution {distribution_id}")
                continue
            
            # Find leads for this member (avoiding duplicates)
            member_leads = []
            for lead in available_leads:
                if len(member_leads) >= desired_leads:
                    break
                    
                lead_id = lead["lead_id"]
                
                # Check if this lead has been assigned to this member already
                if member_address not in lead_assignments[lead_id]:
                    # Check if this lead hasn't exceeded max distributions
                    if len(lead_assignments[lead_id]) < MAX_DISTRIBUTIONS_PER_LEAD:
                        member_leads.append(lead)
                        lead_assignments[lead_id].add(member_address)
            
            if len(member_leads) < desired_leads:
                logger.warning(f"Could only allocate {len(member_leads)} leads to {member['username']} (wanted {desired_leads})")
            else:
                logger.info(f"Successfully allocated {len(member_leads)} leads to {member['username']}")
            
            if not member_leads:
                logger.info(f"No leads available for member {member['username']}")
                continue
            
            # Generate CSV content
            csv_content = "Name,Email,Address\n"
            for lead in member_leads:
                csv_content += f'"{lead["name"]}","{lead["email"]}","{lead["address"]}"\n'
            
            # Create CSV file record
            csv_file_doc = {
                "file_id": str(uuid.uuid4()),
                "member_address": member_address,
                "member_username": member["username"],
                "member_tier": member_tier,
                "distribution_id": distribution_id,
                "filename": f"leads_{member['username']}_{distribution_id[:8]}.csv",
                "csv_content": csv_content,
                "lead_count": len(member_leads),
                "created_at": datetime.utcnow(),
                "downloaded": False,
                "downloaded_at": None,
                "download_count": 0
            }
            
            await db.member_csv_files.insert_one(csv_file_doc)
            
            # Send lead distribution email to member if enabled
            member_prefs = member.get("email_notifications", {})
            if member_prefs.get("lead_distribution", True):
                try:
                    await send_lead_distribution_email(
                        member["email"],
                        member["username"],
                        len(member_leads),
                        csv_file_doc["filename"]
                    )
                except Exception as e:
                    logger.error(f"Failed to send lead distribution email to {member['username']}: {str(e)}")
            
            # Create individual member_leads records for tracking (keep existing structure for now)
            for lead in member_leads:
                member_lead_doc = {
                    "assignment_id": str(uuid.uuid4()),
                    "member_address": member["address"],
                    "member_username": member["username"],
                    "member_tier": member_tier,
                    "lead_id": lead["lead_id"],
                    "distribution_id": distribution_id,
                    "lead_name": lead["name"],
                    "lead_email": lead["email"],
                    "lead_address": lead["address"],
                    "assigned_at": datetime.utcnow(),
                    "downloaded": False,
                    "downloaded_at": None,
                    "csv_file_id": csv_file_doc["file_id"]  # Link to CSV file
                }
                
                await db.member_leads.insert_one(member_lead_doc)
                
                # Increment distribution count for the lead
                await db.leads.update_one(
                    {"lead_id": lead["lead_id"]},
                    {"$inc": {"distribution_count": 1}}
                )
            
            distributions_made += len(member_leads)
        
        # Mark distribution as completed
        await db.lead_distributions.update_one(
            {"distribution_id": distribution_id},
            {"$set": {
                "status": "completed",
                "processing_completed_at": datetime.utcnow(),
                "distributions_made": distributions_made
            }}
        )
        
        # Send admin email notification
        try:
            await send_admin_lead_distribution_status(
                distribution_id,
                "completed",
                total_available_leads,
                len(eligible_members)
            )
        except Exception as e:
            logger.error(f"Failed to send admin lead distribution email: {str(e)}")
        
        logger.info(f"Lead distribution completed: {distributions_made} assignments made")
        
    except Exception as e:
        logger.error(f"Error in lead distribution: {str(e)}")
        # Mark distribution as failed
        await db.lead_distributions.update_one(
            {"distribution_id": distribution_id},
            {"$set": {
                "status": "failed",
                "error_message": str(e)
            }}
        )
        raise

# Admin Configuration Management Endpoints
@app.get("/api/admin/config/system")
async def get_system_config(admin: dict = Depends(get_admin_user)):
    """Get current system configuration"""
    try:
        config_doc = await db.system_config.find_one({"config_type": "main"})
        if not config_doc:
            # Return default configuration
            await save_system_config()  # Initialize if not exists
            config_doc = await db.system_config.find_one({"config_type": "main"})
        
        # Remove MongoDB ObjectId field to avoid JSON serialization issues
        if config_doc and "_id" in config_doc:
            del config_doc["_id"]
        
        # Clean up the response to remove sensitive data
        if config_doc and "payment_processors" in config_doc:
            for processor_name, processor_config in config_doc["payment_processors"].items():
                if "api_key" in processor_config:
                    processor_config["api_key"] = "***HIDDEN***" if processor_config["api_key"] else None
                if "ipn_secret" in processor_config:
                    processor_config["ipn_secret"] = "***HIDDEN***" if processor_config["ipn_secret"] else None
        
        return {
            "config": config_doc,
            "current_membership_tiers": MEMBERSHIP_TIERS
        }
        
    except Exception as e:
        logger.error(f"Failed to get system config: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve system configuration")
@app.put("/api/admin/config/membership-tiers")
async def update_membership_tiers(
    tiers_data: Dict[str, MembershipTierConfig],
    admin: dict = Depends(get_admin_user)
):
    """Update membership tiers configuration"""
    try:
        global MEMBERSHIP_TIERS
        
        # Validate tier data
        for tier_name, tier_config in tiers_data.items():
            if tier_config.price < 0:
                raise HTTPException(status_code=400, detail=f"Invalid price for {tier_name}")
            if not tier_config.commissions or len(tier_config.commissions) > 4:
                raise HTTPException(status_code=400, detail=f"Invalid commission structure for {tier_name}")
            for commission in tier_config.commissions:
                if commission < 0 or commission > 1:
                    raise HTTPException(status_code=400, detail=f"Commission rates must be between 0 and 1")
        
        # Convert to dictionary format for database storage
        tiers_dict = {}
        for tier_name, tier_config in tiers_data.items():
            tiers_dict[tier_name] = {
                "tier_name": tier_config.tier_name,
                "price": tier_config.price,
                "commissions": tier_config.commissions,
                "enabled": tier_config.enabled,
                "description": tier_config.description or f"{tier_name.capitalize()} membership tier"
            }
        
        # Save to database
        success = await save_system_config(membership_tiers=tiers_dict, updated_by=admin["username"])
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save membership tiers configuration")
        
        # Reload configuration
        await load_system_config()
        
        return {
            "message": "Membership tiers updated successfully",
            "updated_tiers": MEMBERSHIP_TIERS
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update membership tiers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update membership tiers")

@app.put("/api/admin/config/payment-processors")
async def update_payment_processors(
    processors_data: Dict[str, PaymentProcessorConfig],
    admin: dict = Depends(get_admin_user)
):
    """Update payment processors configuration"""
    try:
        # Convert to dictionary format for database storage
        processors_dict = {}
        for processor_name, processor_config in processors_data.items():
            processors_dict[processor_name] = {
                "processor_name": processor_config.processor_name,
                "api_key": processor_config.api_key,
                "public_key": processor_config.public_key,
                "ipn_secret": processor_config.ipn_secret,
                "enabled": processor_config.enabled,
                "supported_currencies": processor_config.supported_currencies
            }
        
        # Save to database (keep existing membership tiers)
        success = await save_system_config(payment_processors=processors_dict, updated_by=admin["username"])
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save payment processors configuration")
        
        return {
            "message": "Payment processors updated successfully",
            "processors": processors_dict
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update payment processors: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update payment processors")

@app.post("/api/admin/config/reset-to-defaults")
async def reset_config_to_defaults(admin: dict = Depends(get_admin_user)):
    """Reset system configuration to default values"""
    try:
        global MEMBERSHIP_TIERS
        
        # Reset to default configuration
        MEMBERSHIP_TIERS = DEFAULT_MEMBERSHIP_TIERS.copy()
        success = await save_system_config(updated_by=admin["username"])
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to reset configuration")
        
        return {
            "message": "Configuration reset to defaults successfully",
            "default_tiers": MEMBERSHIP_TIERS
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reset configuration: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset configuration")

@app.get("/api/users/referrals")
async def get_user_referrals(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get user's referrals with pagination"""
    try:
        user_address = current_user["address"]
        offset = (page - 1) * limit
        
        # Get total count for pagination
        total_referrals = await db.users.count_documents({
            "referrer_address": user_address
        })
        
        # Calculate total stats across ALL referrals (not just current page)
        all_referrals = await db.users.find({
            "referrer_address": user_address
        }).to_list(None)
        
        # Calculate overall stats
        total_active = sum(1 for r in all_referrals if not r.get("suspended", False))
        tier_counts = {}
        total_sub_referrals = 0
        
        for referral in all_referrals:
            # Count by tier
            tier = referral.get("membership_tier", "affiliate")
            tier_counts[tier] = tier_counts.get(tier, 0) + 1
            
            # Count sub-referrals
            sub_count = await db.users.count_documents({
                "referrer_address": referral["address"]
            })
            total_sub_referrals += sub_count
        
        # Get paginated referrals for display
        referrals = await db.users.find({
            "referrer_address": user_address
        }).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
        
        # Format referral data with additional information
        formatted_referrals = []
        for referral in referrals:
            # Get referral's referral count
            referral_count = await db.users.count_documents({
                "referrer_address": referral["address"]
            })
            
            # Get referral's earnings
            total_earnings = 0
            commissions = await db.commissions.find({
                "recipient_address": referral["address"]
            }).to_list(None)
            
            for commission in commissions:
                if commission.get("status") == "paid":
                    total_earnings += commission.get("amount", 0)
            
            formatted_referrals.append({
                "user_id": referral.get("user_id"),
                "username": referral.get("username"),
                "email": referral.get("email"),
                "address": referral.get("address"),
                "membership_tier": referral.get("membership_tier", "affiliate"),
                "status": "suspended" if referral.get("suspended", False) else "active",
                "referral_count": referral_count,
                "total_earnings": total_earnings,
                "joined_date": referral.get("created_at").isoformat() if referral.get("created_at") else None,
                "last_active": referral.get("last_active").isoformat() if referral.get("last_active") else None
            })
        
        return {
            "referrals": formatted_referrals,
            "total_count": total_referrals,
            "page": page,
            "limit": limit,
            "total_pages": (total_referrals + limit - 1) // limit,
            "stats": {
                "total_referrals": total_referrals,
                "active_referrals": total_active,
                "tier_counts": tier_counts,
                "total_sub_referrals": total_sub_referrals
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get user referrals: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve referrals")

# User endpoints for leads
@app.get("/api/users/leads")
async def get_user_leads(
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user's lead CSV files"""
    try:
        user_address = current_user["address"]
        offset = (page - 1) * limit
        
        # Get CSV files for this user
        csv_files = await db.member_csv_files.find({
            "member_address": user_address
        }).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
        
        total_files = await db.member_csv_files.count_documents({
            "member_address": user_address
        })
        
        # Format CSV file data
        formatted_files = []
        for csv_file in csv_files:
            formatted_files.append({
                "file_id": csv_file["file_id"],
                "filename": csv_file["filename"],
                "lead_count": csv_file["lead_count"],
                "member_tier": csv_file["member_tier"],
                "distribution_id": csv_file["distribution_id"],
                "created_at": csv_file["created_at"].isoformat() if csv_file.get("created_at") else None,
                "downloaded": csv_file.get("downloaded", False),
                "downloaded_at": csv_file["downloaded_at"].isoformat() if csv_file.get("downloaded_at") else None,
                "download_count": csv_file.get("download_count", 0)
            })
        
        return {
            "csv_files": formatted_files,
            "total_count": total_files,
            "page": page,
            "limit": limit,
            "total_pages": (total_files + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Failed to get user leads: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve leads")

@app.get("/api/users/leads/download/{file_id}")
async def download_user_leads_csv(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download user's lead CSV file"""
    try:
        user_address = current_user["address"]
        
        # Get CSV file record
        csv_file = await db.member_csv_files.find_one({
            "file_id": file_id,
            "member_address": user_address
        })
        
        if not csv_file:
            raise HTTPException(status_code=404, detail="CSV file not found")
        
        # Update download tracking
        await db.member_csv_files.update_one(
            {"file_id": file_id},
            {
                "$set": {
                    "downloaded": True,
                    "downloaded_at": datetime.utcnow()
                },
                "$inc": {"download_count": 1}
            }
        )
        
        # Return CSV content as downloadable file
        return StreamingResponse(
            io.StringIO(csv_file["csv_content"]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={csv_file['filename']}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download CSV file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download CSV file")


# =============================================================================
# TICKETING SYSTEM API ENDPOINTS
# =============================================================================

# Helper function to create ticket notifications
async def create_ticket_notification(ticket_id: str, sender_address: str, sender_username: str, contact_type: str, subject: str, priority: str, category: str, message: str):
    """Create notifications for ticket creation"""
    try:
        if contact_type == "admin":
            # Notify admin (database notification)
            await create_admin_notification(
                notification_type="ticket",
                title="New Support Ticket",
                message=f"New ticket from {sender_username}: {subject}",
                related_user=sender_address
            )
            
            # Send email to admin
            try:
                await send_admin_ticket_notification(
                    ticket_id=ticket_id,
                    username=sender_username,
                    subject=subject,
                    priority=priority,
                    category=category,
                    message_preview=message
                )
                logger.info(f"Admin email notification sent for ticket {ticket_id}")
            except Exception as email_error:
                logger.error(f"Failed to send admin email for ticket {ticket_id}: {str(email_error)}")
                # Continue even if email fails - database notification already created
                
        elif contact_type == "sponsor":
            # Find sponsor and notify
            sender = await db.users.find_one({"address": sender_address})
            if sender and sender.get("referrer_address"):
                await create_notification(
                    user_address=sender["referrer_address"],
                    notification_type="ticket",
                    title="Message from Downline",
                    message=f"{sender_username} sent you a message: {subject}"
                )
        elif contact_type in ["downline_individual", "downline_mass"]:
            # Notifications for downline messages are sent when replies are made
            pass
            
    except Exception as e:
        logger.error(f"Failed to create ticket notification: {str(e)}")

# File upload helper for ticket attachments
@app.post("/api/tickets/upload-attachment")
async def upload_ticket_attachment(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload file attachment for tickets to cPanel FTP"""
    try:
        # Validate file size (10MB max)
        if file.size and file.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB")
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 
                        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="File type not allowed")
        
        # Read file content
        content = await file.read()
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Upload to FTP
        remote_path = f"attachments/{unique_filename}"
        result = await upload_file_to_ftp(content, remote_path, file.content_type)
        
        # Store file info in database
        attachment_doc = {
            "attachment_id": str(uuid.uuid4()),
            "filename": file.filename,
            "unique_filename": unique_filename,
            "remote_path": remote_path,
            "public_url": result["public_url"],
            "file_size": len(content),
            "content_type": file.content_type,
            "uploaded_by": current_user["address"],
            "uploaded_at": datetime.utcnow()
        }
        
        await db.ticket_attachments.insert_one(attachment_doc)
        
        return {
            "attachment_id": attachment_doc["attachment_id"],
            "filename": file.filename,
            "file_size": len(content)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail="File upload failed")

# Create a new ticket
@app.post("/api/tickets/create")
async def create_ticket(
    contact_type: str = Form(...),
    category: str = Form(...),
    priority: str = Form(...),
    subject: str = Form(...),
    message: str = Form(...),
    recipient_address: Optional[str] = Form(None),
    attachment_ids: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Create a new support ticket"""
    try:
        # Validate contact type and recipients
        if contact_type == "downline_individual" and not recipient_address:
            raise HTTPException(status_code=400, detail="Recipient address required for individual downline messages")
        
        # For sponsor messages, verify user has a sponsor
        recipient_username = None
        if contact_type == "sponsor":
            # Find user by either address or username depending on auth method
            user_query = {}
            if current_user.get("address"):
                user_query = {"address": current_user["address"]}
            else:
                user_query = {"username": current_user["username"]}
            
            user = await db.users.find_one(user_query)
            if not user.get("referrer_address"):
                raise HTTPException(status_code=400, detail="You don't have a sponsor to message")
            
            # Get sponsor info
            sponsor = await db.users.find_one({"address": user["referrer_address"]})
            if sponsor:
                recipient_username = sponsor.get("username")
                recipient_address = sponsor["address"]
        
        # For individual downline messages, verify recipient is a direct referral
        elif contact_type == "downline_individual":
            # Find user by either address or username depending on auth method
            user_query = {}
            if current_user.get("address"):
                user_query = {"address": current_user["address"]}
            else:
                user_query = {"username": current_user["username"]}
            
            user = await db.users.find_one(user_query)
            referrals = user.get("referrals", [])
            
            # Check if recipient is in direct referrals
            recipient_found = False
            for referral in referrals:
                if referral.get("address") == recipient_address:
                    recipient_found = True
                    recipient_username = referral.get("username")
                    break
            
            if not recipient_found:
                raise HTTPException(status_code=400, detail="Recipient is not your direct referral")
        
        # For mass downline messages, get all direct referrals
        elif contact_type == "downline_mass":
            # Find user by either address or username depending on auth method
            user_query = {}
            if current_user.get("address"):
                user_query = {"address": current_user["address"]}
            else:
                user_query = {"username": current_user["username"]}
            
            user = await db.users.find_one(user_query)
            referrals = user.get("referrals", [])
            if not referrals:
                raise HTTPException(status_code=400, detail="You don't have any referrals to message")
        
        # Create ticket document
        ticket_id = str(uuid.uuid4())
        
        # Handle both authentication methods (address for Web3, username for traditional)
        sender_address = current_user.get("address") or current_user.get("username")
        sender_username = current_user.get("username") or current_user.get("address")
        
        ticket_doc = {
            "ticket_id": ticket_id,
            "sender_address": sender_address,
            "sender_username": sender_username,
            "contact_type": contact_type,
            "recipient_address": recipient_address,
            "recipient_username": recipient_username,
            "category": category,
            "priority": priority,
            "subject": subject,
            "status": "open",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "attachment_count": 0
        }
        
        # Handle attachments if provided
        attachment_urls = []
        if attachment_ids:
            try:
                attachment_list = json.loads(attachment_ids)
                for attachment_id in attachment_list:
                    # Verify attachment exists and belongs to user
                    attachment = await db.ticket_attachments.find_one({
                        "attachment_id": attachment_id,
                        "uploaded_by": current_user["address"]
                    })
                    if attachment:
                        attachment_urls.append(f"/tickets/attachment/{attachment_id}")
                        ticket_doc["attachment_count"] += 1
            except json.JSONDecodeError:
                pass
        
        # Insert ticket
        await db.tickets.insert_one(ticket_doc)
        
        # Create initial message
        message_doc = {
            "message_id": str(uuid.uuid4()),
            "ticket_id": ticket_id,
            "sender_address": sender_address,
            "sender_username": sender_username,
            "sender_role": "user",
            "message": message,
            "attachment_urls": attachment_urls,
            "created_at": datetime.utcnow()
        }
        
        await db.ticket_messages.insert_one(message_doc)
        
        # Handle mass messaging for downline_mass
        if contact_type == "downline_mass":
            # Find user by either address or username depending on auth method
            user_query = {}
            if current_user.get("address"):
                user_query = {"address": current_user["address"]}
            else:
                user_query = {"username": current_user["username"]}
            
            user = await db.users.find_one(user_query)
            referrals = user.get("referrals", [])
            
            for referral in referrals:
                # Create individual ticket for each referral
                individual_ticket_id = str(uuid.uuid4())
                individual_ticket_doc = {
                    "ticket_id": individual_ticket_id,
                    "sender_address": sender_address,
                    "sender_username": sender_username,
                    "contact_type": "downline_individual",
                    "recipient_address": referral.get("address"),
                    "recipient_username": referral.get("username"),
                    "category": category,
                    "priority": priority,
                    "subject": f"[Mass Message] {subject}",
                    "status": "open",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "attachment_count": len(attachment_urls)
                }
                
                await db.tickets.insert_one(individual_ticket_doc)
                
                # Create message for individual ticket
                individual_message_doc = {
                    "message_id": str(uuid.uuid4()),
                    "ticket_id": individual_ticket_id,
                    "sender_address": sender_address,
                    "sender_username": sender_username,
                    "sender_role": "user",
                    "message": message,
                    "attachment_urls": attachment_urls,
                    "created_at": datetime.utcnow()
                }
                
                await db.ticket_messages.insert_one(individual_message_doc)
                
                # Create notification for recipient
                await create_notification(
                    user_address=referral.get("address"),
                    notification_type="ticket",
                    title="Message from Sponsor",
                    message=f"{sender_username} sent you a message: {subject}"
                )
        
        # Create notifications
        await create_ticket_notification(
            ticket_id, sender_address, sender_username, 
            contact_type, subject, priority, category, message
        )
        
        return {"ticket_id": ticket_id, "status": "created", "message": "Ticket created successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create ticket: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create ticket")

# Get tickets for current user
@app.get("/api/tickets/user")
async def get_user_tickets(
    page: int = 1,
    limit: int = 10,
    status_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get tickets for the current user"""
    try:
        # Build query
        query = {"$or": [
            {"sender_address": current_user["address"]},
            {"recipient_address": current_user["address"]}
        ]}
        
        if status_filter:
            query["status"] = status_filter
        
        if category_filter:
            query["category"] = category_filter
        
        # Get total count
        total_count = await db.tickets.count_documents(query)
        
        # Calculate pagination
        skip = (page - 1) * limit
        total_pages = (total_count + limit - 1) // limit
        
        # Get tickets
        tickets = await db.tickets.find(query).sort("updated_at", -1).skip(skip).limit(limit).to_list(None)
        
        # Convert ObjectId and datetime for JSON serialization
        for ticket in tickets:
            if "_id" in ticket:
                del ticket["_id"]  # Remove MongoDB ObjectId
            if "created_at" in ticket:
                ticket["created_at"] = ticket["created_at"].isoformat()
            if "updated_at" in ticket:
                ticket["updated_at"] = ticket["updated_at"].isoformat()
        
        return {
            "tickets": tickets,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch user tickets: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch tickets")

# Get ticket details with messages
@app.get("/api/tickets/{ticket_id}")
async def get_ticket_details(ticket_id: str, current_user: dict = Depends(get_current_user)):
    """Get ticket details with conversation thread"""
    try:
        # Get ticket
        ticket = await db.tickets.find_one({"ticket_id": ticket_id})
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Verify user has access to this ticket
        if (ticket["sender_address"] != current_user["address"] and 
            ticket.get("recipient_address") != current_user["address"]):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get messages
        messages = await db.ticket_messages.find(
            {"ticket_id": ticket_id}
        ).sort("created_at", 1).to_list(None)
        
        # Convert ObjectId and datetime for JSON serialization
        if "_id" in ticket:
            del ticket["_id"]  # Remove MongoDB ObjectId
        if "created_at" in ticket:
            ticket["created_at"] = ticket["created_at"].isoformat()
        if "updated_at" in ticket:
            ticket["updated_at"] = ticket["updated_at"].isoformat()
        
        for message in messages:
            if "_id" in message:
                del message["_id"]  # Remove MongoDB ObjectId
            if "created_at" in message:
                message["created_at"] = message["created_at"].isoformat()
        
        return {
            "ticket": ticket,
            "messages": messages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch ticket details: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch ticket details")

# Reply to a ticket
@app.post("/api/tickets/{ticket_id}/reply")
async def reply_to_ticket(
    ticket_id: str,
    message: str = Form(...),
    attachment_ids: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Reply to a ticket"""
    try:
        # Get ticket
        ticket = await db.tickets.find_one({"ticket_id": ticket_id})
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Verify user has access to this ticket
        if (ticket["sender_address"] != current_user.get("address") and 
            ticket.get("recipient_address") != current_user.get("address") and
            ticket["sender_username"] != current_user.get("username") and 
            ticket.get("recipient_username") != current_user.get("username")):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Handle attachments if provided
        attachment_urls = []
        if attachment_ids:
            try:
                attachment_list = json.loads(attachment_ids)
                for attachment_id in attachment_list:
                    # Verify attachment exists and belongs to user
                    attachment = await db.ticket_attachments.find_one({
                        "attachment_id": attachment_id,
                        "uploaded_by": current_user.get("address") or current_user.get("username")
                    })
                    if attachment:
                        attachment_urls.append(f"/tickets/attachment/{attachment_id}")
            except json.JSONDecodeError:
                pass
        
        # Create reply message
        sender_address = current_user.get("address") or current_user.get("username")
        sender_username = current_user.get("username") or current_user.get("address")
        
        message_doc = {
            "message_id": str(uuid.uuid4()),
            "ticket_id": ticket_id,
            "sender_address": sender_address,
            "sender_username": sender_username,
            "sender_role": "user",
            "message": message,
            "attachment_urls": attachment_urls,
            "created_at": datetime.utcnow()
        }
        
        await db.ticket_messages.insert_one(message_doc)
        
        # Update ticket timestamp and status if closed
        update_fields = {"updated_at": datetime.utcnow()}
        if ticket["status"] == "closed":
            update_fields["status"] = "open"  # Reopen if reply to closed ticket
        
        await db.tickets.update_one(
            {"ticket_id": ticket_id},
            {"$set": update_fields}
        )
        
        # Create notification for the other party
        current_user_identifier = current_user.get("address") or current_user.get("username")
        sender_identifier = ticket.get("sender_address") or ticket.get("sender_username")
        
        if current_user_identifier == sender_identifier:
            # Reply from ticket sender, notify recipient
            if ticket.get("recipient_address"):
                await create_notification(
                    user_address=ticket["recipient_address"],
                    notification_type="ticket",
                    title="Ticket Reply",
                    message=f"{sender_username} replied to: {ticket['subject']}"
                )
        else:
            # Reply from recipient, notify sender
            await create_notification(
                user_address=ticket["sender_address"],
                notification_type="ticket", 
                title="Ticket Reply",
                message=f"{sender_username} replied to: {ticket['subject']}"
            )
        
        return {"message": "Reply sent successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send reply: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send reply")

# Delete a ticket (user can only delete their own closed tickets)
@app.delete("/api/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a ticket (only closed tickets by the sender)"""
    try:
        # Get ticket
        ticket = await db.tickets.find_one({"ticket_id": ticket_id})
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Verify user has access to delete this ticket
        user_identifier = current_user.get("address") or current_user.get("username")
        
        # Allow deletion if:
        # 1. User is the sender (their own tickets)
        # 2. User is the recipient (news messages sent to them)
        can_delete = False
        
        # Check if user is sender
        if (ticket.get("sender_address") == current_user.get("address") or 
            ticket.get("sender_username") == current_user.get("username")):
            can_delete = True
        
        # Check if user is recipient (for news messages)
        elif (ticket.get("recipient_address") == current_user.get("address") or
              ticket.get("recipient_username") == current_user.get("username")):
            can_delete = True
        
        if not can_delete:
            raise HTTPException(status_code=403, detail="You can only delete your own tickets or messages sent to you")
        
        # Only allow deletion of closed tickets
        if ticket["status"] != "closed":
            raise HTTPException(status_code=400, detail="Only closed tickets can be deleted")
        
        # Delete ticket messages first
        await db.ticket_messages.delete_many({"ticket_id": ticket_id})
        
        # Delete the ticket
        await db.tickets.delete_one({"ticket_id": ticket_id})
        
        return {"message": "Ticket deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete ticket: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete ticket")

# Get user's direct referrals for downline messaging
@app.get("/api/tickets/downline-contacts")
async def get_downline_contacts(current_user: dict = Depends(get_current_user)):
    """Get user's direct referrals for individual messaging"""
    try:
        # Find user by either address or username depending on auth method
        user_query = {}
        if current_user.get("address"):
            user_query = {"address": current_user["address"]}
        else:
            user_query = {"username": current_user["username"]}
        
        user = await db.users.find_one(user_query)
        if not user:
            return {"contacts": []}
        
        referral_identifiers = user.get("referrals", [])
        
        # Fetch actual user data for each referral
        contacts = []
        for identifier in referral_identifiers:
            # Identifier could be just an address string or a formatted string
            if isinstance(identifier, str):
                # Try to find user by address first
                referral_user = await db.users.find_one({"address": identifier})
                
                # If not found, try to parse the formatted string (username - email - tier format)
                if not referral_user and ' - ' in identifier:
                    parts = identifier.split(' - ')
                    if len(parts) >= 2:
                        username = parts[0].strip()
                        referral_user = await db.users.find_one({"username": username})
                
                # Add to contacts if found
                if referral_user:
                    contacts.append({
                        "address": referral_user.get("address", ""),
                        "username": referral_user.get("username", "Unknown"),
                        "email": referral_user.get("email", ""),
                        "membership_tier": referral_user.get("membership_tier", "affiliate")
                    })
            elif isinstance(identifier, dict):
                # Already an object (newer format)
                contacts.append({
                    "address": identifier.get("address", ""),
                    "username": identifier.get("username", "Unknown"),
                    "email": identifier.get("email", ""),
                    "membership_tier": identifier.get("membership_tier", "affiliate")
                })
        
        logger.info(f"Found {len(contacts)} downline contacts for user {user.get('username')}")
        return {"contacts": contacts}
        
    except Exception as e:
        logger.error(f"Failed to fetch downline contacts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch contacts")

# Admin-specific ticket details endpoint
@app.get("/api/admin/tickets/{ticket_id}")
async def get_admin_ticket_details(ticket_id: str, admin: dict = Depends(get_admin_user)):
    """Get ticket details for admin (admin can view any ticket)"""
    try:
        # Get ticket
        ticket = await db.tickets.find_one({"ticket_id": ticket_id})
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Get messages
        messages = await db.ticket_messages.find(
            {"ticket_id": ticket_id}
        ).sort("created_at", 1).to_list(None)
        
        # Convert ObjectId and datetime for JSON serialization
        if "_id" in ticket:
            del ticket["_id"]  # Remove MongoDB ObjectId
        if "created_at" in ticket:
            ticket["created_at"] = ticket["created_at"].isoformat()
        if "updated_at" in ticket:
            ticket["updated_at"] = ticket["updated_at"].isoformat()
        
        for message in messages:
            if "_id" in message:
                del message["_id"]  # Remove MongoDB ObjectId
            if "created_at" in message:
                message["created_at"] = message["created_at"].isoformat()
        
        return {
            "ticket": ticket,
            "messages": messages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch admin ticket details: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch ticket details")

# =============================================================================
# ADMIN TICKET MANAGEMENT API ENDPOINTS
# =============================================================================

# Get all tickets for admin
@app.get("/api/admin/tickets")
async def get_admin_tickets(
    page: int = 1,
    limit: int = 20,
    status_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
    user_filter: Optional[str] = None,
    contact_type_filter: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Get all tickets for admin dashboard"""
    try:
        # Build query - exclude individual news tickets from admin view
        query = {"contact_type": {"$ne": "news"}}  # Hide individual news tickets
        
        if status_filter:
            query["status"] = status_filter
        
        if category_filter:
            query["category"] = category_filter
            
        if contact_type_filter:
            if contact_type_filter == "news":
                # If admin specifically filters for news, show broadcast tickets
                query["contact_type"] = "broadcast"
            else:
                query["contact_type"] = contact_type_filter
        
        if user_filter:
            # Search by username or email
            query["$or"] = [
                {"sender_username": {"$regex": user_filter, "$options": "i"}},
                {"recipient_username": {"$regex": user_filter, "$options": "i"}}
            ]
        
        # Get total count
        total_count = await db.tickets.count_documents(query)
        
        # Calculate pagination
        skip = (page - 1) * limit
        total_pages = (total_count + limit - 1) // limit
        
        # Get tickets
        tickets = await db.tickets.find(query).sort("updated_at", -1).skip(skip).limit(limit).to_list(None)
        
        # Convert ObjectId and datetime for JSON serialization
        for ticket in tickets:
            if "_id" in ticket:
                del ticket["_id"]  # Remove MongoDB ObjectId
            if "created_at" in ticket:
                ticket["created_at"] = ticket["created_at"].isoformat()
            if "updated_at" in ticket:
                ticket["updated_at"] = ticket["updated_at"].isoformat()
        
        return {
            "tickets": tickets,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch admin tickets: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch tickets")

# Update ticket status (admin only)
@app.put("/api/admin/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    status_data: TicketStatusUpdate,
    admin: dict = Depends(get_admin_user)
):
    """Update ticket status"""
    try:
        # Validate status
        if status_data.status not in ["open", "in_progress", "closed"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        # Update ticket
        result = await db.tickets.update_one(
            {"ticket_id": ticket_id},
            {"$set": {
                "status": status_data.status,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Get ticket for notification
        ticket = await db.tickets.find_one({"ticket_id": ticket_id})
        if ticket:
            # Notify ticket sender
            await create_notification(
                user_address=ticket["sender_address"],
                notification_type="ticket",
                title="Ticket Status Updated",
                message=f"Your ticket '{ticket['subject']}' status changed to: {status_data.status}"
            )
        
        return {"message": "Ticket status updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update ticket status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update ticket status")

# Admin reply to ticket
@app.post("/api/admin/tickets/{ticket_id}/reply")
async def admin_reply_to_ticket(
    ticket_id: str,
    message: str = Form(...),
    attachment_ids: Optional[str] = Form(None),
    admin: dict = Depends(get_admin_user)
):
    """Admin reply to a ticket"""
    try:
        # Get ticket
        ticket = await db.tickets.find_one({"ticket_id": ticket_id})
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Handle attachments if provided (admin can upload files too)
        attachment_urls = []
        if attachment_ids:
            try:
                attachment_list = json.loads(attachment_ids)
                for attachment_id in attachment_list:
                    # For admin, we can be more lenient with attachment verification
                    attachment = await db.ticket_attachments.find_one({
                        "attachment_id": attachment_id
                    })
                    if attachment:
                        attachment_urls.append(f"/tickets/attachment/{attachment_id}")
            except json.JSONDecodeError:
                pass
        
        # Create reply message
        message_doc = {
            "message_id": str(uuid.uuid4()),
            "ticket_id": ticket_id,
            "sender_address": "admin",
            "sender_username": admin["username"],
            "sender_role": "admin",
            "message": message,
            "attachment_urls": attachment_urls,
            "created_at": datetime.utcnow()
        }
        
        await db.ticket_messages.insert_one(message_doc)
        
        # Update ticket timestamp and set to in_progress if open
        update_fields = {"updated_at": datetime.utcnow()}
        if ticket["status"] == "open":
            update_fields["status"] = "in_progress"
        
        await db.tickets.update_one(
            {"ticket_id": ticket_id},
            {"$set": update_fields}
        )
        
        # Create notification for ticket sender
        await create_notification(
            user_address=ticket["sender_address"],
            notification_type="ticket",
            title="Admin Reply",
            message=f"Admin replied to your ticket: {ticket['subject']}"
        )
        
        return {"message": "Reply sent successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send admin reply: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send admin reply")

# Send mass news message
@app.post("/api/admin/tickets/mass-message")


# Admin utility endpoint for database migrations
@app.post("/api/admin/migrate/referral-codes")
async def migrate_referral_codes_to_usernames(admin: dict = Depends(get_admin_user)):
    """
    Migrate all existing referral codes to use lowercase usernames
    This is a one-time migration endpoint for production database
    """
    try:
        logger.info("Starting referral code migration to username format...")
        
        # Get all users
        users = await db.users.find({}).to_list(length=None)
        
        updated_count = 0
        skipped_count = 0
        errors = []
        
        for user in users:
            try:
                old_code = user.get("referral_code", "")
                new_code = user.get("username", "").lower()
                
                if old_code != new_code and new_code:
                    # Update the user's referral code
                    await db.users.update_one(
                        {"_id": user["_id"]},
                        {"$set": {"referral_code": new_code}}
                    )
                    logger.info(f"Updated referral code for {user['username']}: {old_code} -> {new_code}")
                    updated_count += 1
                else:
                    skipped_count += 1
                    
            except Exception as e:
                error_msg = f"Error updating user {user.get('username', 'unknown')}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        logger.info(f"Referral code migration complete. Updated: {updated_count}, Skipped: {skipped_count}")
        
        return {
            "success": True,
            "message": "Referral code migration completed successfully",
            "total_users": len(users),
            "updated": updated_count,
            "skipped": skipped_count,
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"Referral code migration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")

async def send_mass_message(
    message_data: MassNewsMessage,
    admin: dict = Depends(get_admin_user)
):
    """Send mass news message to users"""
    try:
        # Determine target users
        target_users = []
        
        if message_data.target_type == "all_users":
            # Get all active users
            users = await db.users.find({"suspended": {"$ne": True}}).to_list(None)
            target_users = users
            
        elif message_data.target_type == "specific_tiers":
            if not message_data.target_tiers:
                raise HTTPException(status_code=400, detail="Target tiers required")
            
            # Get users by membership tiers
            users = await db.users.find({
                "membership_tier": {"$in": message_data.target_tiers},
                "suspended": {"$ne": True}
            }).to_list(None)
            target_users = users
            
        elif message_data.target_type == "specific_users":
            if not message_data.target_users:
                raise HTTPException(status_code=400, detail="Target users required")
            
            # Get specific users
            users = await db.users.find({
                "address": {"$in": message_data.target_users},
                "suspended": {"$ne": True}
            }).to_list(None)
            target_users = users
        
        if not target_users:
            raise HTTPException(status_code=400, detail="No target users found")
        
        # Create a single broadcast ticket instead of individual tickets
        broadcast_ticket_id = str(uuid.uuid4())
        broadcast_ticket_doc = {
            "ticket_id": broadcast_ticket_id,
            "sender_address": "admin",
            "sender_username": admin["username"],
            "contact_type": "broadcast",
            "recipient_address": None,
            "recipient_username": f"{len(target_users)} recipients",
            "category": "general",
            "priority": "medium",
            "subject": f"[BROADCAST] {message_data.subject}",
            "status": "closed",  # Broadcast messages are closed by default
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "attachment_count": 0,
            "recipient_count": len(target_users),
            "target_type": message_data.target_type,
            "target_tiers": message_data.target_tiers if message_data.target_type == "specific_tiers" else None
        }
        
        await db.tickets.insert_one(broadcast_ticket_doc)
        
        # Create a single broadcast message
        broadcast_message_doc = {
            "message_id": str(uuid.uuid4()),
            "ticket_id": broadcast_ticket_id,
            "sender_address": "admin",
            "sender_username": admin["username"],
            "sender_role": "admin",
            "message": message_data.message,
            "attachment_urls": [],
            "created_at": datetime.utcnow()
        }
        
        await db.ticket_messages.insert_one(broadcast_message_doc)
        
        # Create individual user-specific news tickets that reference the broadcast
        created_count = 0
        for user in target_users:
            # Create news ticket
            ticket_id = str(uuid.uuid4())
            ticket_doc = {
                "ticket_id": ticket_id,
                "sender_address": "admin",
                "sender_username": admin["username"],
                "contact_type": "news",
                "recipient_address": user["address"],
                "recipient_username": user["username"],
                "category": "general",
                "priority": "medium",
                "subject": f"[NEWS] {message_data.subject}",
                "status": "closed",  # News messages are closed by default
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "attachment_count": 0,
                "broadcast_id": broadcast_ticket_id  # Reference to the original broadcast
            }
            
            await db.tickets.insert_one(ticket_doc)
            
            # Create message
            message_doc = {
                "message_id": str(uuid.uuid4()),
                "ticket_id": ticket_id,
                "sender_address": "admin",
                "sender_username": admin["username"],
                "sender_role": "admin",
                "message": message_data.message,
                "attachment_urls": [],
                "created_at": datetime.utcnow()
            }
            
            await db.ticket_messages.insert_one(message_doc)
            
            # Create notification
            await create_notification(
                user_address=user["address"],
                notification_type="ticket",
                title="News Update",
                message=f"New announcement: {message_data.subject}"
            )
            
            created_count += 1
        
        return {
            "message": "Mass message sent successfully",
            "recipients_count": created_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send mass message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send mass message")

# Get attachment file
@app.get("/api/tickets/attachment/{attachment_id}")
async def get_ticket_attachment(attachment_id: str, current_user: dict = Depends(get_user_or_admin)):
    """Download ticket attachment from FTP - accessible by users and admins"""
    try:
        # Get attachment info
        attachment = await db.ticket_attachments.find_one({"attachment_id": attachment_id})
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        # Admins have full access, users need verification
        if not current_user.get("is_admin", False):
            # Verify access for regular users (either uploader or involved in tickets with this attachment)
            user_identifier = current_user.get("address") or current_user.get("username")
            uploader_identifier = attachment.get("uploaded_by")
            
            if uploader_identifier != user_identifier:
                # Check if user is involved in any tickets with this attachment
                ticket_messages = await db.ticket_messages.find({
                    "attachment_urls": f"/tickets/attachment/{attachment_id}"
                }).to_list(None)
                
                has_access = False
                for message in ticket_messages:
                    ticket = await db.tickets.find_one({"ticket_id": message["ticket_id"]})
                    if ticket:
                        # Check if user is sender or recipient using flexible identifiers
                        if (ticket.get("sender_address") == current_user.get("address") or 
                            ticket.get("sender_username") == current_user.get("username") or
                            ticket.get("recipient_address") == current_user.get("address") or
                            ticket.get("recipient_username") == current_user.get("username")):
                            has_access = True
                            break
                
                if not has_access:
                    raise HTTPException(status_code=403, detail="Access denied")
        
        # Download file from FTP
        remote_path = attachment.get("remote_path")
        if not remote_path:
            # Fallback for old attachments
            remote_path = f"attachments/{attachment.get('unique_filename')}"
        
        content = await download_file_from_ftp(remote_path)
        if content is None:
            raise HTTPException(status_code=404, detail="File not found")
        
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type=attachment["content_type"],
            headers={
                "Content-Disposition": f"attachment; filename={attachment['filename']}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download attachment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download attachment")

# Generate temporary view URL for attachment
@app.get("/api/tickets/attachment/{attachment_id}/view-url")
async def generate_attachment_view_url(attachment_id: str, current_user: dict = Depends(get_current_user)):
    """Generate a temporary authenticated URL for viewing attachment"""
    try:
        # Get attachment info
        attachment = await db.ticket_attachments.find_one({"attachment_id": attachment_id})
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        # Verify access (same logic as download)
        user_identifier = current_user.get("address") or current_user.get("username")
        uploader_identifier = attachment.get("uploaded_by")
        
        if uploader_identifier != user_identifier:
            # Check if user is involved in any tickets with this attachment
            ticket_messages = await db.ticket_messages.find({
                "attachment_urls": f"/tickets/attachment/{attachment_id}"
            }).to_list(None)
            
            has_access = False
            for message in ticket_messages:
                ticket = await db.tickets.find_one({"ticket_id": message["ticket_id"]})
                if ticket:
                    # Check if user is sender or recipient using flexible identifiers
                    if (ticket.get("sender_address") == current_user.get("address") or 
                        ticket.get("sender_username") == current_user.get("username") or
                        ticket.get("recipient_address") == current_user.get("address") or
                        ticket.get("recipient_username") == current_user.get("username")):
                        has_access = True
                        break
            
            if not has_access:
                raise HTTPException(status_code=403, detail="Access denied")
        
        # For now, return the view URL - we'll handle auth differently
        return {
            "view_url": f"/tickets/attachment/{attachment_id}/view",
            "filename": attachment["filename"],
            "content_type": attachment["content_type"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate view URL: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate view URL")

# View attachment in browser (for images, PDFs, etc.)
@app.get("/api/tickets/attachment/{attachment_id}/view")
async def view_ticket_attachment(attachment_id: str, current_user: dict = Depends(get_current_user)):
    """View ticket attachment in browser"""
    try:
        # Get attachment info
        attachment = await db.ticket_attachments.find_one({"attachment_id": attachment_id})
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        # Verify access (same logic as download)
        user_identifier = current_user.get("address") or current_user.get("username")
        uploader_identifier = attachment.get("uploaded_by")
        
        if uploader_identifier != user_identifier:
            # Check if user is involved in any tickets with this attachment
            ticket_messages = await db.ticket_messages.find({
                "attachment_urls": f"/tickets/attachment/{attachment_id}"
            }).to_list(None)
            
            has_access = False
            for message in ticket_messages:
                ticket = await db.tickets.find_one({"ticket_id": message["ticket_id"]})
                if ticket:
                    # Check if user is sender or recipient using flexible identifiers
                    if (ticket.get("sender_address") == current_user.get("address") or 
                        ticket.get("sender_username") == current_user.get("username") or
                        ticket.get("recipient_address") == current_user.get("address") or
                        ticket.get("recipient_username") == current_user.get("username")):
                        has_access = True
                        break
            
            if not has_access:
                raise HTTPException(status_code=403, detail="Access denied")
        
        # Return file for inline viewing
        import os
        if not os.path.exists(attachment["file_path"]):
            raise HTTPException(status_code=404, detail="File not found")
        
        def file_generator():
            with open(attachment["file_path"], "rb") as f:
                while chunk := f.read(8192):
                    yield chunk
        
        # Return with inline disposition for browser viewing
        return StreamingResponse(
            file_generator(),
            media_type=attachment["content_type"],
            headers={
                "Content-Disposition": f"inline; filename={attachment['filename']}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to view attachment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to view attachment")


# Admin Recent Activity Endpoints
@app.get("/api/admin/recent/members")
async def get_recent_members(limit: int = 10, admin: dict = Depends(get_admin_user)):
    """Get recent members (max 10)"""
    try:
        members = await db.users.find().sort("created_at", -1).limit(limit).to_list(None)
        
        formatted_members = []
        for member in members:
            formatted_members.append({
                "username": member.get("username"),
                "tier": member.get("membership_tier"),
                "join_date": member.get("created_at"),
                "status": "Suspended" if member.get("suspended", False) else "Active"
            })
        
        return {"recent_members": formatted_members}
    except Exception as e:
        logger.error(f"Failed to fetch recent members: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch recent members")

@app.get("/api/admin/recent/payments")
async def get_recent_payments(limit: int = 10, admin: dict = Depends(get_admin_user)):
    """Get recent payments (max 10)"""
    try:
        payments = await db.payments.find().sort("created_at", -1).limit(limit).to_list(None)
        
        formatted_payments = []
        for payment in payments:
            # Get user info
            user = await db.users.find_one({"address": payment.get("user_address")})
            username = user.get("username", "Unknown") if user else "Unknown"
            
            formatted_payments.append({
                "member_name": username,
                "amount": payment.get("amount"),
                "payment_date": payment.get("created_at"),
                "tier": payment.get("tier"),
                "status": payment.get("status", "pending")
            })
        
        return {"recent_payments": formatted_payments}
    except Exception as e:
        logger.error(f"Failed to fetch recent payments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch recent payments")

@app.get("/api/admin/recent/milestones")
async def get_recent_milestones(limit: int = 10, admin: dict = Depends(get_admin_user)):
    """Get recent milestones (max 10)"""
    try:
        milestones = await db.milestones.find().sort("achieved_at", -1).limit(limit).to_list(None)
        
        formatted_milestones = []
        for milestone in milestones:
            # Get user info
            user = await db.users.find_one({"address": milestone.get("user_address")})
            username = user.get("username", "Unknown") if user else "Unknown"
            
            formatted_milestones.append({
                "member_name": username,
                "milestone_amount": milestone.get("bonus_amount"),
                "date": milestone.get("achieved_at"),
                "status": milestone.get("status", "pending"),
                "referral_count": milestone.get("referral_count", 0)
            })
        
        return {"recent_milestones": formatted_milestones}
    except Exception as e:
        logger.error(f"Failed to fetch recent milestones: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch recent milestones")

@app.get("/api/admin/recent/tickets")
async def get_recent_tickets(limit: int = 10, admin: dict = Depends(get_admin_user)):
    """Get recent tickets (max 10)"""
    try:
        tickets = await db.tickets.find().sort("created_at", -1).limit(limit).to_list(None)
        
        formatted_tickets = []
        for ticket in tickets:
            formatted_tickets.append({
                "ticket_id": ticket.get("ticket_id"),
                "department": ticket.get("category", "general"),
                "member_name": ticket.get("sender_username", "Unknown"),
                "subject": ticket.get("subject"),
                "status": ticket.get("status", "open")
            })
        
        return {"recent_tickets": formatted_tickets}
    except Exception as e:
        logger.error(f"Failed to fetch recent tickets: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch recent tickets")

# Admin Analytics Endpoints
@app.get("/api/admin/analytics/summary")
async def get_analytics_summary(admin: dict = Depends(get_admin_user)):
    """Get analytics summary metrics"""
    try:
        # Total Income (all confirmed payments)
        total_income_result = await db.payments.aggregate([
            {"$match": {"status": "confirmed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
        total_income = total_income_result[0]["total"] if total_income_result else 0
        
        # Total Commissions (all completed commission payouts)
        total_commission_result = await db.commissions.aggregate([
            {"$match": {"status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
        total_commission = total_commission_result[0]["total"] if total_commission_result else 0
        
        # Net Profit
        net_profit = total_income - total_commission
        
        # Held Payments for KYC (users with earnings > $50 and KYC not verified)
        users_with_kyc = await db.users.find({"kyc_status": {"$ne": "verified"}}).to_list(None)
        held_payments = 0
        
        for user in users_with_kyc:
            # Calculate total earnings
            user_earnings = await db.commissions.aggregate([
                {"$match": {"recipient_address": user["address"], "status": {"$in": ["completed", "pending"]}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]).to_list(1)
            
            earnings = user_earnings[0]["total"] if user_earnings else 0
            if earnings > 50:
                held_payments += earnings - 50  # Amount held above the $50 limit
        
        return {
            "total_income": total_income,
            "total_commission": total_commission,
            "net_profit": net_profit,
            "held_payments": held_payments
        }
    except Exception as e:
        logger.error(f"Failed to fetch analytics summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics summary")

@app.get("/api/admin/analytics/graphs")
async def get_analytics_graphs(
    time_filter: str = "1month",  # 1day, 1week, 1month, 1year, all
    admin: dict = Depends(get_admin_user)
):
    """Get analytics data for graphs with time filtering"""
    try:
        now = datetime.utcnow()
        
        # Determine time range and grouping
        if time_filter == "1day":
            start_date = now - timedelta(days=1)
            group_format = "%Y-%m-%d %H:00"  # Hourly
        elif time_filter == "1week":
            start_date = now - timedelta(weeks=1)
            group_format = "%Y-%m-%d"  # Daily
        elif time_filter == "1month":
            start_date = now - timedelta(days=30)
            group_format = "%Y-%m-%d"  # Daily
        elif time_filter == "1year":
            start_date = now - timedelta(days=365)
            group_format = "%Y-%m"  # Monthly
        else:  # all
            start_date = datetime(2020, 1, 1)  # Far back date
            group_format = "%Y-%m"  # Monthly
        
        # Member Growth Data
        member_growth = await db.users.aggregate([
            {"$match": {"created_at": {"$gte": start_date}}},
            {"$group": {
                "_id": {"$dateToString": {"format": group_format, "date": "$created_at"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]).to_list(None)
        
        # Income Growth Data (confirmed payments)
        income_growth = await db.payments.aggregate([
            {"$match": {"status": "confirmed", "created_at": {"$gte": start_date}}},
            {"$group": {
                "_id": {"$dateToString": {"format": group_format, "date": "$created_at"}},
                "amount": {"$sum": "$amount"}
            }},
            {"$sort": {"_id": 1}}
        ]).to_list(None)
        
        # Commission Growth Data (completed payouts)
        commission_growth = await db.commissions.aggregate([
            {"$match": {"status": "completed", "created_at": {"$gte": start_date}}},
            {"$group": {
                "_id": {"$dateToString": {"format": group_format, "date": "$created_at"}},
                "amount": {"$sum": "$amount"}
            }},
            {"$sort": {"_id": 1}}
        ]).to_list(None)
        
        # Calculate profit growth (income - commission)
        # Create a combined dictionary for easier calculation
        income_dict = {item["_id"]: item["amount"] for item in income_growth}
        commission_dict = {item["_id"]: item["amount"] for item in commission_growth}
        
        # Get all unique time periods
        all_periods = sorted(set(list(income_dict.keys()) + list(commission_dict.keys())))
        
        profit_growth = []
        for period in all_periods:
            income = income_dict.get(period, 0)
            commission = commission_dict.get(period, 0)
            profit = income - commission
            profit_growth.append({"_id": period, "amount": profit})
        
        return {
            "member_growth": member_growth,
            "income_growth": income_growth,
            "profit_growth": profit_growth,
            "time_filter": time_filter
        }
    except Exception as e:
        logger.error(f"Failed to fetch analytics graphs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics graphs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)