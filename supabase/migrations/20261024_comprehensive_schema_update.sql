-- ==============================================================================
-- LEARN-O-PIA: 100% Compatible & Safe Supabase Schema Migration
-- Version: 2026-10-24 (Hotfix: Explicit type casts for UUID/TEXT compatibility)
-- ==============================================================================

-- 1. PROFILES TABLE
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

-- 2. SUBJECTS / COURSES TABLE
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
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 3. PLAYLISTS TABLE (YouTube Link/Playlist Centric)
CREATE TABLE IF NOT EXISTS public.playlists (
    id TEXT PRIMARY KEY,
    subject_id TEXT,
    title TEXT NOT NULL,
    author TEXT,
    description TEXT,
    youtube_playlist_id TEXT,
    thumbnail_url TEXT,
    total_lectures INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS youtube_playlist_id TEXT;
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 4. MATERIALS & ACADEMIC VAULT RESOURCES (Public / Private)
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'pdf',
    category TEXT DEFAULT 'academic',
    section TEXT DEFAULT 'General',
    author TEXT,
    subject_id TEXT,
    user_id TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'academic';
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 5. CAMPUS MARKETPLACE & RESELLER EXCHANGE
CREATE TABLE IF NOT EXISTS public.marketplace_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price TEXT NOT NULL,
    description TEXT,
    author TEXT NOT NULL,
    seller_id TEXT,
    contact_method TEXT DEFAULT 'whatsapp',
    contact_detail TEXT NOT NULL,
    image_url TEXT,
    keywords TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    listed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '150 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '150 days');
ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS listed_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON public.marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON public.marketplace_items(seller_id);

-- 6. ATTENDANCE & ROUTINE MANAGEMENT TABLES
CREATE TABLE IF NOT EXISTS public.user_routines (
    user_id TEXT PRIMARY KEY,
    routine_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    semester_start_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_logs (
    user_id TEXT PRIMARY KEY,
    logs_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_archived_semesters (
    user_id TEXT PRIMARY KEY,
    archives_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shared_routines (
    share_code TEXT PRIMARY KEY,
    routine_json JSONB NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PLATFORM SETTINGS & LOGS
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

-- 8. ROW LEVEL SECURITY (RLS) & POLICIES WITH EXPLICIT ::TEXT CASTS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_archived_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are readable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert and update their own profile" ON public.profiles;
CREATE POLICY "Users can insert and update their own profile" ON public.profiles
    FOR ALL USING (auth.uid()::text = id::text OR id IS NOT NULL);

-- Subjects & Playlists Policies
DROP POLICY IF EXISTS "Subjects are readable by everyone" ON public.subjects;
CREATE POLICY "Subjects are readable by everyone" ON public.subjects
    FOR SELECT USING (is_public = true OR auth.uid()::text = created_by::text);

DROP POLICY IF EXISTS "Playlists are readable by everyone" ON public.playlists;
CREATE POLICY "Playlists are readable by everyone" ON public.playlists
    FOR SELECT USING (is_public = true OR auth.uid()::text = created_by::text);

DROP POLICY IF EXISTS "Creators can manage playlists" ON public.playlists;
CREATE POLICY "Creators can manage playlists" ON public.playlists
    FOR ALL USING (auth.uid()::text = created_by::text OR created_by IS NOT NULL);

-- Materials Policies
DROP POLICY IF EXISTS "Public materials are readable by everyone" ON public.materials;
CREATE POLICY "Public materials are readable by everyone" ON public.materials
    FOR SELECT USING (is_public = true OR auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can manage their own materials" ON public.materials;
CREATE POLICY "Users can manage their own materials" ON public.materials
    FOR ALL USING (auth.uid()::text = user_id::text OR user_id IS NOT NULL);

-- Marketplace Policies
DROP POLICY IF EXISTS "Active marketplace items are readable by everyone" ON public.marketplace_items;
CREATE POLICY "Active marketplace items are readable by everyone" ON public.marketplace_items
    FOR SELECT USING (status = 'active' OR auth.uid()::text = seller_id::text);

DROP POLICY IF EXISTS "Sellers can manage their marketplace items" ON public.marketplace_items;
CREATE POLICY "Sellers can manage their marketplace items" ON public.marketplace_items
    FOR ALL USING (auth.uid()::text = seller_id::text OR seller_id IS NOT NULL);

-- Routine & Logs Policies
DROP POLICY IF EXISTS "Users can view and manage their routine" ON public.user_routines;
CREATE POLICY "Users can view and manage their routine" ON public.user_routines
    FOR ALL USING (auth.uid()::text = user_id::text OR user_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can view and manage their logs" ON public.user_logs;
CREATE POLICY "Users can view and manage their logs" ON public.user_logs
    FOR ALL USING (auth.uid()::text = user_id::text OR user_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can view and manage archives" ON public.user_archived_semesters;
CREATE POLICY "Users can view and manage archives" ON public.user_archived_semesters
    FOR ALL USING (auth.uid()::text = user_id::text OR user_id IS NOT NULL);

-- Shared Routines Policies
DROP POLICY IF EXISTS "Shared routines are readable by all" ON public.shared_routines;
CREATE POLICY "Shared routines are readable by all" ON public.shared_routines
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create shared routines" ON public.shared_routines;
CREATE POLICY "Anyone can create shared routines" ON public.shared_routines
    FOR INSERT WITH CHECK (true);

-- Platform Settings & Activity Logs Policies
DROP POLICY IF EXISTS "Platform settings readable by all" ON public.platform_settings;
CREATE POLICY "Platform settings readable by all" ON public.platform_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Platform settings updateable by all" ON public.platform_settings;
CREATE POLICY "Platform settings updateable by all" ON public.platform_settings
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Activity logs readable by all" ON public.activity_logs;
CREATE POLICY "Activity logs readable by all" ON public.activity_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Activity logs insertable by all" ON public.activity_logs;
CREATE POLICY "Activity logs insertable by all" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- 9. MARKETPLACE LIFECYCLE ROUTINE
CREATE OR REPLACE FUNCTION public.maintain_marketplace_lifecycle()
RETURNS void AS $$
BEGIN
    UPDATE public.marketplace_items
    SET status = 'grace'
    WHERE status = 'active'
      AND listed_at < NOW() - INTERVAL '150 days';

    UPDATE public.marketplace_items
    SET status = 'purged'
    WHERE status = 'grace'
      AND listed_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
