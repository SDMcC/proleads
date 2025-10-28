"""
AWS S3 utility functions for file storage
"""
import boto3
import os
import logging
from botocore.exceptions import ClientError
from typing import Optional

logger = logging.getLogger(__name__)

# S3 Configuration from environment variables
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION", "eu-north-1")

# Initialize S3 client
s3_client = None

def get_s3_client():
    """Get or create S3 client"""
    global s3_client
    if s3_client is None:
        if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET]):
            logger.warning("S3 credentials not configured. File uploads will fail.")
            return None
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
    return s3_client


async def upload_file_to_s3(file_content: bytes, object_name: str, content_type: str = "application/octet-stream") -> dict:
    """
    Upload file to S3 bucket
    
    Args:
        file_content: File content as bytes
        object_name: S3 object key/path (e.g., 'kyc_documents/filename.jpg')
        content_type: MIME type of the file
        
    Returns:
        dict with status and S3 key
    """
    try:
        client = get_s3_client()
        if client is None:
            raise Exception("S3 client not configured")
        
        client.put_object(
            Bucket=AWS_S3_BUCKET,
            Key=object_name,
            Body=file_content,
            ContentType=content_type,
            ServerSideEncryption='AES256'
        )
        
        logger.info(f"Successfully uploaded file to S3: {object_name}")
        return {
            "status": "success",
            "s3_key": object_name,
            "bucket": AWS_S3_BUCKET
        }
    except ClientError as e:
        logger.error(f"Failed to upload file to S3: {str(e)}")
        raise Exception(f"S3 upload failed: {str(e)}")
    except Exception as e:
        logger.error(f"Error uploading to S3: {str(e)}")
        raise


async def download_file_from_s3(object_name: str) -> Optional[bytes]:
    """
    Download file from S3 bucket
    
    Args:
        object_name: S3 object key/path
        
    Returns:
        File content as bytes, or None if not found
    """
    try:
        client = get_s3_client()
        if client is None:
            raise Exception("S3 client not configured")
        
        response = client.get_object(Bucket=AWS_S3_BUCKET, Key=object_name)
        file_content = response['Body'].read()
        
        logger.info(f"Successfully downloaded file from S3: {object_name}")
        return file_content
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code')
        if error_code == 'NoSuchKey':
            logger.warning(f"File not found in S3: {object_name}")
            return None
        logger.error(f"Failed to download file from S3: {str(e)}")
        raise Exception(f"S3 download failed: {str(e)}")
    except Exception as e:
        logger.error(f"Error downloading from S3: {str(e)}")
        raise


async def generate_presigned_url(object_name: str, expiration: int = 3600) -> Optional[str]:
    """
    Generate a presigned URL for S3 object
    
    Args:
        object_name: S3 object key/path
        expiration: URL expiration time in seconds (default 1 hour)
        
    Returns:
        Presigned URL string, or None if failed
    """
    try:
        client = get_s3_client()
        if client is None:
            raise Exception("S3 client not configured")
        
        url = client.generate_presigned_url(
            'get_object',
            Params={'Bucket': AWS_S3_BUCKET, 'Key': object_name},
            ExpiresIn=expiration
        )
        
        return url
    except ClientError as e:
        logger.error(f"Failed to generate presigned URL: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Error generating presigned URL: {str(e)}")
        return None


def get_content_type(filename: str) -> str:
    """Get content type based on file extension"""
    ext = filename.lower().split('.')[-1]
    content_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
    }
    return content_types.get(ext, 'application/octet-stream')
