#!/usr/bin/env python3
"""
Startup wrapper for FastAPI backend
Ensures proper Python path configuration for module imports
"""
import sys
import os

# Add parent directory to Python path so 'backend' module can be imported
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Now import and run the FastAPI app
if __name__ == "__main__":
    import uvicorn
    from backend.server import app
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        workers=1
    )
