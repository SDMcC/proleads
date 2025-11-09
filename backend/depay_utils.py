"""
DePay Integration Utilities
Handles signature verification and payment processing for DePay widgets
"""
import os
import base64
import logging
from typing import Dict, Optional
from dotenv import load_dotenv
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidSignature

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# DePay Configuration
DEPAY_PUBLIC_KEY = os.getenv("DEPAY_PUBLIC_KEY")
DEPAY_INTEGRATION_ID = os.getenv("DEPAY_INTEGRATION_ID")
OUR_PRIVATE_KEY = os.getenv("OUR_PRIVATE_KEY")

# USDC on Polygon
USDC_POLYGON_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"


def sign_response(data: str) -> str:
    """
    Sign a response body with our private key for DePay
    
    Args:
        data: JSON string to sign (without line breaks or unnecessary whitespace)
        
    Returns:
        Base64 URL-safe encoded signature
    """
    try:
        if not OUR_PRIVATE_KEY:
            logger.error("OUR_PRIVATE_KEY not configured")
            return ""
        
        # Load private key
        private_key = serialization.load_pem_private_key(
            OUR_PRIVATE_KEY.encode('utf-8'),
            password=None,
            backend=default_backend()
        )
        
        # Sign the data using RSA-PSS with SHA256 and salt length 64
        signature = private_key.sign(
            data.encode('utf-8'),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=64
            ),
            hashes.SHA256()
        )
        
        # Encode to base64 URL-safe format
        signature_b64 = base64.urlsafe_b64encode(signature).decode('utf-8')
        # Remove padding
        signature_b64 = signature_b64.rstrip('=')
        
        logger.info("Response signed successfully")
        return signature_b64
        
    except Exception as e:
        logger.error(f"Failed to sign response: {str(e)}")
        return ""


def verify_depay_signature(signature: str, payload: bytes) -> bool:
    """
    Verify DePay webhook signature using RSA-PSS with SHA256
    
    Args:
        signature: Base64 URL-encoded signature from x-signature header
        payload: Raw request body bytes
        
    Returns:
        True if signature is valid, False otherwise
    """
    try:
        if not DEPAY_PUBLIC_KEY:
            logger.error("DEPAY_PUBLIC_KEY not configured")
            return False
        
        # Load public key (dotenv handles newline conversion automatically)
        public_key = serialization.load_pem_public_key(
            DEPAY_PUBLIC_KEY.encode('utf-8'),
            backend=default_backend()
        )
        
        # Decode signature from base64 URL encoding
        # Replace URL-safe characters with standard base64 characters
        signature_standard = signature.replace('-', '+').replace('_', '/')
        # Add padding if needed
        padding_needed = len(signature_standard) % 4
        if padding_needed:
            signature_standard += '=' * (4 - padding_needed)
        
        signature_bytes = base64.b64decode(signature_standard)
        
        # Verify signature using RSA-PSS with SHA256 and salt length 64
        public_key.verify(
            signature_bytes,
            payload,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=64
            ),
            hashes.SHA256()
        )
        
        logger.info("DePay signature verification successful")
        return True
        
    except InvalidSignature:
        logger.error("DePay signature verification failed: Invalid signature")
        return False
    except Exception as e:
        logger.error(f"DePay signature verification error: {str(e)}")
        return False


def create_payment_configuration(
    amount: float,
    receiver_address: str,
    user_email: str = None,
    user_address: str = None
) -> Dict:
    """
    Create DePay payment configuration for dynamic endpoint
    
    Args:
        amount: Payment amount in USD
        receiver_address: Hot wallet address to receive payment
        user_email: User's email (optional)
        user_address: User's wallet address (optional)
        
    Returns:
        DePay configuration dictionary
    """
    config = {
        "accept": [
            {
                "blockchain": "polygon",
                "amount": amount,
                "token": USDC_POLYGON_ADDRESS,
                "receiver": receiver_address
            }
        ]
    }
    
    # Add optional forward_to URL for post-payment redirect
    # This will be handled by the callback webhook
    
    logger.info(f"Created DePay configuration: {amount} USDC to {receiver_address}")
    return config


def parse_depay_callback(payload: Dict) -> Optional[Dict]:
    """
    Parse DePay callback payload and extract payment information
    
    Args:
        payload: DePay callback JSON payload
        
    Returns:
        Parsed payment data or None if invalid
    """
    try:
        # DePay callback structure (based on documentation)
        # {
        #   "status": "success" | "failed" | "pending",
        #   "transaction": "0x...",
        #   "blockchain": "polygon",
        #   "token": "0x...",
        #   "amount": "20000000", // Raw amount (6 decimals for USDC)
        #   "receiver": "0x...",
        #   "sender": "0x...",
        #   "payload": { ... } // Custom payload we sent
        # }
        
        status = payload.get("status")
        transaction = payload.get("transaction")
        blockchain = payload.get("blockchain")
        token = payload.get("token")
        raw_amount = payload.get("amount")
        receiver = payload.get("receiver")
        sender = payload.get("sender")
        custom_payload = payload.get("payload", {})
        
        # Convert USDC amount (6 decimals)
        if raw_amount:
            amount_usdc = float(raw_amount) / 1_000_000
        else:
            amount_usdc = 0
        
        parsed = {
            "status": status,
            "transaction_hash": transaction,
            "blockchain": blockchain,
            "token": token,
            "amount": amount_usdc,
            "receiver": receiver,
            "sender": sender,
            "payment_id": custom_payload.get("payment_id"),
            "user_address": custom_payload.get("user_address"),
            "tier": custom_payload.get("tier")
        }
        
        logger.info(f"Parsed DePay callback: {status} - {amount_usdc} USDC - TX: {transaction}")
        return parsed
        
    except Exception as e:
        logger.error(f"Failed to parse DePay callback: {str(e)}")
        return None
