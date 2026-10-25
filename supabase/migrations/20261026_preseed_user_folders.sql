-- ==============================================================================
-- LEARN-O-PIA: 2026 USER FOLDER PRE-SEEDING MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This script:
-- 1. Sets column defaults on public.profiles so all NEW users get the 8 Semesters
--    and default Document, Links, and Personal sections pre-configured.
-- 2. Updates all EXISTING users in public.profiles whose folder columns are NULL
--    or empty '[]' so their folders are immediately populated.
-- ==============================================================================

-- 1. Ensure columns exist on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS folder_academic JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS folder_document JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS folder_links JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS folder_personal JSONB;

-- 2. Configure defaults on public.profiles for newly registered accounts
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

-- 3. Pre-seed existing user profiles where columns are NULL, empty, or unpopulated
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

-- 4. Clean out any mock/example items from existing populated folders in profiles
-- (Leaves all real user items intact)
UPDATE public.profiles
SET folder_academic = (
  SELECT jsonb_agg(
    jsonb_set(
      sem,
      '{items}',
      COALESCE(
        (SELECT jsonb_agg(it) 
         FROM jsonb_array_elements(sem->'items') it 
         WHERE it->>'id' NOT LIKE 'item-%'
        ),
        '[]'::jsonb
      )
    )
  )
  FROM jsonb_array_elements(folder_academic) sem
)
WHERE folder_academic IS NOT NULL 
  AND folder_academic::text LIKE '%item-%';
