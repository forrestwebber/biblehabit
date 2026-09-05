-- Renumbered 2026-09-04 during the unify-20260904 merge (was 0008_apple_iap_columns.sql on the
-- GitHub main line). Applied to Supabase project sjpvmvullpzimcgmhhxk on 2026-08-03,
-- AFTER 0006-0008 from the production line (2026-07-19). The web app now gates
-- Plus on profiles.plan (0008_add_plan_to_profiles.sql); the subscriptions table
-- created/extended here is still written by /api/iap/verify + /api/iap/notifications
-- and read by MembershipCard. NOTE: the RLS policies this file installs on
-- profiles/goals (bh_is_pro) predate the profiles.plan model — see the merge
-- report before relying on them.

-- ============================================================
-- BibleHabit: Apple StoreKit 2 IAP columns on subscriptions
-- 2026-08-03 — raw StoreKit implementation
--
-- ⚠️ CRITICAL TRAP (documented in asc_iap_gotchas.md and the 0006/0007
-- migrations): bh_is_pro(uid) grants Pro ONLY for comped = true OR
-- status IN ('active', 'trialing'). /api/iap/verify and
-- /api/iap/notifications only ever write those exact status strings for
-- this reason — never a new one like 'apple'. This migration adds columns
-- only; it does not touch bh_is_pro() or any RLS policy, both of which
-- already work correctly against status/comped regardless of which billing
-- system wrote them.
--
-- Applied live via mcp__claude_ai_Supabase__apply_migration on 2026-08-03;
-- this file is the version-controlled record of that change.
-- ============================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS store TEXT NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS apple_user_id UUID,
  ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_product_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_environment TEXT,
  ADD COLUMN IF NOT EXISTS apple_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS apple_auto_renew_status BOOLEAN,
  ADD COLUMN IF NOT EXISTS apple_auto_renew_product_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_last_notification_type TEXT,
  ADD COLUMN IF NOT EXISTS apple_last_notification_at TIMESTAMPTZ;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_store_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_store_check CHECK (store IN ('stripe', 'apple'));

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_apple_environment_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_apple_environment_check
    CHECK (apple_environment IS NULL OR apple_environment IN ('Sandbox', 'Production'));

-- subscriptions.email is the primary key (Stripe checkout can complete
-- before an account exists), so apple_user_id is a convenience pointer back
-- to auth.users, not a second identity source — /api/iap/verify still
-- upserts by email, resolved from the authenticated Supabase session.
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_apple_user_id_fkey;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_apple_user_id_fkey
    FOREIGN KEY (apple_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_apple_original_txn_uidx
  ON public.subscriptions (apple_original_transaction_id)
  WHERE apple_original_transaction_id IS NOT NULL;

COMMENT ON COLUMN public.subscriptions.store IS
  'Which billing system this row belongs to: stripe (web) or apple (StoreKit 2, 2026-08-03).';
COMMENT ON COLUMN public.subscriptions.apple_original_transaction_id IS
  'Apple''s stable per-subscriber key for this subscription lineage. Unique per row.';
