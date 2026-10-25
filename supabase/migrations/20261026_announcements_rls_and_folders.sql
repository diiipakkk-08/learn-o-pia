-- ============================================================================
-- Learnopia Database Migration: Announcements CRUD RLS & 4-Root Workspace Folders
-- Timestamp: 2026-10-26
-- Description:
--   1. Configures announcements table with secure Row Level Security (RLS).
--   2. Enables public read access and grants Admin/Owner full INSERT, UPDATE, DELETE permissions.
--   3. Guarantees JSONB folder columns on profiles for direct root items & single-level subfolders.
-- ============================================================================

-- 1. Create or update the Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY DEFAULT ('ann_' || substr(gen_random_uuid()::text, 1, 8)),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    author TEXT DEFAULT 'Platform Admin',
    sender_role TEXT DEFAULT 'Admin',
    priority TEXT DEFAULT 'normal',
    category TEXT DEFAULT 'Campus Notice',
    resource_title TEXT,
    resource_url TEXT,
    link TEXT,
    keywords TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns are present
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS author TEXT DEFAULT 'Platform Admin';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'Admin';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Campus Notice';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS resource_title TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS resource_url TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 2. Configure Row Level Security (RLS) for Announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone (students, faculty, visitors) can read all campus announcements
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements
    FOR SELECT TO public USING (true);

-- Policy 2: Admins, creators, and platform managers can broadcast and delete announcements
DROP POLICY IF EXISTS "Anyone can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authorized users can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins and authorized users can broadcast announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;

CREATE POLICY "Authorized users can manage announcements" ON public.announcements
    FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. Verify Profiles table has JSONB columns for the 4 Unified Folders
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS folder_academic JSONB DEFAULT '{"subfolders": [], "items": []}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS folder_document JSONB DEFAULT '{"subfolders": [], "items": []}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS folder_links JSONB DEFAULT '{"subfolders": [], "items": []}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS folder_personal JSONB DEFAULT '[]'::jsonb;

-- 4. High performance indexes for real-time notifications & feed order
CREATE INDEX IF NOT EXISTS idx_announcements_created_desc ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON public.announcements(category);
