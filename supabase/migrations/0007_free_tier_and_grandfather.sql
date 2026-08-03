-- ============================================================
-- BibleHabit: FREE TIER + grandfather early users into Pro
-- 2026-08-03
--
-- WHY: 0006 made the whole habit product require entitlement, so day 8 locked
-- the app. Product decision (Forrest, 2026-08-03): the fixed
-- read-the-Bible-in-a-year plan is FREE FOREVER — log in daily, see today's
-- reading, mark it done, keep a streak. Pro sells CONTROL over the habit
-- (choose/build a plan, set the pace, side plans, progress analytics, and
-- everything we add later).
--
-- THE BUG THIS FIXES IS NOT COSMETIC: reading_progress INSERT/UPDATE were gated
-- on bh_is_entitled(). Once a trial lapsed, "Mark complete" was rejected by the
-- DATABASE — silently, because the client writes reading_progress with the anon
-- key and treats a failure as a sync hiccup. Shipping the free tier in the UI
-- without this migration would have produced a free plan whose one button
-- quietly did nothing.
-- ============================================================

-- ── 1. Name the concept correctly: bh_is_pro() ────────────────
-- Same rules as before (trial window, comped, active/trialing, paid grace), but
-- the name now says what it decides. bh_is_entitled() is kept as a thin alias so
-- any policy or query still referencing it keeps working.
CREATE OR REPLACE FUNCTION public.bh_is_pro(uid UUID)
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

  -- Inside the 7-day trial → Pro.
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

REVOKE ALL ON FUNCTION public.bh_is_pro(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bh_is_pro(UUID) TO authenticated, service_role;

-- Alias, so nothing that still calls the old name breaks.
CREATE OR REPLACE FUNCTION public.bh_is_entitled(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.bh_is_pro(uid); $$;

COMMENT ON FUNCTION public.bh_is_entitled(UUID) IS
  'Deprecated alias for bh_is_pro(). Kept so 0006-era policies keep working.';

-- ── 2. The daily habit is FREE: ungate reading_progress ───────
-- Marking a day complete and keeping a streak is the free product. Ownership is
-- still enforced — you may only write your own rows — but the tier is not.
DROP POLICY IF EXISTS "Users can insert own progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Entitled users can insert own progress" ON public.reading_progress;
CREATE POLICY "Users can insert own progress"
  ON public.reading_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Entitled users can update own progress" ON public.reading_progress;
CREATE POLICY "Users can update own progress"
  ON public.reading_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 3. Plan data stays gated, and that is correct ─────────────
-- profiles carries plan_id / plan_start_date / chapters_per_day. Choosing those
-- is Pro. The free tier's fixed plan is written by /api/plan with the service
-- role, which validates the values against the one allowed free plan before
-- writing — so this policy blocks a hand-rolled anon-key write without
-- blocking free-tier onboarding.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Entitled users can update own profile" ON public.profiles;
CREATE POLICY "Pro users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id AND public.bh_is_pro(auth.uid()))
  WITH CHECK (auth.uid() = id AND public.bh_is_pro(auth.uid()));

-- ── 4. Side plans stay Pro ────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
DROP POLICY IF EXISTS "Entitled users can insert own goals" ON public.goals;
CREATE POLICY "Pro users can insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.bh_is_pro(auth.uid()));

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Entitled users can update own goals" ON public.goals;
CREATE POLICY "Pro users can update own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.bh_is_pro(auth.uid()));

-- ── 5. GRANDFATHER every existing account into Pro ────────────
-- Forrest, 2026-08-03: "early users get pro grandfathered."
--
-- Implemented with the comped flag the entitlement resolver already honours, so
-- there is no second code path to maintain: comped = true → Pro forever, in the
-- API, in the RLS function, and in the client UI.
--
-- Scoped to users who exist WHEN THIS RUNS. Anyone who signs up afterwards gets
-- the normal 7-day trial and then the free tier. `status = 'comped'` (not
-- 'active') keeps them visually distinct from real payers in the dashboard, and
-- the resolver checks comped before status so the label is cosmetic.
--
-- ON CONFLICT DO NOTHING, never DO UPDATE: an existing row may hold a real
-- Stripe subscription, and overwriting it with a comp would erase the customer
-- and subscription IDs the webhook needs to attribute future events.
INSERT INTO public.subscriptions (email, status, comped, site, last_checked_at, updated_at)
SELECT lower(u.email), 'comped', true, 'biblehabit.co', now(), now()
FROM auth.users u
WHERE u.email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

COMMENT ON COLUMN public.subscriptions.comped IS
  'Free Pro access with no payment. Set for staff and for accounts grandfathered by migration 0007 (2026-08-03).';
