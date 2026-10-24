-- ==============================================================================
-- LEARN-O-PIA: Production Database Optimization & Table Cleanup
-- Version: 2026-10-24
-- Features:
-- 1. Drops obsolete 'videos' table (1,400+ rows saved; pure YouTube playlist architecture)
-- 2. Drops unused 'discussion_threads' and duplicate 'user_logs' tables
-- 3. Ensures 'user_attendance_logs' is the single canonical ledger with RLS
-- 4. Seeds 'marketplace_items' table with real campus academic items
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP OBSOLETE & UNUSED TABLES
-- ------------------------------------------------------------------------------
-- Drop the 1,400 video rows table (App now streams YouTube playlists dynamically)
DROP TABLE IF EXISTS public.videos CASCADE;

-- Drop obsolete discussion threads (removed community commenting features)
DROP TABLE IF EXISTS public.discussion_threads CASCADE;

-- Drop redundant duplicate user_logs table (replaced by user_attendance_logs)
DROP TABLE IF EXISTS public.user_logs CASCADE;

-- ------------------------------------------------------------------------------
-- 2. ENSURE CANONICAL ATTENDANCE LEDGER TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_attendance_logs (
    user_id TEXT PRIMARY KEY,
    logs_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and manage their attendance logs" ON public.user_attendance_logs;
CREATE POLICY "Users can view and manage their attendance logs" ON public.user_attendance_logs
    FOR ALL USING (auth.uid()::text = user_id::text OR user_id IS NOT NULL);

-- ------------------------------------------------------------------------------
-- 3. ENSURE MARKETPLACE ITEMS TABLE & SEED DATA
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
    FOR SELECT USING (status = 'active' OR auth.uid()::text = seller_id::text);

DROP POLICY IF EXISTS "Sellers can manage their marketplace items" ON public.marketplace_items;
CREATE POLICY "Sellers can manage their marketplace items" ON public.marketplace_items
    FOR ALL USING (auth.uid()::text = seller_id::text OR seller_id IS NOT NULL);

-- Insert Real Academic Sample Items (Skip if they already exist)
INSERT INTO public.marketplace_items (id, title, category, price, description, author, seller_id, contact_method, contact_detail, image_url, keywords, status, listed_at, expires_at)
VALUES
(
    'mkt-1',
    'MAKAUT 1st & 2nd Year B.Tech Complete Organizer & Solved PYQs',
    'Books & Notes',
    '₹150',
    'Complete physical semester organizers for Engineering Mathematics, Basic Electrical, Physics, and Data Structures with handwritten step-by-step solutions.',
    'Sneha Roy (CSE, 3rd Year)',
    'user-sneha',
    'whatsapp',
    '9876543210',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    'organizer, pyq, makaut, mathematics, physics',
    'active',
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '147 days'
),
(
    'mkt-2',
    'GATE CSE Comprehensive Handwritten Master Notebooks',
    'Books & Notes',
    '₹299',
    'Color-coded handwritten notebooks covering Discrete Math, Algorithms, DBMS, OS, and Computer Networks with 15-year past question analysis.',
    'Arjun Banerjee (Topper)',
    'user-arjun',
    'telegram',
    'arjun_gate_cse',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    'gate, cse, algorithms, handwritten notes',
    'active',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '148 days'
),
(
    'mkt-3',
    'ESP32-WROOM & STM32 Microcontroller IoT Lab Starter Kit',
    'Hardware Kits',
    '₹1,199',
    'Complete working kit with pre-soldered ESP32 development board, breadboard, OLED I2C display, DHT11, and ultrasonic distance sensors for college projects.',
    'Robotics & Embedded Club',
    'user-robotics',
    'whatsapp',
    '9830123456',
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80',
    'esp32, stm32, iot, breadboard, sensors, robotics',
    'active',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '148 days'
),
(
    'mkt-4',
    'Microprocessor 8085 Physical Simulation Trainer Kit with Keypad',
    'Hardware Kits',
    '₹2,450',
    'Physical 8085 trainer kit with 8255 PPI interface, pre-programmed monitor ROM, and 7-segment display for college assembly language practicals.',
    'ECE Hardware Collective',
    'user-ece',
    'whatsapp',
    '9831987654',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    '8085, microprocessor, assembly language, trainer kit',
    'active',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '149 days'
),
(
    'mkt-5',
    'Omega Mini Drafter with Precision Compass & Pine Drawing Board',
    'Tools & Gear',
    '₹450',
    'Pristine condition mini drafter with clamp, steel rule, and 24x36 inch pine-wood drawing board used for Engineering Graphics & Design.',
    'Subhashis Ghosh (Mechanical)',
    'user-subhashis',
    'whatsapp',
    '9874561230',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    'mini drafter, drawing board, engineering graphics, edg',
    'active',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '149 days'
),
(
    'mkt-6',
    'Casio fx-991EX ClassWiz Advanced Engineering Calculator',
    'Tools & Gear',
    '₹850',
    'High-resolution natural textbook display with 552 mathematical functions, matrix, vector, and polynomial solver allowed in college examinations.',
    'Aniket Roy (Civil)',
    'user-aniket',
    'whatsapp',
    '9832145678',
    'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=600&q=80',
    'casio, calculator, classwiz, engineering maths',
    'active',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '149 days'
),
(
    'mkt-7',
    '1-on-1 DSA Problem-Solving & Technical Mock Interview Mentorship',
    'Services',
    '₹199 / hr',
    'Personalized 45-minute live debugging, dynamic programming intuition, and mock technical interview practice session on Google Meet.',
    'Rahul Sen (Adobe SDE Intern)',
    'user-rahul',
    'whatsapp',
    '9876501234',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
    'dsa, interview, coding, mentorship, leetcode',
    'active',
    NOW(),
    NOW() + INTERVAL '150 days'
),
(
    'mkt-8',
    'B.Tech Minor/Major Project Circuit Debugging & KiCad Review',
    'Services',
    '₹350',
    'Hardware circuit troubleshooting, schematic review in KiCad, and debugging Arduino/ESP32 sensor code before final college semester presentations.',
    'Tech Support Guild',
    'user-guild',
    'whatsapp',
    '9876512345',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
    'project, circuit, debugging, kicad, arduino',
    'active',
    NOW(),
    NOW() + INTERVAL '150 days'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    description = EXCLUDED.description,
    author = EXCLUDED.author,
    contact_method = EXCLUDED.contact_method,
    contact_detail = EXCLUDED.contact_detail,
    image_url = EXCLUDED.image_url,
    keywords = EXCLUDED.keywords,
    status = EXCLUDED.status;
