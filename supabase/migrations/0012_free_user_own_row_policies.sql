-- 0012_free_user_own_row_policies.sql — 2026-09-04
-- 0010 replaced the own-row UPDATE/INSERT policies on profiles/goals with bh_is_pro(auth.uid()),
-- which reads subscriptions only. Free users (profiles.plan = free) could not update their own
-- profile or insert/update their own goals: one real account (created 2026-08-11) was blocked from
-- saving a plan. These three additive own-row policies were applied live on 2026-09-04 (ASC agent,
-- verified in pg_policies); self-upgrading `plan` stays blocked by protect_profile_plan_trigger.
-- Permissive policies OR together, so the "Pro users…" policies remain untouched.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
CREATE POLICY "Users can insert own goals"   ON public.goals    FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals"   ON public.goals    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
