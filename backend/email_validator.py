"""
Email validation utilities using Rapid Email Verifier API
"""
import re
import httpx
import asyncio
from typing import Tuple, Dict, List
import logging

logger = logging.getLogger(__name__)

# Rapid Email Verifier API Configuration
RAPID_EMAIL_API_URL = "https://rapid-email-verifier.fly.dev/api"
BATCH_SIZE = 100  # API supports up to 100 emails per batch


def validate_email_format(email: str) -> Tuple[bool, str]:
    """
    Validate email format using regex
    Returns: (is_valid, error_message)
    """
    # Basic email regex pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not email:
        return False, "Email is empty"
    
    if not re.match(pattern, email):
        return False, "Invalid email format"
    
    # Check for common issues
    if email.count('@') != 1:
        return False, "Email must contain exactly one @"
    
    local_part, domain = email.split('@')
    
    if len(local_part) == 0 or len(local_part) > 64:
        return False, "Local part must be between 1 and 64 characters"
    
    if len(domain) == 0 or len(domain) > 255:
        return False, "Domain must be between 1 and 255 characters"
    
    # Check for consecutive dots
    if '..' in email:
        return False, "Email contains consecutive dots"
    
    # Check for valid characters
    if local_part.startswith('.') or local_part.endswith('.'):
        return False, "Local part cannot start or end with a dot"
    
    return True, ""


async def validate_email_api(email: str, timeout: int = 10) -> Dict:
    """
    Validate email using Rapid Email Verifier API
    Returns: validation result dict
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(
                f"{RAPID_EMAIL_API_URL}/validate",
                params={"email": email}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Email validation API error: {response.status_code}")
                return {
                    "valid": False,
                    "email": email,
                    "validations": {
                        "syntax": False
                    },
                    "status": "API_ERROR"
                }
    except Exception as e:
        logger.error(f"Email validation failed for {email}: {str(e)}")
        return {
            "valid": False,
            "email": email,
            "validations": {
                "syntax": False
            },
            "status": "VALIDATION_ERROR"
        }


async def validate_emails_batch(emails: List[str], timeout: int = 30) -> Dict:
    """
    Validate multiple emails using batch API
    Returns: batch validation results
    """
    try:
        # Split into batches of 100
        batches = [emails[i:i + BATCH_SIZE] for i in range(0, len(emails), BATCH_SIZE)]
        all_results = []
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            for batch in batches:
                response = await client.post(
                    f"{RAPID_EMAIL_API_URL}/validate/batch",
                    json={"emails": batch}
                )
                
                if response.status_code == 200:
                    batch_result = response.json()
                    all_results.extend(batch_result.get("results", []))
                else:
                    logger.error(f"Batch validation API error: {response.status_code}")
                    # Add error results for this batch
                    for email in batch:
                        all_results.append({
                            "email": email,
                            "valid": False,
                            "status": "API_ERROR"
                        })
        
        return {"results": all_results}
        
    except Exception as e:
        logger.error(f"Batch email validation failed: {str(e)}")
        return {
            "results": [
                {"email": email, "valid": False, "status": "VALIDATION_ERROR"}
                for email in emails
            ]
        }


async def validate_email_comprehensive(email: str, use_api: bool = True) -> Dict:
    """
    Comprehensive email validation
    Returns: {
        "valid": bool,
        "email": str,
        "checks": {
            "format": {"valid": bool, "message": str},
            "api": {"valid": bool, "status": str, "details": dict}
        }
    }
    """
    email = email.strip().lower()
    
    # Check format
    format_valid, format_message = validate_email_format(email)
    
    result = {
        "valid": format_valid,
        "email": email,
        "checks": {
            "format": {
                "valid": format_valid,
                "message": format_message or "Valid format"
            }
        }
    }
    
    # If format is valid and API validation requested
    if format_valid and use_api:
        api_result = await validate_email_api(email)
        result["checks"]["api"] = {
            "valid": api_result.get("valid", False),
            "status": api_result.get("status", "UNKNOWN"),
            "details": api_result.get("validations", {})
        }
        result["valid"] = api_result.get("valid", False)
    
    return result


async def analyze_csv_emails(emails: List[str], use_api: bool = True) -> Dict:
    """
    Analyze a list of emails from CSV
    Returns statistics and validation results
    """
    stats = {
        "total": len(emails),
        "valid": 0,
        "invalid_format": 0,
        "invalid_domain": 0,
        "disposable": 0,
        "role_based": 0
    }
    
    validation_results = []
    
    if use_api and len(emails) > 0:
        # Use batch API for efficiency
        batch_result = await validate_emails_batch(emails)
        
        for result in batch_result.get("results", []):
            email = result.get("email", "")
            valid = result.get("valid", False)
            status = result.get("status", "UNKNOWN")
            validations = result.get("validations", {})
            
            validation_results.append({
                "email": email,
                "valid": valid,
                "status": status,
                "is_disposable": validations.get("is_disposable", False),
                "is_role_based": validations.get("is_role_based", False),
                "checks": validations
            })
            
            if valid:
                stats["valid"] += 1
            elif not validations.get("syntax", False):
                stats["invalid_format"] += 1
            elif not validations.get("domain_exists", False):
                stats["invalid_domain"] += 1
            
            if validations.get("is_disposable", False):
                stats["disposable"] += 1
            if validations.get("is_role_based", False):
                stats["role_based"] += 1
    else:
        # Format-only validation
        for email in emails:
            format_valid, format_message = validate_email_format(email)
            validation_results.append({
                "email": email,
                "valid": format_valid,
                "status": "VALID" if format_valid else "INVALID_FORMAT",
                "checks": {
                    "format": {"valid": format_valid, "message": format_message}
                }
            })
            
            if format_valid:
                stats["valid"] += 1
            else:
                stats["invalid_format"] += 1
    
    return {
        "stats": stats,
        "validation_results": validation_results,
        "recommendation": "proceed" if stats["valid"] == stats["total"] else "review_invalid"
    }
