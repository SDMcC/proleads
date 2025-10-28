"""
FTP file storage utilities for cPanel hosting
"""
import os
import logging
from ftplib import FTP
from io import BytesIO
from typing import Optional
import urllib.parse

logger = logging.getLogger(__name__)

# FTP Configuration from environment variables
FTP_HOST = os.getenv("FTP_HOST")
FTP_PORT = int(os.getenv("FTP_PORT", "21"))
FTP_USERNAME = os.getenv("FTP_USERNAME")
FTP_PASSWORD = os.getenv("FTP_PASSWORD")
FTP_UPLOAD_DIR = os.getenv("FTP_UPLOAD_DIR", "/uploads")
FTP_PUBLIC_URL = os.getenv("FTP_PUBLIC_URL", "https://files.proleads.network/uploads")


def get_ftp_connection():
    """Create and return FTP connection"""
    try:
        if not all([FTP_HOST, FTP_USERNAME, FTP_PASSWORD]):
            logger.warning("FTP credentials not configured. File uploads will fail.")
            return None
        
        logger.info(f"Connecting to FTP server: {FTP_HOST}:{FTP_PORT}")
        ftp = FTP()
        ftp.set_debuglevel(0)  # Set to 2 for verbose debugging
        
        # Connect with timeout
        ftp.connect(FTP_HOST, FTP_PORT, timeout=30)
        logger.info("FTP connection established")
        
        # Login
        ftp.login(FTP_USERNAME, FTP_PASSWORD)
        logger.info("FTP login successful")
        
        # Enable passive mode (required by most hosting providers)
        ftp.set_pasv(True)
        logger.info("FTP passive mode enabled")
        
        # Change to upload directory
        try:
            ftp.cwd(FTP_UPLOAD_DIR)
            logger.info(f"Changed to directory: {FTP_UPLOAD_DIR}")
        except Exception as e:
            logger.warning(f"Could not change to directory {FTP_UPLOAD_DIR}: {str(e)}")
            # Try to create the directory
            try:
                ftp.mkd(FTP_UPLOAD_DIR)
                ftp.cwd(FTP_UPLOAD_DIR)
                logger.info(f"Created and changed to directory: {FTP_UPLOAD_DIR}")
            except Exception as e2:
                logger.error(f"Could not create directory: {str(e2)}")
        
        return ftp
    except Exception as e:
        logger.error(f"Failed to connect to FTP server {FTP_HOST}:{FTP_PORT}: {str(e)}")
        logger.error(f"FTP credentials - Host: {FTP_HOST}, User: {FTP_USERNAME}, Port: {FTP_PORT}")
        return None


async def upload_file_to_ftp(file_content: bytes, remote_path: str, content_type: str = "application/octet-stream") -> dict:
    """
    Upload file to FTP server
    
    Args:
        file_content: File content as bytes
        remote_path: Remote file path (e.g., 'kyc_documents/filename.jpg')
        content_type: MIME type of the file
        
    Returns:
        dict with status and public URL
    """
    ftp = None
    try:
        ftp = get_ftp_connection()
        if ftp is None:
            raise Exception("FTP connection failed")
        
        # Ensure directory exists
        directory = os.path.dirname(remote_path)
        if directory:
            # Create nested directories if needed
            current_dir = FTP_UPLOAD_DIR
            for folder in directory.split('/'):
                if folder:
                    try:
                        ftp.cwd(folder)
                        current_dir = f"{current_dir}/{folder}"
                    except:
                        try:
                            ftp.mkd(folder)
                            ftp.cwd(folder)
                            current_dir = f"{current_dir}/{folder}"
                        except Exception as e:
                            logger.warning(f"Could not create directory {folder}: {str(e)}")
        
        # Upload file
        filename = os.path.basename(remote_path)
        file_obj = BytesIO(file_content)
        ftp.storbinary(f'STOR {filename}', file_obj)
        
        # Generate public URL
        public_url = f"{FTP_PUBLIC_URL}/{remote_path}"
        
        logger.info(f"Successfully uploaded file to FTP: {remote_path}")
        return {
            "status": "success",
            "remote_path": remote_path,
            "public_url": public_url
        }
    except Exception as e:
        logger.error(f"Failed to upload file to FTP: {str(e)}")
        raise Exception(f"FTP upload failed: {str(e)}")
    finally:
        if ftp:
            try:
                ftp.quit()
            except:
                pass


async def download_file_from_ftp(remote_path: str) -> Optional[bytes]:
    """
    Download file from FTP server
    
    Args:
        remote_path: Remote file path (e.g., 'kyc_documents/filename.jpg')
        
    Returns:
        File content as bytes, or None if not found
    """
    ftp = None
    try:
        ftp = get_ftp_connection()
        if ftp is None:
            raise Exception("FTP connection failed")
        
        # Navigate to directory
        directory = os.path.dirname(remote_path)
        if directory:
            try:
                ftp.cwd(directory)
            except Exception as e:
                logger.warning(f"Directory not found: {directory}")
                return None
        
        # Download file
        filename = os.path.basename(remote_path)
        file_obj = BytesIO()
        
        try:
            ftp.retrbinary(f'RETR {filename}', file_obj.write)
            file_content = file_obj.getvalue()
            
            logger.info(f"Successfully downloaded file from FTP: {remote_path}")
            return file_content
        except Exception as e:
            logger.warning(f"File not found on FTP: {remote_path}")
            return None
            
    except Exception as e:
        logger.error(f"Error downloading from FTP: {str(e)}")
        return None
    finally:
        if ftp:
            try:
                ftp.quit()
            except:
                pass


def get_public_url(remote_path: str) -> str:
    """
    Get public URL for a file
    
    Args:
        remote_path: Remote file path (e.g., 'kyc_documents/filename.jpg')
        
    Returns:
        Public URL string
    """
    return f"{FTP_PUBLIC_URL}/{remote_path}"


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
