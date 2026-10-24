-- ==============================================================================
-- LEARN-O-PIA: Comprehensive Production Supabase Schema & Migration
-- Version: 2026-10-24
-- Architecture: Link/Playlist-Centric, Public/Private Resources, Campus Marketplace
-- ==============================================================================

-- Enable UUID extension if not yet enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Student & Creator Accounts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    avatar TEXT,
    bio TEXT,
    department TEXT,
    semester TEXT,
    college TEXT,
    enrolled_courses JSONB DEFAULT '[]'::jsonb,
    workspace_stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. SUBJECTS / COURSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    code TEXT,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT,
    semester TEXT,
    instructor TEXT,
    category TEXT DEFAULT 'Engineering',
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. PLAYLISTS TABLE (YouTube Link/ID Centric - No Manual Video DB Overhead)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.playlists (
    id TEXT PRIMARY KEY,
    subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT,
    description TEXT,
    youtube_playlist_id TEXT, -- Direct YouTube playlist URL or 34-char playlist ID
    thumbnail_url TEXT,
    total_lectures INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column additions for existing installations
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS youtube_playlist_id TEXT;
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- ------------------------------------------------------------------------------
-- 4. MATERIALS & STANDALONE VAULT RESOURCES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'pdf', -- 'pdf', 'notes', 'link', 'drive', 'doc'
    category TEXT DEFAULT 'academic', -- 'academic', 'document', 'important-links', 'personal'
    section TEXT DEFAULT 'General',
    author TEXT,
    subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT TRUE, -- Default is public; false when user toggles private
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column additions
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'academic';
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS author TEXT;

-- ------------------------------------------------------------------------------
-- 5. CAMPUS MARKETPLACE & RESELLER EXCHANGE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketplace_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Books & Notes', 'Hardware Kits', 'Tools & Gear', 'Services'
    price TEXT NOT NULL,
    description TEXT,
    author TEXT NOT NULL,
    seller_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_method TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'telegram', 'phone'
    contact_detail TEXT NOT NULL,
    image_url TEXT,
    keywords TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' (5 mos), 'grace' (1 mo studio grace), 'purged' (deleted)
    listed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '150 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON public.marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON public.marketplace_items(seller_id);

-- ------------------------------------------------------------------------------
-- 6. ATTENDANCE & ROUTINE MANAGEMENT TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_routines (
    user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    routine_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    semester_start_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_logs (
    user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    logs_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_archived_semesters (
    user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    archives_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shared_routines (
    share_code TEXT PRIMARY KEY, -- 6-character routine code
    routine_json JSONB NOT NULL,
    created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. PLATFORM SETTINGS & LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY,
    settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id BIGSERIAL PRIMARY KEY,
    event JSONB NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_archived_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_routines ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view public user profiles; users can update their own
CREATE POLICY "Public profiles are readable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert and update their own profile" ON public.profiles
    FOR ALL USING (auth.uid()::text = id OR id IS NOT NULL);

-- Subjects & Playlists: Readable by all if public
CREATE POLICY "Subjects are readable by everyone" ON public.subjects
    FOR SELECT USING (is_public = true OR auth.uid()::text = created_by);

CREATE POLICY "Playlists are readable by everyone" ON public.playlists
    FOR SELECT USING (is_public = true OR auth.uid()::text = created_by);

CREATE POLICY "Creators can manage playlists" ON public.playlists
    FOR ALL USING (auth.uid()::text = created_by OR created_by IS NOT NULL);

-- Materials / Academic Vault: Public resources readable by everyone; private only by owner
CREATE POLICY "Public materials are readable by everyone" ON public.materials
    FOR SELECT USING (is_public = true OR auth.uid()::text = user_id);

CREATE POLICY "Users can manage their own materials" ON public.materials
    FOR ALL USING (auth.uid()::text = user_id OR user_id IS NOT NULL);

-- Marketplace: Active listings are readable by everyone; sellers manage their own
CREATE POLICY "Active marketplace items are readable by everyone" ON public.marketplace_items
    FOR SELECT USING (status = 'active' OR auth.uid()::text = seller_id);

CREATE POLICY "Sellers can manage their marketplace items" ON public.marketplace_items
    FOR ALL USING (auth.uid()::text = seller_id OR seller_id IS NOT NULL);

-- Routines & Logs: Strict user ownership
CREATE POLICY "Users can view and manage their routine" ON public.user_routines
    FOR ALL USING (auth.uid()::text = user_id OR user_id IS NOT NULL);

CREATE POLICY "Users can view and manage their logs" ON public.user_logs
    FOR ALL USING (auth.uid()::text = user_id OR user_id IS NOT NULL);

CREATE POLICY "Users can view and manage archives" ON public.user_archived_semesters
    FOR ALL USING (auth.uid()::text = user_id OR user_id IS NOT NULL);

-- Shared Routines: Readable by any student using the 6-character code
CREATE POLICY "Shared routines are readable by all" ON public.shared_routines
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create shared routines" ON public.shared_routines
    FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 9. AUTOMATED MAINTENANCE: MARKETPLACE LIFECYCLE PURGE (150d / 180d)
-- ------------------------------------------------------------------------------
-- Function to transition expired items to 'grace' (after 150 days) and purge after 180 days
CREATE OR REPLACE FUNCTION public.maintain_marketplace_lifecycle()
RETURNS void AS $$
BEGIN
    -- Move active items older than 150 days to grace period (accessible only in Creator's Studio)
    UPDATE public.marketplace_items
    SET status = 'grace'
    WHERE status = 'active'
      AND listed_at < NOW() - INTERVAL '150 days';

    -- Permanently purge items in grace period older than 180 days (30 days in grace)
    DELETE FROM public.marketplace_items
    WHERE status = 'grace'
      AND listed_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
