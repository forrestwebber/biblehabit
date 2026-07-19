-- Migration 0007: Full rebuild bootstrap (2026-07-19)
-- The original Supabase project (lenluazxrudhlggliuno) was purged after months
-- of free-tier pause; this recreates every table the app actually references
-- (profiles, reading_progress, leads, clients) on the new project
-- (sjpvmvullpzimcgmhhxk). Template tables from the old scaffold
-- (orders/tickets/deliverables/support_threads) are intentionally dropped from
-- the schema — no code references them. Run before 0006.

-- ============================================================
-- 1. PROFILES — one row per auth user, created by trigger
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    plan_id TEXT,
    plan_start_date DATE,
    chapters_per_day INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. READING_PROGRESS — per-chapter completion log
--    (upserted on conflict user_id,date,book,chapter)
-- ============================================================
CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL CHECK (chapter > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date, book, chapter)
);

CREATE INDEX IF NOT EXISTS reading_progress_user_id_idx ON reading_progress (user_id);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON reading_progress;
CREATE POLICY "Users can view own progress"
ON reading_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON reading_progress;
CREATE POLICY "Users can insert own progress"
ON reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON reading_progress;
CREATE POLICY "Users can update own progress"
ON reading_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own progress" ON reading_progress;
CREATE POLICY "Users can delete own progress"
ON reading_progress FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. LEADS — public lead-capture form (anon insert only)
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    event_time TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a lead" ON leads;
CREATE POLICY "Anyone can submit a lead"
ON leads FOR INSERT WITH CHECK (true);
-- no SELECT policy: anon/authenticated cannot read leads; service role bypasses RLS

-- ============================================================
-- 4. CLIENTS — NextAuth credentials lookup + Stripe linkage
--    (accessed only via service role in src/auth.ts)
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    plan TEXT DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- no anon/authenticated policies: service-role access only
