-- Renumbered 2026-09-04 during the unify-20260904 merge (was 0006_trial_and_entitlement.sql on the
-- GitHub main line). Applied to Supabase project sjpvmvullpzimcgmhhxk on 2026-08-02,
-- AFTER 0006-0008 from the production line (2026-07-19). The web app now gates
-- Plus on profiles.plan (0008_add_plan_to_profiles.sql); the subscriptions table
-- created/extended here is still written by /api/iap/verify + /api/iap/notifications
-- and read by MembershipCard. NOTE: the RLS policies this file installs on
-- profiles/goals (bh_is_pro) predate the profiles.plan model — see the merge
-- report before relying on them.

-- ============================================================
-- 0006 — 7-day free trial, then paid (BibleHabit, 2026-08-02)
--
-- Product decision: every account gets 7 days of full access.
-- After that, the reader (scripture text) stays free forever, but the
-- habit product — marking days complete, streaks, the pacing engine,
-- plan creation/changes, Progress, reminders, notes/highlights —
-- requires a BibleHabit Plus subscription.
--
-- Entitlement is resolved server-side only, from:
--   1. profiles.trial_ends_at        (the 7-day window)
--   2. public.subscriptions          (Stripe status, written by the webhook)
-- and enforced in the database itself via bh_is_entitled() in RLS, so a
-- client holding the anon key cannot write habit data after expiry.
-- ============================================================

-- ── 1. Trial window on profiles ──────────────────────────────
-- NOTE ON EXISTING USERS: `DEFAULT now()` backfills every existing row with
-- the migration timestamp, which is deliberate. Existing accounts were
-- created while the whole app was free, so dating their trial from
-- created_at would wall them the instant this ships. They get a fresh,
-- fair 7 days starting the moment this migration runs.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_ends_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days');

COMMENT ON COLUMN public.profiles.trial_started_at IS 'Start of the 7-day full-access trial. Defaults to row creation.';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'End of the 7-day full-access trial. After this, entitlement requires a subscriptions row.';

-- ── 2. Subscription state, keyed by email ────────────────────
-- Keyed by email (not user id) because Stripe checkout can complete before
-- the person ever creates an account, and because a paid web subscriber
-- must be recognised the moment they sign in on any device / the iOS shell.
CREATE TABLE IF NOT EXISTS public.subscriptions (
  email                  TEXT PRIMARY KEY,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  -- Stripe subscription status, or 'none' (checked Stripe, nothing there)
  status                 TEXT NOT NULL DEFAULT 'none',
  price_interval         TEXT,             -- 'month' | 'year'
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN NOT NULL DEFAULT false,
  comped                 BOOLEAN NOT NULL DEFAULT false,
  site                   TEXT NOT NULL DEFAULT 'biblehabit.co',
  notes                  TEXT,
  last_checked_at        TIMESTAMPTZ,      -- last live Stripe reconciliation
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_stripe_sub_idx ON public.subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_cus_idx ON public.subscriptions (stripe_customer_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Readable by its owner only; writable by the service role only (webhook).
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (lower(coalesce(auth.jwt() ->> 'email', '')) = email);

-- ── 3. Single source of truth: bh_is_entitled() ───────────────
CREATE OR REPLACE FUNCTION public.bh_is_entitled(uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email      TEXT;
  v_trial_ends TIMESTAMPTZ;
  v_status     TEXT;
  v_period_end TIMESTAMPTZ;
  v_comped     BOOLEAN;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT lower(u.email), p.trial_ends_at
    INTO v_email, v_trial_ends
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = uid;

  -- Inside the 7-day trial → full access.
  IF v_trial_ends IS NOT NULL AND v_trial_ends > now() THEN
    RETURN true;
  END IF;

  IF v_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT s.status, s.current_period_end, s.comped
    INTO v_status, v_period_end, v_comped
  FROM public.subscriptions s
  WHERE s.email = v_email;

  IF coalesce(v_comped, false) THEN
    RETURN true;
  END IF;

  IF v_status IN ('active', 'trialing') THEN
    RETURN true;
  END IF;

  -- Payment problems get grace until the paid period actually ends.
  IF v_status IN ('past_due', 'unpaid') AND v_period_end IS NOT NULL AND v_period_end > now() THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.bh_is_entitled(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bh_is_entitled(UUID) TO authenticated, service_role;

-- ── 4. Enforce entitlement in RLS (server-side, not UI) ───────
-- Reading progress = streaks + "day complete". Writes require entitlement.
-- SELECT and DELETE stay open: people keep and control their own data.
DROP POLICY IF EXISTS "Users can insert own progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Entitled users can insert own progress" ON public.reading_progress;
CREATE POLICY "Entitled users can insert own progress"
  ON public.reading_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.bh_is_entitled(auth.uid()));

DROP POLICY IF EXISTS "Users can update own progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Entitled users can update own progress" ON public.reading_progress;
CREATE POLICY "Entitled users can update own progress"
  ON public.reading_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.bh_is_entitled(auth.uid()));

-- Profile writes from the client only ever carry plan data
-- (plan_id / plan_start_date / chapters_per_day), so gating the whole
-- self-update path gates plan creation and plan changes.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Entitled users can update own profile" ON public.profiles;
CREATE POLICY "Entitled users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id AND public.bh_is_entitled(auth.uid()))
  WITH CHECK (auth.uid() = id AND public.bh_is_entitled(auth.uid()));

-- Sub-plan / habit rows live in goals — same rule.
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
DROP POLICY IF EXISTS "Entitled users can insert own goals" ON public.goals;
CREATE POLICY "Entitled users can insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.bh_is_entitled(auth.uid()));

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Entitled users can update own goals" ON public.goals;
CREATE POLICY "Entitled users can update own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.bh_is_entitled(auth.uid()));
