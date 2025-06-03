from fastapi import FastAPI, HTTPException, Depends, Request, WebSocket, WebSocketDisconnect, Header
from fastapi.middleware.cors import CORSMiddleware
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

# Membership tiers and commission rates
MEMBERSHIP_TIERS = {
    "affiliate": {"price": 0, "commissions": [0.25, 0.05]},
    "bronze": {"price": 20, "commissions": [0.25, 0.05, 0.03, 0.02]},
    "silver": {"price": 50, "commissions": [0.27, 0.10, 0.05, 0.03]},
    "gold": {"price": 100, "commissions": [0.30, 0.15, 0.10, 0.05]}
}

# Pydantic models
class UserRegistration(BaseModel):
    address: str
    username: str
    email: str
    referrer_code: Optional[str] = None

class NonceRequest(BaseModel):
    address: str

class VerifySignature(BaseModel):
    address: str
    signature: str

class PaymentRequest(BaseModel):
    tier: str
    currency: str = "BTC"

class PayoutRequest(BaseModel):
    address: str
    amount: float
    currency: str = "USDC"

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

# Utility functions
def generate_referral_code(address: str) -> str:
    """Generate unique referral code"""
    return f"REF{address[:6].upper()}{str(uuid.uuid4())[:8].upper()}"

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
                    "id": str(uuid.uuid4()),
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

# Authentication endpoints
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

# User management endpoints
@app.post("/api/users/register")
async def register_user(request: UserRegistration):
    """Register new user"""
    existing_user = await db.users.find_one({"address": request.address.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already registered")
    
    referral_code = generate_referral_code(request.address)
    referrer_address = None
    
    # Find referrer if code provided
    if request.referrer_code:
        referrer = await db.users.find_one({"referral_code": request.referrer_code})
        if referrer:
            referrer_address = referrer["address"]
    
    user_doc = {
        "address": request.address.lower(),
        "username": request.username,
        "email": request.email,
        "referral_code": referral_code,
        "referrer_address": referrer_address,
        "membership_tier": "affiliate",
        "total_earnings": 0.0,
        "total_referrals": 0,
        "created_at": datetime.utcnow(),
        "last_active": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    return {
        "message": "User registered successfully",
        "referral_code": referral_code,
        "membership_tier": "affiliate"
    }

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
        "referral_link": f"{APP_URL}?ref={current_user['referral_code']}"
    }

# Payment endpoints
@app.post("/api/payments/create")
async def create_payment(request: PaymentRequest, current_user: dict = Depends(get_current_user)):
    """Create payment for membership upgrade"""
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
        
        # Create payment with NOWPayments
        payment_data = {
            "price_amount": tier_info["price"],
            "price_currency": "USD",
            "pay_currency": request.currency,
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
            "id": commission.get("id"),
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
    
    return {
        "total_earnings": earnings_by_status.get("completed", 0),
        "pending_earnings": earnings_by_status.get("pending", 0) + earnings_by_status.get("processing", 0),
        "total_referrals": len(referrals),
        "direct_referrals": len([r for r in referrals if r.get("referrer_address") == current_user["address"]]),
        "recent_commissions": formatted_commissions,
        "referral_network": referrals
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)