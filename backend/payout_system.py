"""
Instant Payout System for Affiliate Commissions
Handles automatic USDC distribution on Polygon network
"""
import os
import logging
import uuid
from typing import List, Dict, Optional
from decimal import Decimal
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from crypto_utils import PolygonWallet

logger = logging.getLogger(__name__)

# Configuration
COLD_WALLET_ADDRESS = os.getenv("COLD_WALLET_ADDRESS")
ESCROW_THRESHOLD_USD = Decimal("1000")  # Hold in escrow if total exceeds this


class PayoutSystem:
    """Manages instant USDC payouts to affiliates and profit to cold wallet"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.wallet = PolygonWallet()
        
    async def process_instant_payouts(
        self,
        payment_amount: Decimal,
        commissions: List[Dict],
        payment_id: str
    ) -> Dict:
        """
        Process instant payouts after payment is received
        
        Args:
            payment_amount: Total payment received (in USD/USDC)
            commissions: List of commission records with recipient_address and amount
            payment_id: Payment ID for tracking
            
        Returns:
            Dict with payout results
        """
        logger.info(f"Starting instant payout process for payment {payment_id}")
        logger.info(f"Total payment: ${payment_amount}, Commissions: {len(commissions)}")
        
        results = {
            "payment_id": payment_id,
            "total_payment": float(payment_amount),
            "commission_payouts": [],
            "profit_payout": None,
            "total_gas_cost": 0,
            "status": "pending",
            "errors": []
        }
        
        try:
            # Step 1: Verify hot wallet has sufficient balance
            hot_wallet_balance = await self.wallet.get_usdc_balance(self.wallet.address)
            logger.info(f"Hot wallet balance: ${hot_wallet_balance} USDC")
            
            if hot_wallet_balance < payment_amount:
                error_msg = f"Insufficient hot wallet balance: ${hot_wallet_balance} < ${payment_amount}"
                logger.error(error_msg)
                results["status"] = "failed"
                results["errors"].append(error_msg)
                
                # Create escrow record
                await self._create_escrow_record(
                    payment_id=payment_id,
                    amount=payment_amount,
                    reason="Insufficient hot wallet balance",
                    commissions=commissions
                )
                return results
            
            # Step 2: Calculate total commission amount and profit
            total_commissions = sum(Decimal(str(c["amount"])) for c in commissions)
            profit_amount = payment_amount - total_commissions
            
            logger.info(f"Total commissions: ${total_commissions}, Profit: ${profit_amount}")
            
            # Step 3: Send commission payouts sequentially (max 4 transactions)
            for idx, commission in enumerate(commissions, 1):
                recipient_address = commission["recipient_address"]
                commission_amount = Decimal(str(commission["amount"]))
                commission_id = commission["commission_id"]
                
                logger.info(f"Processing payout {idx}/{len(commissions)}: ${commission_amount} to {recipient_address}")
                
                # Validate recipient address
                if not self.wallet.is_valid_address(recipient_address):
                    error_msg = f"Invalid recipient address for commission {commission_id}: {recipient_address}"
                    logger.error(error_msg)
                    results["errors"].append(error_msg)
                    
                    # Hold in escrow
                    await self._create_escrow_record(
                        payment_id=payment_id,
                        amount=commission_amount,
                        reason=f"Invalid wallet address: {recipient_address}",
                        commissions=[commission]
                    )
                    
                    # Update commission status
                    await self.db.commissions.update_one(
                        {"commission_id": commission_id},
                        {
                            "$set": {
                                "status": "escrow",
                                "escrow_reason": "Invalid wallet address",
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
                    
                    results["commission_payouts"].append({
                        "commission_id": commission_id,
                        "recipient_address": recipient_address,
                        "amount": float(commission_amount),
                        "status": "escrow",
                        "reason": "Invalid address"
                    })
                    continue
                
                # Send USDC transaction
                try:
                    tx_result = await self.wallet.send_usdc(
                        to_address=recipient_address,
                        amount=commission_amount,
                        gas_price_multiplier=1.2  # Faster confirmation
                    )
                    
                    if tx_result["success"]:
                        # Update commission status to completed
                        await self.db.commissions.update_one(
                            {"commission_id": commission_id},
                            {
                                "$set": {
                                    "status": "completed",
                                    "payout_tx_hash": tx_result["tx_hash"],
                                    "payout_timestamp": datetime.utcnow(),
                                    "gas_used": tx_result.get("gas_used", 0),
                                    "updated_at": datetime.utcnow()
                                }
                            }
                        )
                        
                        results["total_gas_cost"] += tx_result.get("gas_used", 0)
                        results["commission_payouts"].append({
                            "commission_id": commission_id,
                            "recipient_address": recipient_address,
                            "amount": float(commission_amount),
                            "status": "completed",
                            "tx_hash": tx_result["tx_hash"],
                            "gas_used": tx_result.get("gas_used", 0)
                        })
                        
                        logger.info(f"✅ Commission payout successful: ${commission_amount} to {recipient_address}")
                    else:
                        # Transaction failed - hold in escrow
                        error_msg = f"Transaction failed: {tx_result.get('error', 'Unknown error')}"
                        logger.error(f"❌ Commission payout failed: {error_msg}")
                        results["errors"].append(error_msg)
                        
                        await self._create_escrow_record(
                            payment_id=payment_id,
                            amount=commission_amount,
                            reason=error_msg,
                            commissions=[commission]
                        )
                        
                        await self.db.commissions.update_one(
                            {"commission_id": commission_id},
                            {
                                "$set": {
                                    "status": "escrow",
                                    "escrow_reason": error_msg,
                                    "updated_at": datetime.utcnow()
                                }
                            }
                        )
                        
                        results["commission_payouts"].append({
                            "commission_id": commission_id,
                            "recipient_address": recipient_address,
                            "amount": float(commission_amount),
                            "status": "escrow",
                            "reason": error_msg
                        })
                        
                except Exception as e:
                    error_msg = f"Exception during payout: {str(e)}"
                    logger.error(f"❌ Exception: {error_msg}")
                    results["errors"].append(error_msg)
                    
                    await self._create_escrow_record(
                        payment_id=payment_id,
                        amount=commission_amount,
                        reason=error_msg,
                        commissions=[commission]
                    )
                    
                    await self.db.commissions.update_one(
                        {"commission_id": commission_id},
                        {
                            "$set": {
                                "status": "escrow",
                                "escrow_reason": error_msg,
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
                    
                    results["commission_payouts"].append({
                        "commission_id": commission_id,
                        "recipient_address": recipient_address,
                        "amount": float(commission_amount),
                        "status": "escrow",
                        "reason": error_msg
                    })
            
            # Step 4: Send profit to cold wallet
            if profit_amount > Decimal("0.01"):  # Only send if > 1 cent
                logger.info(f"Sending profit to cold wallet: ${profit_amount} to {COLD_WALLET_ADDRESS}")
                
                try:
                    profit_tx = await self.wallet.send_usdc(
                        to_address=COLD_WALLET_ADDRESS,
                        amount=profit_amount,
                        gas_price_multiplier=1.1
                    )
                    
                    if profit_tx["success"]:
                        results["profit_payout"] = {
                            "amount": float(profit_amount),
                            "to_address": COLD_WALLET_ADDRESS,
                            "status": "completed",
                            "tx_hash": profit_tx["tx_hash"],
                            "gas_used": profit_tx.get("gas_used", 0)
                        }
                        results["total_gas_cost"] += profit_tx.get("gas_used", 0)
                        logger.info(f"✅ Profit payout successful: ${profit_amount}")
                    else:
                        error_msg = f"Profit transfer failed: {profit_tx.get('error', 'Unknown')}"
                        logger.error(f"❌ {error_msg}")
                        results["profit_payout"] = {
                            "amount": float(profit_amount),
                            "status": "failed",
                            "reason": error_msg
                        }
                        results["errors"].append(error_msg)
                        
                except Exception as e:
                    error_msg = f"Exception during profit transfer: {str(e)}"
                    logger.error(f"❌ {error_msg}")
                    results["profit_payout"] = {
                        "amount": float(profit_amount),
                        "status": "failed",
                        "reason": error_msg
                    }
                    results["errors"].append(error_msg)
            
            # Step 5: Determine overall status
            successful_commissions = [p for p in results["commission_payouts"] if p["status"] == "completed"]
            if len(successful_commissions) == len(commissions) and results.get("profit_payout", {}).get("status") == "completed":
                results["status"] = "completed"
            elif len(successful_commissions) > 0:
                results["status"] = "partial"
            else:
                results["status"] = "failed"
            
            logger.info(f"Payout process complete. Status: {results['status']}")
            return results
            
        except Exception as e:
            logger.error(f"Critical error in payout process: {str(e)}")
            results["status"] = "error"
            results["errors"].append(str(e))
            return results
    
    async def _create_escrow_record(
        self,
        payment_id: str,
        amount: Decimal,
        reason: str,
        commissions: List[Dict]
    ):
        """Create an escrow record for failed payouts"""
        try:
            escrow_doc = {
                "escrow_id": str(uuid.uuid4()),
                "payment_id": payment_id,
                "amount": float(amount),
                "reason": reason,
                "status": "pending_review",
                "commissions": commissions,
                "created_at": datetime.utcnow()
            }
            
            await self.db.escrow.insert_one(escrow_doc)
            logger.info(f"Escrow record created: ${amount} - {reason}")
            
        except Exception as e:
            logger.error(f"Failed to create escrow record: {str(e)}")


async def initiate_instant_payout(
    db: AsyncIOMotorDatabase,
    payment_amount: Decimal,
    new_member_address: str,
    new_member_tier: str,
    payment_id: str
) -> Dict:
    """
    Main entry point for instant payout system
    
    Called after PayGate.to payment is confirmed
    """
    try:
        # Calculate commissions using existing logic
        from server import calculate_commissions
        
        commissions = await calculate_commissions(
            new_member_address=new_member_address,
            new_member_tier=new_member_tier,
            new_member_amount=float(payment_amount)
        )
        
        if not commissions:
            logger.info(f"No commissions to pay out for payment {payment_id}")
            return {
                "status": "no_commissions",
                "payment_id": payment_id
            }
        
        # Process payouts
        payout_system = PayoutSystem(db)
        results = await payout_system.process_instant_payouts(
            payment_amount=payment_amount,
            commissions=commissions,
            payment_id=payment_id
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Failed to initiate instant payout: {str(e)}")
        return {
            "status": "error",
            "payment_id": payment_id,
            "error": str(e)
        }
