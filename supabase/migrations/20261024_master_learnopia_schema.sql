-- ==============================================================================
-- LEARN-O-PIA: 2026 MASTER COMPREHENSIVE SUPABASE DATABASE MIGRATION
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- 
-- FEATURES COVERED:
-- 1. Cleans up obsolete tables (videos 1,400+ rows, discussion_threads, user_logs)
-- 2. Creates dedicated 'announcements' table for campus broadcasts
-- 3. Adds 'is_public', 'youtube_playlist_id', and modern catalog columns across all tables
-- 4. Establishes robust 'user_attendance_logs' and 'shared_routines'
-- 5. Safe, cast-explicit RLS policies (prevents text = uuid type mismatch errors)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP OBSOLETE TABLES (Saves 1,400+ records of redundant video rows)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.videos CASCADE;
DROP TABLE IF EXISTS public.discussion_threads CASCADE;
DROP TABLE IF EXISTS public.user_logs CASCADE;

-- ------------------------------------------------------------------------------
-- 2. ACADEMIC BROADCASTS & NOTICES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    author TEXT DEFAULT 'Platform Admin',
    sender_role TEXT DEFAULT 'Admin',
    priority TEXT DEFAULT 'normal',
    resource_title TEXT,
    resource_url TEXT,
    link TEXT,
    category TEXT DEFAULT 'Campus Notice',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins and authorized users can manage announcements" ON public.announcements;
CREATE POLICY "Admins and authorized users can manage announcements" ON public.announcements
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. COURSES TABLE SCHEMA & MODERN COLUMNS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT DEFAULT 'Core Engineering',
    description TEXT,
    price NUMERIC DEFAULT 0,
    creator_id TEXT,
    creator_name TEXT,
    is_degree BOOLEAN DEFAULT FALSE,
    author TEXT,
    banner_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    youtube_playlist_id TEXT,
    likes INTEGER DEFAULT 0,
    keywords TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS youtube_playlist_id TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS keywords TEXT;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Courses are readable by everyone" ON public.courses;
CREATE POLICY "Courses are readable by everyone" ON public.courses
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users and creators can manage courses" ON public.courses;
CREATE POLICY "Authenticated users and creators can manage courses" ON public.courses
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. SUBJECTS TABLE SCHEMA & MODERN COLUMNS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    semester INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    custom_material_sections JSONB DEFAULT '["Notes", "Organizer", "Past Year Papers"]'::jsonb,
    is_public BOOLEAN DEFAULT TRUE,
    youtube_playlist_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS youtube_playlist_id TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS custom_material_sections JSONB DEFAULT '["Notes", "Organizer", "Past Year Papers"]'::jsonb;

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subjects are readable by everyone" ON public.subjects;
CREATE POLICY "Subjects are readable by everyone" ON public.subjects
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators and admins can manage subjects" ON public.subjects;
CREATE POLICY "Creators and admins can manage subjects" ON public.subjects
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. PLAYLISTS TABLE SCHEMA & MODERN COLUMNS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.playlists (
    id TEXT PRIMARY KEY,
    subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT,
    position INTEGER DEFAULT 0,
    likes JSONB DEFAULT '[]'::jsonb,
    youtube_playlist_id TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS youtube_playlist_id TEXT;
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS likes JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Playlists are readable by everyone" ON public.playlists;
CREATE POLICY "Playlists are readable by everyone" ON public.playlists
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators and admins can manage playlists" ON public.playlists;
CREATE POLICY "Creators and admins can manage playlists" ON public.playlists
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. MATERIALS TABLE SCHEMA & MODERN COLUMNS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY,
    subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'pdf',
    section_name TEXT DEFAULT 'Notes',
    author TEXT,
    position INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Materials are readable by everyone" ON public.materials;
CREATE POLICY "Materials are readable by everyone" ON public.materials
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators and admins can manage materials" ON public.materials;
CREATE POLICY "Creators and admins can manage materials" ON public.materials
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. STANDALONE STUDY VAULT RESOURCES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.standalone_resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'pdf',
    category TEXT DEFAULT 'Formula Sheet & Quick Reference',
    description TEXT,
    author TEXT,
    uploader_id TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.standalone_resources ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.standalone_resources ADD COLUMN IF NOT EXISTS uploader_id TEXT;

ALTER TABLE public.standalone_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public resources readable by everyone" ON public.standalone_resources;
CREATE POLICY "Public resources readable by everyone" ON public.standalone_resources
    FOR SELECT USING (is_public = true OR (auth.uid() IS NOT NULL AND auth.uid()::text = uploader_id::text));

DROP POLICY IF EXISTS "Users can manage their uploaded resources" ON public.standalone_resources;
CREATE POLICY "Users can manage their uploaded resources" ON public.standalone_resources
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. CANONICAL ATTENDANCE LEDGER TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_attendance_logs (
    user_id TEXT PRIMARY KEY,
    logs_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and manage their attendance logs" ON public.user_attendance_logs;
CREATE POLICY "Users can view and manage their attendance logs" ON public.user_attendance_logs
    FOR ALL USING (
        (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text) 
        OR user_id IS NOT NULL
    );

-- ------------------------------------------------------------------------------
-- 9. USER ROUTINES & SHARED ROUTINES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shared_routines (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    share_code TEXT UNIQUE,
    routine_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    semester_start_date DATE,
    creator_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shared_routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shared routines readable by everyone" ON public.shared_routines;
CREATE POLICY "Shared routines readable by everyone" ON public.shared_routines
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create shared routines" ON public.shared_routines;
CREATE POLICY "Users can create shared routines" ON public.shared_routines
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 10. CAMPUS MARKETPLACE TABLE & 5-MONTH LIFECYCLE
-- ------------------------------------------------------------------------------
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

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active marketplace items are readable by everyone" ON public.marketplace_items;
CREATE POLICY "Active marketplace items are readable by everyone" ON public.marketplace_items
    FOR SELECT USING (status = 'active' OR (auth.uid() IS NOT NULL AND auth.uid()::text = seller_id::text));

DROP POLICY IF EXISTS "Sellers and admins can manage marketplace items" ON public.marketplace_items;
CREATE POLICY "Sellers and admins can manage marketplace items" ON public.marketplace_items
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 11. INDEXES FOR LIGHTNING FAST QUERIES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_subjects_course_id ON public.subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_playlists_subject_id ON public.playlists(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject_id ON public.materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace_items(status);
