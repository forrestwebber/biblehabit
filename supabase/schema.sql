-- BibleHabit Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================================
-- 1. Profiles table (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    plan_id TEXT,                    -- e.g. 'whole-bible-1yr', 'new-testament-90d'
    plan_start_date DATE,
    chapters_per_day INT DEFAULT 3,
    streak_current INT DEFAULT 0,
    streak_longest INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. Reading Progress table
-- ============================================================
CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    book TEXT NOT NULL,               -- e.g. 'Genesis', 'Matthew'
    chapter INT NOT NULL,             -- e.g. 1, 2, 3
    completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date, book, chapter)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_date ON reading_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON reading_progress(user_id);

-- ============================================================
-- 3. Row Level Security (RLS)
-- ============================================================

-- Profiles: users can only read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Reading progress: users can only access their own data
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading progress"
    ON reading_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading progress"
    ON reading_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading progress"
    ON reading_progress FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading progress"
    ON reading_progress FOR DELETE
    USING (auth.uid() = user_id);
