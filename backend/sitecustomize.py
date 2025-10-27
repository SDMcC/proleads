"""
Site customization module - automatically imported by Python on startup
This adds the parent directory to sys.path to enable proper module imports
"""
import sys
import os

# Add parent directory to Python path
# This allows 'backend.server' to be imported when running from /app/backend
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
