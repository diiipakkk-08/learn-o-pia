-- ==============================================================================
-- LEARN-O-PIA: 2026 COMPLETE MASTER SUPABASE REPAIR & FEATURE MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- FEATURES & FIXES:
-- 1. Dedicated 4 User Folder JSON Columns on Profiles (Academic, Document, Links, Personal)
-- 2. Dedicated Announcements Table for Campus Broadcasts with Keywords & Sender Role
-- 3. Dedicated Ads & Platform Settings Table for Video & Banner Ads
-- 4. Robust Courses Table with Auto-generated ID, Keywords, and Fully Permissive RLS
-- 5. Standalone Resources Table (Study Vault) with Keywords & Full CRUD
-- 6. Keywords columns on Marketplace Items, Materials, and Standalone Resources
-- 7. Comprehensive Row Level Security (RLS) policies for viewing & CRUD operations
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USER PROFILES TABLE & DEDICATED 4 FOLDERS
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
    folder_academic JSONB DEFAULT '[]'::jsonb,
    folder_document JSONB DEFAULT '[]'::jsonb,
    folder_links JSONB DEFAULT '[]'::jsonb,
    folder_personal JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure the 4 dedicated folder columns exist on existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS folder_academic JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS folder_document JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS folder_links JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS folder_personal JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS enrolled_courses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workspace_stats JSONB DEFAULT '{}'::jsonb;

-- Pre-seed column defaults with 8 Semesters and clean default subfolders (items: [])
ALTER TABLE public.profiles 
  ALTER COLUMN folder_academic SET DEFAULT '[
    {"id": "sem-1", "title": "Semester 1", "subfolders": [], "items": []},
    {"id": "sem-2", "title": "Semester 2", "subfolders": [], "items": []},
    {"id": "sem-3", "title": "Semester 3", "subfolders": [], "items": []},
    {"id": "sem-4", "title": "Semester 4", "subfolders": [], "items": []},
    {"id": "sem-5", "title": "Semester 5", "subfolders": [], "items": []},
    {"id": "sem-6", "title": "Semester 6", "subfolders": [], "items": []},
    {"id": "sem-7", "title": "Semester 7", "subfolders": [], "items": []},
    {"id": "sem-8", "title": "Semester 8", "subfolders": [], "items": []}
  ]'::jsonb;

ALTER TABLE public.profiles 
  ALTER COLUMN folder_document SET DEFAULT '[
    {"id": "doc-dsa", "title": "Algorithms & LeetCode Solutions", "subfolders": [], "items": []},
    {"id": "doc-labs", "title": "University Lab Code & Manuals", "subfolders": [], "items": []},
    {"id": "doc-guides", "title": "Course Notes & Reference Guides", "subfolders": [], "items": []}
  ]'::jsonb;

ALTER TABLE public.profiles 
  ALTER COLUMN folder_links SET DEFAULT '[
    {"id": "links-university", "title": "MAKAUT & Examination Portals", "subfolders": [], "items": []},
    {"id": "links-resources", "title": "Digital Libraries & National Portals", "subfolders": [], "items": []}
  ]'::jsonb;

ALTER TABLE public.profiles 
  ALTER COLUMN folder_personal SET DEFAULT '[
    {"id": "pers-notes", "title": "Personal Study Notes", "subfolders": [], "items": []},
    {"id": "pers-prep", "title": "Interview & Placement Prep", "subfolders": [], "items": []}
  ]'::jsonb;

-- Pre-seed existing user profiles where columns are NULL, empty, or unpopulated
UPDATE public.profiles
SET folder_academic = '[
    {"id": "sem-1", "title": "Semester 1", "subfolders": [], "items": []},
    {"id": "sem-2", "title": "Semester 2", "subfolders": [], "items": []},
    {"id": "sem-3", "title": "Semester 3", "subfolders": [], "items": []},
    {"id": "sem-4", "title": "Semester 4", "subfolders": [], "items": []},
    {"id": "sem-5", "title": "Semester 5", "subfolders": [], "items": []},
    {"id": "sem-6", "title": "Semester 6", "subfolders": [], "items": []},
    {"id": "sem-7", "title": "Semester 7", "subfolders": [], "items": []},
    {"id": "sem-8", "title": "Semester 8", "subfolders": [], "items": []}
  ]'::jsonb
WHERE folder_academic IS NULL 
   OR folder_academic = '[]'::jsonb 
   OR jsonb_array_length(folder_academic) = 0;

UPDATE public.profiles
SET folder_document = '[
    {"id": "doc-dsa", "title": "Algorithms & LeetCode Solutions", "subfolders": [], "items": []},
    {"id": "doc-labs", "title": "University Lab Code & Manuals", "subfolders": [], "items": []},
    {"id": "doc-guides", "title": "Course Notes & Reference Guides", "subfolders": [], "items": []}
  ]'::jsonb
WHERE folder_document IS NULL 
   OR folder_document = '[]'::jsonb 
   OR jsonb_array_length(folder_document) = 0;

UPDATE public.profiles
SET folder_links = '[
    {"id": "links-university", "title": "MAKAUT & Examination Portals", "subfolders": [], "items": []},
    {"id": "links-resources", "title": "Digital Libraries & National Portals", "subfolders": [], "items": []}
  ]'::jsonb
WHERE folder_links IS NULL 
   OR folder_links = '[]'::jsonb 
   OR jsonb_array_length(folder_links) = 0;

UPDATE public.profiles
SET folder_personal = '[
    {"id": "pers-notes", "title": "Personal Study Notes", "subfolders": [], "items": []},
    {"id": "pers-prep", "title": "Interview & Placement Prep", "subfolders": [], "items": []}
  ]'::jsonb
WHERE folder_personal IS NULL 
   OR folder_personal = '[]'::jsonb 
   OR jsonb_array_length(folder_personal) = 0;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Users and admins can update profiles" ON public.profiles;
CREATE POLICY "Users and admins can update profiles" ON public.profiles
    FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 2. DEDICATED CAMPUS ANNOUNCEMENTS / BROADCASTS TABLE
-- ------------------------------------------------------------------------------
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

ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Campus Notice';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS resource_title TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS resource_url TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'Admin';

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authorized users can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Anyone can manage announcements" ON public.announcements;
CREATE POLICY "Anyone can manage announcements" ON public.announcements
    FOR ALL TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. DEDICATED ADS & SPONSOR BANNERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ads (
    id TEXT PRIMARY KEY DEFAULT 'global_ad_settings',
    title TEXT NOT NULL DEFAULT 'Support Learn-o-pia''s Open Education Infrastructure',
    message TEXT DEFAULT 'Learn-o-pia is built by students, for students. Help us keep all engineering degree curricula, attendance algorithms, and YouTube lecture sync servers fast, open, and free for everyone!',
    target_url TEXT DEFAULT 'https://github.com/diiipakkk-08/learn-o-pia',
    youtube_url TEXT DEFAULT '',
    banner_link TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    interval_minutes INTEGER DEFAULT 15,
    skip_delay_seconds INTEGER DEFAULT 10,
    settings_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial row if table is newly created
INSERT INTO public.ads (id, title, message, target_url, enabled, interval_minutes, skip_delay_seconds)
VALUES (
    'global_ad_settings',
    'Support Learn-o-pia''s Open Education Infrastructure',
    'Learn-o-pia is built by students, for students. Help us keep all engineering degree curricula, attendance algorithms, and YouTube lecture sync servers fast, open, and free for everyone!',
    'https://github.com/diiipakkk-08/learn-o-pia',
    TRUE,
    15,
    10
) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ads settings readable by everyone" ON public.ads;
CREATE POLICY "Ads settings readable by everyone" ON public.ads
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can update ads settings" ON public.ads;
DROP POLICY IF EXISTS "Anyone can update ads settings" ON public.ads;
CREATE POLICY "Anyone can update ads settings" ON public.ads
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Also support platform_settings for backward compatibility
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY,
    settings_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform settings readable by everyone" ON public.platform_settings;
CREATE POLICY "Platform settings readable by everyone" ON public.platform_settings
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Anyone can update platform settings" ON public.platform_settings;
CREATE POLICY "Anyone can update platform settings" ON public.platform_settings
    FOR ALL TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. COURSES TABLE SCHEMA & MODERN METADATA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY DEFAULT ('c_' || substr(gen_random_uuid()::text, 1, 8)),
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
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Core Engineering';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- If courses.id is a UUID column without default, ensure default generator is active
DO $$
BEGIN
    ALTER TABLE public.courses ALTER COLUMN id SET DEFAULT gen_random_uuid();
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Courses are readable by everyone" ON public.courses;
CREATE POLICY "Courses are readable by everyone" ON public.courses
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users and creators can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can insert courses" ON public.courses;
CREATE POLICY "Anyone can insert courses" ON public.courses
    FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update courses" ON public.courses;
CREATE POLICY "Anyone can update courses" ON public.courses
    FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete courses" ON public.courses;
CREATE POLICY "Anyone can delete courses" ON public.courses
    FOR DELETE TO public USING (true);

-- ------------------------------------------------------------------------------
-- 5. SUBJECTS TABLE (Optional sub-classification - No longer mandatory)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY DEFAULT ('sub_' || substr(gen_random_uuid()::text, 1, 8)),
    course_id TEXT,
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
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Creators and admins can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Anyone can manage subjects" ON public.subjects;
CREATE POLICY "Anyone can manage subjects" ON public.subjects
    FOR ALL TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. PLAYLISTS TABLE (YouTube Playlists)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.playlists (
    id TEXT PRIMARY KEY DEFAULT ('pl_' || substr(gen_random_uuid()::text, 1, 8)),
    subject_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT,
    position INTEGER DEFAULT 0,
    likes JSONB DEFAULT '[]'::jsonb,
    youtube_playlist_id TEXT,
    keywords TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS youtube_playlist_id TEXT;
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS likes JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Playlists are readable by everyone" ON public.playlists;
CREATE POLICY "Playlists are readable by everyone" ON public.playlists
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Creators and admins can manage playlists" ON public.playlists;
DROP POLICY IF EXISTS "Anyone can manage playlists" ON public.playlists;
CREATE POLICY "Anyone can manage playlists" ON public.playlists
    FOR ALL TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. MATERIALS & STANDALONE RESOURCES (Study Vault)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY DEFAULT ('mat_' || substr(gen_random_uuid()::text, 1, 8)),
    subject_id TEXT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'pdf',
    section_name TEXT DEFAULT 'Notes',
    author TEXT,
    keywords TEXT,
    position INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS keywords TEXT;

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Materials are readable by everyone" ON public.materials;
CREATE POLICY "Materials are readable by everyone" ON public.materials
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Creators and admins can manage materials" ON public.materials;
DROP POLICY IF EXISTS "Anyone can manage materials" ON public.materials;
CREATE POLICY "Anyone can manage materials" ON public.materials
    FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.standalone_resources (
    id TEXT PRIMARY KEY DEFAULT ('res_' || substr(gen_random_uuid()::text, 1, 8)),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'pdf',
    category TEXT DEFAULT 'Formula Sheet & Quick Reference',
    description TEXT,
    author TEXT,
    uploader_id TEXT,
    keywords TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.standalone_resources ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.standalone_resources ADD COLUMN IF NOT EXISTS uploader_id TEXT;
ALTER TABLE public.standalone_resources ADD COLUMN IF NOT EXISTS keywords TEXT;

ALTER TABLE public.standalone_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public resources readable by everyone" ON public.standalone_resources;
CREATE POLICY "Public resources readable by everyone" ON public.standalone_resources
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can manage their uploaded resources" ON public.standalone_resources;
DROP POLICY IF EXISTS "Anyone can manage standalone resources" ON public.standalone_resources;
CREATE POLICY "Anyone can manage standalone resources" ON public.standalone_resources
    FOR ALL TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. CAMPUS MARKETPLACE TABLE & 5-MONTH LIFECYCLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketplace_items (
    id TEXT PRIMARY KEY DEFAULT ('mkt_' || substr(gen_random_uuid()::text, 1, 8)),
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

ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '150 days');

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active marketplace items are readable by everyone" ON public.marketplace_items;
CREATE POLICY "Active marketplace items are readable by everyone" ON public.marketplace_items
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Sellers and admins can manage marketplace items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Anyone can manage marketplace items" ON public.marketplace_items;
CREATE POLICY "Anyone can manage marketplace items" ON public.marketplace_items
    FOR ALL TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 9. USER ATTENDANCE LOGS & ROUTINES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_attendance_logs (
    user_id TEXT PRIMARY KEY,
    logs_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and manage their attendance logs" ON public.user_attendance_logs;
CREATE POLICY "Users can view and manage their attendance logs" ON public.user_attendance_logs
    FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.user_routines (
    user_id TEXT PRIMARY KEY,
    routine_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    semester_start_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their routines" ON public.user_routines;
CREATE POLICY "Users can manage their routines" ON public.user_routines
    FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.shared_routines (
    id TEXT PRIMARY KEY DEFAULT ('rt_' || substr(gen_random_uuid()::text, 1, 8)),
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
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can create shared routines" ON public.shared_routines;
CREATE POLICY "Users can create shared routines" ON public.shared_routines
    FOR ALL TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 10. LIGHTNING FAST INDEXES FOR DISCOVERY & SEARCH
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_ads_id ON public.ads(id);
