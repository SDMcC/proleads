"""
Cryptocurrency utility functions for Polygon USDC transactions
"""
import os
import logging
from typing import Optional, Dict
from decimal import Decimal
from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account
import re

logger = logging.getLogger(__name__)

# Polygon mainnet configuration
POLYGON_RPC_URL = "https://polygon-rpc.com"
USDC_CONTRACT_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"  # USDC on Polygon
CHAIN_ID = 137  # Polygon mainnet

# USDC Token ABI (ERC-20 standard methods we need)
USDC_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": False,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    }
]


class PolygonWallet:
    """Manage Polygon USDC transactions"""
    
    def __init__(self, private_key: Optional[str] = None):
        """Initialize wallet with private key from environment or parameter"""
        self.w3 = Web3(Web3.HTTPProvider(POLYGON_RPC_URL))
        
        # Add POA middleware for Polygon
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Check connection
        if not self.w3.is_connected():
            raise Exception("Failed to connect to Polygon network")
        
        # Load hot wallet private key
        self.private_key = private_key or os.getenv("HOT_WALLET_PRIVATE_KEY")
        if not self.private_key:
            logger.warning("No hot wallet private key configured")
            self.account = None
            self.address = None
        else:
            # Remove '0x' prefix if present
            if self.private_key.startswith('0x'):
                self.private_key = self.private_key[2:]
            
            try:
                self.account = Account.from_key(self.private_key)
                self.address = self.account.address
                logger.info(f"Hot wallet initialized: {self.address}")
            except Exception as e:
                logger.error(f"Failed to initialize hot wallet: {str(e)}")
                raise
        
        # Initialize USDC contract
        self.usdc_contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(USDC_CONTRACT_ADDRESS),
            abi=USDC_ABI
        )
    
    @staticmethod
    def is_valid_address(address: str) -> bool:
        """Validate Ethereum/Polygon address format"""
        if not address:
            return False
        
        # Check if it matches Ethereum address pattern (0x + 40 hex characters)
        if not re.match(r'^0x[a-fA-F0-9]{40}$', address):
            return False
        
        # Check if it's a valid checksum address
        try:
            Web3.to_checksum_address(address)
            return True
        except Exception:
            return False
    
    async def get_usdc_balance(self, address: str) -> Decimal:
        """Get USDC balance for an address"""
        try:
            checksum_address = Web3.to_checksum_address(address)
            balance_wei = self.usdc_contract.functions.balanceOf(checksum_address).call()
            
            # USDC has 6 decimals on Polygon
            balance_usdc = Decimal(balance_wei) / Decimal(10 ** 6)
            return balance_usdc
        except Exception as e:
            logger.error(f"Failed to get USDC balance for {address}: {str(e)}")
            return Decimal(0)
    
    async def send_usdc(
        self,
        to_address: str,
        amount: Decimal,
        gas_price_multiplier: float = 1.1
    ) -> Dict:
        """
        Send USDC to an address
        
        Args:
            to_address: Recipient address
            amount: Amount in USDC (will be converted to 6 decimals)
            gas_price_multiplier: Multiply gas price for faster confirmation
            
        Returns:
            Dict with transaction hash and status
        """
        if not self.account:
            raise Exception("Hot wallet not configured")
        
        # Validate recipient address
        if not self.is_valid_address(to_address):
            raise ValueError(f"Invalid recipient address: {to_address}")
        
        try:
            checksum_to = Web3.to_checksum_address(to_address)
            
            # Convert amount to wei (6 decimals for USDC)
            amount_wei = int(amount * Decimal(10 ** 6))
            
            # Get current gas price
            gas_price = self.w3.eth.gas_price
            adjusted_gas_price = int(gas_price * gas_price_multiplier)
            
            # Get nonce
            nonce = self.w3.eth.get_transaction_count(self.address)
            
            # Build transaction
            transaction = self.usdc_contract.functions.transfer(
                checksum_to,
                amount_wei
            ).build_transaction({
                'chainId': CHAIN_ID,
                'gas': 100000,  # USDC transfer typically uses ~65k gas
                'gasPrice': adjusted_gas_price,
                'nonce': nonce,
            })
            
            # Sign transaction
            signed_txn = self.account.sign_transaction(transaction)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            logger.info(f"USDC transfer initiated: {amount} USDC to {to_address}, tx: {tx_hash.hex()}")
            
            # Wait for receipt (with timeout)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt['status'] == 1:
                logger.info(f"USDC transfer successful: {tx_hash.hex()}")
                return {
                    "success": True,
                    "tx_hash": tx_hash.hex(),
                    "to_address": to_address,
                    "amount": float(amount),
                    "gas_used": receipt['gasUsed'],
                    "block_number": receipt['blockNumber']
                }
            else:
                logger.error(f"USDC transfer failed: {tx_hash.hex()}")
                return {
                    "success": False,
                    "tx_hash": tx_hash.hex(),
                    "error": "Transaction reverted"
                }
                
        except Exception as e:
            logger.error(f"Failed to send USDC to {to_address}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "to_address": to_address,
                "amount": float(amount)
            }
    
    async def estimate_gas_cost(self) -> Dict:
        """Estimate current gas cost for a USDC transfer"""
        try:
            gas_price = self.w3.eth.gas_price
            gas_limit = 100000  # Typical USDC transfer
            
            # Cost in MATIC
            cost_wei = gas_price * gas_limit
            cost_matic = Decimal(cost_wei) / Decimal(10 ** 18)
            
            # Convert to USD (approximate, you'd need a price oracle for real-time)
            # For now, just return MATIC cost
            return {
                "gas_price_gwei": float(Decimal(gas_price) / Decimal(10 ** 9)),
                "estimated_gas": gas_limit,
                "cost_matic": float(cost_matic),
                "cost_usd_estimate": float(cost_matic * Decimal("0.50"))  # Rough estimate
            }
        except Exception as e:
            logger.error(f"Failed to estimate gas cost: {str(e)}")
            return {
                "gas_price_gwei": 0,
                "estimated_gas": 100000,
                "cost_matic": 0,
                "cost_usd_estimate": 0
            }


async def validate_wallet_address(address: str) -> bool:
    """Validate if address is a valid Ethereum/Polygon address"""
    return PolygonWallet.is_valid_address(address)


async def get_hot_wallet_balance() -> Decimal:
    """Get current balance of hot wallet"""
    try:
        wallet = PolygonWallet()
        if wallet.address:
            return await wallet.get_usdc_balance(wallet.address)
        return Decimal(0)
    except Exception as e:
        logger.error(f"Failed to get hot wallet balance: {str(e)}")
        return Decimal(0)
