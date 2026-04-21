from supabase import create_client, Client
from app.core.config import settings

# Admin client (service role key) — bypasses RLS for server-side operations
def get_supabase_admin() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

# Anon client — respects RLS
def get_supabase_anon() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
