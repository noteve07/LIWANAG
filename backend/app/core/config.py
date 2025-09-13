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
    ALLOWED_ORIGINS: list = ["*"]  # For development, restrict in production


# Global settings instance
settings = Settings()
