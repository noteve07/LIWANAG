from supabase import create_client, Client
from .config import settings


def get_supabase_client() -> Client:
    """Get Supabase client instance."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise ValueError("Supabase URL and KEY must be set in environment variables")
    
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


# Global client instance
supabase: Client = get_supabase_client()
