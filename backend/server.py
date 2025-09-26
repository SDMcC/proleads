from fastapi import FastAPI, HTTPException, Depends, Request, WebSocket, WebSocketDisconnect, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import json
import hmac
import hashlib
import httpx
import asyncio
from datetime import datetime, timedelta
from jose import JWTError, jwt
from eth_account import Account
from eth_account.messages import encode_defunct
import uuid
from decimal import Decimal
import logging
from dotenv import load_dotenv
import csv
import io

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
    "bronze": {"price": 20, "commissions": [0.25, 0.05, 0.03, 0.02]},
    "silver": {"price": 50, "commissions": [0.27, 0.10, 0.05, 0.03]},
    "gold": {"price": 100, "commissions": [0.30, 0.15, 0.10, 0.05]}
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

def generate_referral_code(address: str) -> str:
    """Generate unique referral code"""
    return f"REF{address[:6].upper()}{str(uuid.uuid4())[:8].upper()}"

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
        user = await db.users.find_one({"address": payload["address"]})
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
                
                logger.info(f"Commission Level {level + 1}: {referrer_tier} earns {commission_rate*100}% of ${new_member_amount} = ${commission_amount}")
                
                # Initiate instant payout
                await initiate_payout(current_referrer_address, commission_amount)
            else:
                logger.info(f"No commission for level {level + 1} - rate is 0%")
        else:
            logger.info(f"Referrer {referrer_tier} tier only has {len(referrer_commission_rates)} commission levels, stopping at level {level + 1}")
            break
        
        # Move to next level up the chain
        current_referrer_address = referrer.get("referrer_address")
    
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

# Original nonce-based auth endpoints (keeping for backward compatibility)
@app.post("/api/auth/nonce")
async def generate_nonce(request: NonceRequest):
    """Generate nonce for wallet authentication"""
    nonce = str(uuid.uuid4())
    
    await db.auth_sessions.update_one(
        {"address": request.address.lower()},
        {
            "$set": {
                "nonce": nonce,
                "expires_at": datetime.utcnow() + timedelta(minutes=5)
            }
        },
        upsert=True
    )
    
    return {"nonce": nonce}

@app.post("/api/auth/verify")
async def verify_signature(request: VerifySignature):
    """Verify wallet signature and return JWT token"""
    session = await db.auth_sessions.find_one({"address": request.address.lower()})
    
    if not session or session["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=404, detail="Nonce expired or not found")
    
    message = f"Sign this message to authenticate: {session['nonce']}"
    
    try:
        recovered_address = Account.recover_message(
            encode_defunct(text=message),
            signature=request.signature
        )
        
        if recovered_address.lower() != request.address.lower():
            raise HTTPException(status_code=401, detail="Invalid signature")
    except Exception:
        raise HTTPException(status_code=401, detail="Signature verification failed")
    
    # Generate JWT token
    token_data = {
        "address": request.address.lower(),
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    # Clean up session
    await db.auth_sessions.delete_one({"address": request.address.lower()})
    
    return {"token": token, "address": request.address}

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
        
        # Generate referral code
        referral_code = f"REF{user_data.username.upper()}{uuid.uuid4().hex[:6].upper()}"
        
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
            "suspended": False
        }
        
        # Insert user
        result = await db.users.insert_one(user_doc)
        
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

# Payment endpoints
@app.post("/api/payments/create")
async def create_payment(request: PaymentRequest, current_user: dict = Depends(get_current_user)):
    """Create payment for membership upgrade"""
    logger.info(f"Payment request received: tier={request.tier}, currency={request.currency}")
    
    tier_info = MEMBERSHIP_TIERS.get(request.tier)
    if not tier_info:
        raise HTTPException(status_code=400, detail="Invalid membership tier")
    
    if tier_info["price"] == 0:
        # Free affiliate tier
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
        
        # Ensure currency is lowercase as expected by NOWPayments
        pay_currency = request.currency.lower()
        logger.info(f"Using pay_currency: {pay_currency}")
        
        # Create payment with NOWPayments
        payment_data = {
            "price_amount": tier_info["price"],
            "price_currency": "USD",
            "pay_currency": pay_currency,
            "ipn_callback_url": f"{APP_URL}/api/payments/callback",
            "order_id": f"{current_user['address']}_{request.tier}_{int(datetime.utcnow().timestamp())}",
            "order_description": f"{request.tier.capitalize()} Membership - {current_user['username']}"
        }
        
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
                
                # Store payment record
                payment_doc = {
                    "payment_id": payment_result["payment_id"],
                    "user_address": current_user["address"],
                    "tier": request.tier,
                    "amount": tier_info["price"],
                    "currency": request.currency,
                    "status": "waiting",
                    "created_at": datetime.utcnow(),
                    "payment_url": payment_result.get("invoice_url"),
                    "pay_address": payment_result.get("pay_address"),
                    "pay_amount": payment_result.get("pay_amount"),
                    "pay_currency": payment_result.get("pay_currency")
                }
                
                await db.payments.insert_one(payment_doc)
                
                return {
                    "payment_id": payment_result["payment_id"],
                    "payment_url": payment_result.get("invoice_url"),
                    "amount": payment_result.get("pay_amount"),
                    "currency": payment_result.get("pay_currency"),
                    "address": payment_result.get("pay_address"),
                    "status": "created"
                }
            else:
                error_text = response.text
                logger.error(f"NOWPayments error: {error_text}")
                
                # Try to parse error message
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

@app.post("/api/payments/callback")
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
        payment_id = data["payment_id"]
        payment_status = data["payment_status"]
        
        # Update payment status
        payment = await db.payments.find_one({"payment_id": payment_id})
        if not payment:
            return {"status": "payment not found"}
        
        await db.payments.update_one(
            {"payment_id": payment_id},
            {"$set": {"status": payment_status, "updated_at": datetime.utcnow()}}
        )
        
        # If payment confirmed, upgrade membership and calculate commissions
        if payment_status == "confirmed":
            user_address = payment["user_address"]
            tier = payment["tier"]
            amount = payment["amount"]
            
            # Upgrade membership
            await db.users.update_one(
                {"address": user_address},
                {"$set": {"membership_tier": tier}}
            )
            
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
                "total_achieved": 0,  # Placeholder for future milestones system
                "pending_bonuses": 0,
                "total_bonuses_paid": 0
            }
        }
        
    except Exception as e:
        logger.error(f"Admin dashboard overview error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard overview")

# Admin members management endpoints
@app.get("/api/admin/members")
async def get_all_members(
    tier: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    admin: dict = Depends(get_admin_user)
):
    """Get all members with optional filtering and pagination"""
    try:
        skip = (page - 1) * limit
        
        # Build filter query
        filter_query = {}
        if tier:
            filter_query["membership_tier"] = tier
        
        # Get total count
        total_count = await db.users.count_documents(filter_query)
        
        # Get members with pagination
        members_cursor = db.users.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        members = await members_cursor.to_list(length=None)
        
        # Enrich member data with additional info
        enriched_members = []
        for member in members:
            # Get referral count
            referral_count = await db.users.count_documents({"referrer_address": member["address"]})
            
            # Get total earnings
            earnings_pipeline = [
                {"$match": {"recipient_address": member["address"], "status": "completed"}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
            earnings_result = await db.commissions.aggregate(earnings_pipeline).to_list(1)
            total_earnings = earnings_result[0]["total"] if earnings_result else 0.0
            
            # Get sponsor info
            sponsor_info = None
            if member.get("referrer_address"):
                sponsor = await db.users.find_one({"address": member["referrer_address"]})
                if sponsor:
                    sponsor_info = {
                        "username": sponsor["username"],
                        "address": sponsor["address"]
                    }
            
            enriched_member = {
                "id": member["address"],  # Using address as ID
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
                "referral_code": member["referral_code"]
            }
            enriched_members.append(enriched_member)
        
        return {
            "members": enriched_members,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
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
                "suspended": member.get("suspended", False)
            },
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
                    
                    # Send notification to admin
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
        eligible_members = await db.users.find({
            "membership_tier": {"$in": ["bronze", "silver", "gold"]},
            "suspended": {"$ne": True}
        }).to_list(None)
        
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
        
        # Distribution logic: assign leads based on membership tier
        leads_per_member = {
            "bronze": 5,
            "silver": 8,
            "gold": 12
        }
        
        distributions_made = 0
        
        for member in eligible_members:
            member_tier = member.get("membership_tier", "bronze")
            max_leads_for_member = leads_per_member.get(member_tier, 5)
            
            # Get leads this member hasn't received yet
            existing_member_leads = await db.member_leads.find({
                "member_address": member["address"],
                "distribution_id": distribution_id
            }).to_list(None)
            
            existing_lead_ids = {ml["lead_id"] for ml in existing_member_leads}
            
            # Filter available leads excluding ones already assigned to this member
            member_available_leads = [
                lead for lead in available_leads 
                if lead["lead_id"] not in existing_lead_ids
            ]
            
            # Assign leads up to the member's limit
            leads_to_assign = member_available_leads[:max_leads_for_member]
            
            for lead in leads_to_assign:
                # Create member lead assignment
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
                    "downloaded_at": None
                }
                
                await db.member_leads.insert_one(member_lead_doc)
                
                # Increment distribution count for the lead
                await db.leads.update_one(
                    {"lead_id": lead["lead_id"]},
                    {"$inc": {"distribution_count": 1}}
                )
                
                distributions_made += 1
        
        # Mark distribution as completed
        await db.lead_distributions.update_one(
            {"distribution_id": distribution_id},
            {"$set": {
                "status": "completed",
                "processing_completed_at": datetime.utcnow(),
                "distributions_made": distributions_made
            }}
        )
        
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

# User endpoints for leads
@app.get("/api/users/leads")
async def get_user_leads(
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get leads assigned to the current user"""
    try:
        skip = (page - 1) * limit
        user_address = current_user["address"]
        
        # Get total count of user's leads
        total_count = await db.member_leads.count_documents({"member_address": user_address})
        
        # Get user's leads with pagination
        leads_cursor = db.member_leads.find({"member_address": user_address}).skip(skip).limit(limit).sort("assigned_at", -1)
        user_leads = await leads_cursor.to_list(length=None)
        
        # Format lead data
        formatted_leads = []
        for lead_assignment in user_leads:
            formatted_lead = {
                "assignment_id": lead_assignment["assignment_id"],
                "lead_name": lead_assignment["lead_name"],
                "lead_email": lead_assignment["lead_email"],
                "lead_address": lead_assignment["lead_address"],
                "assigned_at": lead_assignment["assigned_at"],
                "downloaded": lead_assignment.get("downloaded", False),
                "downloaded_at": lead_assignment.get("downloaded_at")
            }
            formatted_leads.append(formatted_lead)
        
        return {
            "leads": formatted_leads,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch user leads: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch leads")

@app.get("/api/users/leads/download")
async def download_user_leads_csv(current_user: dict = Depends(get_current_user)):
    """Download all assigned leads as CSV"""
    try:
        user_address = current_user["address"]
        
        # Get all user's leads
        user_leads = await db.member_leads.find({"member_address": user_address}).to_list(None)
        
        if not user_leads:
            raise HTTPException(status_code=404, detail="No leads assigned to you")
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(['Name', 'Email', 'Address', 'Assigned Date', 'Downloaded'])
        
        # Write lead data
        for lead_assignment in user_leads:
            writer.writerow([
                lead_assignment["lead_name"],
                lead_assignment["lead_email"],
                lead_assignment["lead_address"],
                lead_assignment["assigned_at"].strftime("%Y-%m-%d %H:%M:%S"),
                "Yes" if lead_assignment.get("downloaded", False) else "No"
            ])
        
        # Mark all leads as downloaded
        await db.member_leads.update_many(
            {"member_address": user_address, "downloaded": False},
            {"$set": {
                "downloaded": True,
                "downloaded_at": datetime.utcnow()
            }}
        )
        
        csv_content = output.getvalue()
        output.close()
        
        # Return CSV as streaming response
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=my_leads_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download user leads: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download leads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)