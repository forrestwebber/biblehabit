-- Migration 0006: Pacing engine schema — goals, reading_positions, reading_progress extension
-- BibleHabit revival, Phase 1 (Forrest 2026-07-19)
-- Extends the existing profiles/reading_progress tables; does not break them.

-- ============================================================
-- 1. GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('destination', 'habit')),
    target_date DATE,
    daily_components JSONB,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals (user_id);
CREATE INDEX IF NOT EXISTS goals_user_active_idx ON goals (user_id, active);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own goals" ON goals;
CREATE POLICY "Users can view own goals"
ON goals FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
CREATE POLICY "Users can insert own goals"
ON goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON goals;
CREATE POLICY "Users can update own goals"
ON goals FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
CREATE POLICY "Users can delete own goals"
ON goals FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages goals" ON goals;
CREATE POLICY "Service role manages goals"
ON goals FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 2. READING_POSITIONS — point-in-time position snapshots that
--    feed the pacing engine (distinct from reading_progress, which
--    is the per-chapter completion log)
-- ============================================================
CREATE TABLE IF NOT EXISTS reading_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL CHECK (chapter > 0),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL DEFAULT 'checkin' CHECK (source IN ('onboarding', 'checkin'))
);

CREATE INDEX IF NOT EXISTS reading_positions_user_id_idx ON reading_positions (user_id);
CREATE INDEX IF NOT EXISTS reading_positions_user_recorded_idx ON reading_positions (user_id, recorded_at);

ALTER TABLE reading_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reading positions" ON reading_positions;
CREATE POLICY "Users can view own reading positions"
ON reading_positions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reading positions" ON reading_positions;
CREATE POLICY "Users can insert own reading positions"
ON reading_positions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reading positions" ON reading_positions;
CREATE POLICY "Users can update own reading positions"
ON reading_positions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages reading positions" ON reading_positions;
CREATE POLICY "Service role manages reading positions"
ON reading_positions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 3. READING_PROGRESS — extend with a goal_id link so the pacing
--    engine can attribute chapter completions to the active goal.
--    (Table already exists in production; guard with IF NOT EXISTS
--    pattern consistent with prior migrations in this repo.)
-- ============================================================
DO $$ BEGIN
    ALTER TABLE reading_progress ADD COLUMN goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_column THEN NULL;
    WHEN undefined_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS reading_progress_goal_id_idx ON reading_progress (goal_id);
