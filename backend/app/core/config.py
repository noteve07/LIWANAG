import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings and configuration."""
    
    # Supabase Configuration
    SUPABASE_URL: Optional[str] = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = os.environ.get("SUPABASE_KEY")
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "LIWANAG API"
    PROJECT_DESCRIPTION: str = "Backend for LIWANAG Sensor Data"
    
    # CORS Configuration
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",  # Alternative localhost
        "http://localhost:3000",  # For React default port
        "https://liwanag.vercel.app",  # Production frontend
        "https://liwanag-frontend.vercel.app",  # Alternative production frontend
        "*"  # Wildcard (remove in strict production)
    ]
    
    # Device Scheduler Configuration
    SCHEDULER_CHECK_INTERVAL_MINUTES: float = 0.5  
    SCHEDULER_TIMEOUT_MINUTES: int = 1 


# Global settings instance
settings = Settings()
