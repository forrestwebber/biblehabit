-- Migration 0008: Plus subscription gate (2026-07-19)
-- Adds profiles.plan ('free'|'plus'), the field checked server-side to gate
-- Plus-only features (pacing insights extras, multiple goals, streak repair).
-- A trigger blocks any authenticated-role UPDATE from changing `plan` — only
-- the service role (used by the Stripe webhook) may flip it. This prevents a
-- user from self-granting Plus via the existing "update own profile" RLS
-- policy, which otherwise allows updating any column on their own row.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'plus'));

CREATE INDEX IF NOT EXISTS profiles_plan_idx ON profiles (plan);

CREATE OR REPLACE FUNCTION public.protect_profile_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NEW.plan IS DISTINCT FROM OLD.plan AND auth.role() <> 'service_role' THEN
        NEW.plan := OLD.plan;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_plan_trigger ON profiles;
CREATE TRIGGER protect_profile_plan_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_plan();
