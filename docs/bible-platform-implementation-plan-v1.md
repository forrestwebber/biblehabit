# Daily Bible Reading Platform — Deep Implementation Plan v1

**Prepared for:** Forrest Webber
**Date:** March 29, 2026
**Status:** DRAFT — Awaiting Forrest's Approval Before Any Code
**Project Codename:** BibleHabit
**Existing Codebase:** `~/antigravity/projects/biblehabit/` (Next.js 16, React 19, Supabase, NextAuth v5, Stripe)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Breakdown](#2-product-breakdown)
3. [User Flows](#3-user-flows)
4. [Data Model](#4-data-model)
5. [System Design](#5-system-design)
6. [Bible Text Source Strategy](#6-bible-text-source-strategy)
7. [OG Image Generation](#7-og-image-generation)
8. [Edge Cases & Resilience](#8-edge-cases--resilience)
9. [Monetization Strategy](#9-monetization-strategy)
10. [Phased Rollout](#10-phased-rollout)
11. [SEO & Growth Mechanics](#11-seo--growth-mechanics)
12. [Risk Register](#12-risk-register)
13. [Open Questions for Forrest](#13-open-questions-for-forrest)

---

## 1. Executive Summary

BibleHabit is a daily Bible reading platform with two distinct product layers. **Layer 1** is a free, public-facing daily verse page designed to be shared on social media — it drives organic growth through beautiful, dynamic OG images that make every verse shareable. **Layer 2** is a logged-in experience where users choose structured reading plans (6-month, 1-year, or 3-year), track their daily progress, handle missed days gracefully, and build a consistent reading habit.

The business model is straightforward: Layer 1 is the acquisition engine (shareability drives traffic), and Layer 2 is the retention engine (progress tracking creates habit loops). Revenue comes from Amazon Bible affiliate links, optional premium plans (ad-free experience, additional translations, audio), and potentially a Stripe subscription for premium features.

**What already exists:** A Next.js 16 app with auth scaffolding (NextAuth v5 + Supabase adapter), Stripe integration, complete Bible book data (66 books with chapter counts), OG image route stubs, and page shells for `/today`, `/plans`, `/profile`, `/login`. The foundation is solid — this plan covers what to build on top of it.

---

## 2. Product Breakdown

### Layer 1: Public Daily Verse (Growth Engine)

The public layer exists for one purpose: get someone to see a verse, feel something, and share it. Every design decision serves this goal.

| Component | Purpose | Route | Priority |
|-----------|---------|-------|----------|
| **Daily Verse Page** | Today's verse + short commentary, clean centered layout | `/` or `/today` | P0 — Launch blocker |
| **Dynamic OG Image** | Auto-generated social card with verse text, reference, and branded design | `/api/og?verse=...` | P0 — Launch blocker |
| **Share Buttons** | One-tap share to Twitter/X, Facebook, iMessage, WhatsApp, copy link | Component on `/today` | P0 — Launch blocker |
| **Verse Archive** | Past daily verses browsable by date | `/archive` or `/verses/[date]` | P1 — Week 2 |
| **Landing/About** | What is BibleHabit, why it exists, CTA to sign up | `/about` | P1 — Week 2 |

**What drives growth here:**
- A person shares today's verse on Instagram Stories or Twitter
- The OG image renders beautifully with the verse text (not just a generic link preview)
- Their followers see the verse, click through, land on the daily verse page
- Some fraction bookmark it or come back tomorrow → habit loop begins
- The daily content creates a reason to return every single day

**Design principles for Layer 1:**
- One verse, one page, no clutter — the verse IS the page
- Beautiful typography (serif font for verse text, sans-serif for UI)
- Muted, warm background — feels like opening a physical Bible
- No login wall — the verse is always free and accessible
- Share button is the most prominent CTA (above the fold, thumb-reachable on mobile)

### Layer 2: Reading Plans & Progress (Retention Engine)

Once someone is hooked on the daily verse, the reading plan converts them from a casual visitor into a committed daily reader.

| Component | Purpose | Route | Priority |
|-----------|---------|-------|----------|
| **Plan Selection** | Browse available reading plans with descriptions and durations | `/plans` | P2 |
| **Plan Detail** | Full schedule preview before committing (what you'll read each day) | `/plans/[slug]` | P2 |
| **Today's Reading** | Personalized: today's assigned chapters based on active plan + progress | `/today` (logged-in variant) | P2 |
| **Reading View** | The actual Bible text for today's assignment, with mark-complete button | `/read/[plan]/[day]` | P2 |
| **Progress Dashboard** | Visual tracker: days completed, current streak, % through plan, calendar heatmap | `/profile` or `/dashboard` | P3 |
| **Catch-Up System** | Handles missed days gracefully — reschedule, batch read, or skip | `/catch-up` | P4 |
| **Plan Completion** | Celebration screen + "what's next" when a plan finishes | Modal/page | P4 |

**What drives retention here:**
- Progress visualization (streak counter, completion percentage, calendar heatmap)
- Gentle accountability — missed days aren't punished, they're recoverable
- Plan completion as a milestone event (shareable achievement)
- Multiple plan options so users can restart with a different pace

### Growth vs. Retention Matrix

| Metric | Layer 1 Drives | Layer 2 Drives |
|--------|---------------|---------------|
| New visitors | ✅ OG images shared on social | — |
| Return visits | ✅ Daily content creates habit | ✅ Plan assignments create obligation |
| Sign-ups | ✅ "Track your progress" CTA | — |
| Daily active users | Partially (new verse each day) | ✅ Personalized reading assignments |
| Long-term retention | — | ✅ Multi-month plans, streak mechanics |
| Virality | ✅ Share buttons + beautiful OG | ✅ Plan completion shares ("I read the whole Bible!") |

---

## 3. User Flows

### Flow 1: First Visit → Share → Return

```
Visitor lands on BibleHabit.com (from social share or direct)
    │
    ├── Sees today's verse prominently displayed
    │   └── Clean layout: verse text, reference, one-line commentary
    │
    ├── Scrolls down: sees "Share this verse" buttons
    │   ├── Taps Twitter/X → pre-filled tweet with verse + link + OG image
    │   ├── Taps Instagram → copies verse image to clipboard for Stories
    │   ├── Taps Copy Link → clipboard with share URL
    │   └── Taps WhatsApp → pre-filled message
    │
    ├── Below share: subtle CTA "Want to read the whole Bible? Start a plan →"
    │
    └── Leaves → comes back tomorrow (bookmarked, or follows social account)
```

**Key metric:** Share rate (shares / unique visitors). Target: 5-10%.

### Flow 2: Visitor → Sign Up → Choose Plan → Start Reading

```
Visitor clicks "Start a reading plan" CTA
    │
    ├── Lands on /plans — sees 3-4 plan options:
    │   ├── "Bible in a Year" (365 days, ~3-4 chapters/day)
    │   ├── "Bible in 6 Months" (180 days, ~6-7 chapters/day)
    │   ├── "Bible in 3 Years" (1,095 days, ~1 chapter/day)
    │   └── "New Testament in 90 Days" (90 days, ~3 chapters/day)
    │
    ├── Clicks a plan → /plans/bible-in-a-year
    │   ├── Sees: plan description, daily time commitment, full schedule preview
    │   └── CTA: "Start This Plan" (requires login)
    │
    ├── Redirected to /login
    │   ├── Option A: "Continue with Google" (NextAuth Google provider)
    │   └── Option B: "Sign up with email" (magic link via NextAuth email provider)
    │
    ├── After auth → /plans/bible-in-a-year/start
    │   ├── "When do you want to start?" (Today / Next Monday / Pick a date)
    │   ├── "Start from the beginning or pick a book?" (Genesis / Custom start)
    │   └── Confirm → creates UserPlan record
    │
    └── Redirected to /today → sees first reading assignment
        └── "Day 1: Genesis 1-3" with full Bible text and "Mark Complete" button
```

**Key metric:** Plan start rate (plan starts / sign-ups). Target: 70%+.

### Flow 3: Returning User → Read → Complete → Progress

```
Returning user opens BibleHabit.com (logged in)
    │
    ├── /today shows PERSONALIZED content:
    │   ├── Top: today's daily verse (same as public, maintains community feel)
    │   ├── Below: "Your reading for today" card
    │   │   ├── Plan name + day number ("Bible in a Year — Day 47")
    │   │   ├── Assignment: "1 Samuel 15-17"
    │   │   ├── Estimated reading time: "~12 minutes"
    │   │   └── "Start Reading →" button
    │   └── Sidebar/bottom: streak counter, progress ring
    │
    ├── Clicks "Start Reading" → /read/bible-in-a-year/47
    │   ├── Full Bible text for assigned chapters
    │   ├── Clean reading view (no distractions)
    │   ├── Scroll progress indicator
    │   └── At bottom: "Mark as Complete ✓" button
    │
    ├── Clicks "Mark as Complete"
    │   ├── Confetti/celebration micro-animation
    │   ├── UserProgress updated (current_day incremented, last_read_at = now)
    │   ├── Streak counter updates
    │   └── Shows: "Great work! You're 12.8% through your plan."
    │
    └── Returns to /today → assignment card now shows tomorrow's preview (grayed out)
```

**Key metric:** Daily completion rate (days completed / days elapsed since start). Target: 60%+.

### Flow 4: Missed Days → Catch-Up

```
User hasn't opened BibleHabit in 4 days
    │
    ├── Returns to /today
    │   ├── Banner: "Welcome back! You have 4 days to catch up."
    │   ├── Shows today's assignment AND missed days
    │   └── CTA: "Choose how to catch up →"
    │
    ├── /catch-up page options:
    │   ├── Option A: "Read them all today"
    │   │   └── Shows combined reading list (all 4 days + today)
    │   │   └── Each day individually markable
    │   │
    │   ├── Option B: "Spread over the next week"
    │   │   └── System redistributes missed readings into upcoming days
    │   │   └── Each day gets 1-2 extra chapters until caught up
    │   │
    │   ├── Option C: "Skip missed days and continue from today"
    │   │   └── Marks missed days as "skipped" (not "completed")
    │   │   └── Plan continues from current date
    │   │   └── Skipped days still accessible from progress view
    │   │
    │   └── Option D: "Restart my plan from Day 1"
    │       └── Resets UserProgress (preserves history of previous attempt)
    │       └── Started_at resets to today
    │
    └── After choosing → redirected to /today with updated schedule
```

**Key metric:** Catch-up conversion rate (users who catch up / users who miss days). Target: 40%+.

### Flow 5: Plan Completion

```
User completes final day of their reading plan
    │
    ├── "Mark as Complete" on final day triggers celebration:
    │   ├── Full-screen celebration animation
    │   ├── "You read the entire Bible in 365 days!"
    │   ├── Stats: total chapters read, longest streak, total reading time
    │   ├── Shareable achievement card (dynamic OG image)
    │   │   └── "I just read the entire Bible with BibleHabit! 📖"
    │   └── Share buttons (Twitter, Facebook, Instagram, WhatsApp)
    │
    ├── "What's next?" options:
    │   ├── Start another plan (different pace or translation)
    │   ├── Re-read (same plan again)
    │   └── Free reading mode (no plan, just daily verse)
    │
    └── Achievement permanently saved to profile
```

---

## 4. Data Model

### Entity Relationship Diagram (Text)

```
Users ─────────┐
               │ 1:many
               ▼
          UserPlans ──────────┐
               │              │ many:1
               │              ▼
               │        ReadingPlans
               │              │ 1:many
               │              ▼
               │     ReadingAssignments
               │
               │ 1:many
               ▼
         UserDayLog

DailyContent (standalone, date-keyed)
```

### Table: `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default gen_random_uuid() | Supabase auth user ID |
| `email` | TEXT | UNIQUE, NOT NULL | From auth provider |
| `name` | TEXT | NULLABLE | Display name |
| `image` | TEXT | NULLABLE | Avatar URL from Google/social |
| `auth_provider` | TEXT | NOT NULL | 'google', 'email', 'apple' |
| `timezone` | TEXT | DEFAULT 'America/Chicago' | For day boundary calculations |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |
| `email_opt_in` | BOOLEAN | DEFAULT true | Daily reminder emails |
| `preferred_translation` | TEXT | DEFAULT 'KJV' | Bible translation preference |

**Why timezone matters:** A user in California shouldn't see "you missed a day" at 10pm their time because it's midnight Eastern. Day boundaries must respect user timezone.

### Table: `reading_plans`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-friendly: 'bible-in-a-year' |
| `name` | TEXT | NOT NULL | "Bible in a Year" |
| `description` | TEXT | NOT NULL | 2-3 sentence overview |
| `duration_days` | INTEGER | NOT NULL | 365, 180, 1095, 90, etc. |
| `chapters_per_day_avg` | DECIMAL(3,1) | NOT NULL | For display: "~3.4 chapters/day" |
| `minutes_per_day_avg` | INTEGER | NOT NULL | For display: "~15 minutes/day" |
| `difficulty` | TEXT | NOT NULL | 'light', 'moderate', 'intensive' |
| `testament_scope` | TEXT | NOT NULL | 'full', 'old_testament', 'new_testament' |
| `is_active` | BOOLEAN | DEFAULT true | Soft-delete/hide plans |
| `sort_order` | INTEGER | DEFAULT 0 | Display ordering on /plans |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

### Table: `reading_assignments`

Pre-computed schedule for each plan. This is the "curriculum" — what to read on Day 1, Day 2, etc.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `plan_id` | UUID | FK → reading_plans.id, NOT NULL | |
| `day_number` | INTEGER | NOT NULL | 1, 2, 3... up to duration_days |
| `book` | TEXT | NOT NULL | "Genesis", "Exodus", etc. |
| `chapter_start` | INTEGER | NOT NULL | Starting chapter number |
| `chapter_end` | INTEGER | NOT NULL | Ending chapter number |
| `verse_start` | INTEGER | NULLABLE | NULL = entire chapter(s) |
| `verse_end` | INTEGER | NULLABLE | NULL = entire chapter(s) |
| `estimated_minutes` | INTEGER | DEFAULT 10 | Reading time estimate |
| **UNIQUE** | | `(plan_id, day_number, book)` | One plan can have multiple books per day |

**Note:** A single day can have multiple rows (e.g., Day 47 might assign both Psalms 23 and Proverbs 3). The composite unique key prevents duplicates while allowing multi-book days.

### Table: `user_plans`

Tracks which plan(s) a user has started and their progress.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, NOT NULL | |
| `plan_id` | UUID | FK → reading_plans.id, NOT NULL | |
| `status` | TEXT | NOT NULL, DEFAULT 'active' | 'active', 'paused', 'completed', 'abandoned' |
| `started_at` | DATE | NOT NULL | When user began this plan |
| `current_day` | INTEGER | NOT NULL, DEFAULT 1 | Which day they're on (1-indexed) |
| `completed_days` | INTEGER | NOT NULL, DEFAULT 0 | Total days actually completed |
| `skipped_days` | INTEGER | NOT NULL, DEFAULT 0 | Days explicitly skipped |
| `longest_streak` | INTEGER | DEFAULT 0 | Best consecutive-day streak |
| `current_streak` | INTEGER | DEFAULT 0 | Current consecutive-day streak |
| `catch_up_mode` | TEXT | NULLABLE | 'batch', 'spread', NULL = normal |
| `completed_at` | TIMESTAMPTZ | NULLABLE | When plan was finished (if ever) |
| `custom_start_book` | TEXT | NULLABLE | If user started from a specific book |
| `custom_start_chapter` | INTEGER | NULLABLE | If user started from a specific chapter |
| `paused_at` | TIMESTAMPTZ | NULLABLE | When user paused (for resume calculation) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |
| **UNIQUE** | | `(user_id, plan_id, started_at)` | User can restart same plan |

### Table: `user_day_log`

Individual day completion records. This is the source of truth for "did the user actually read on this day?"

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_plan_id` | UUID | FK → user_plans.id, NOT NULL | |
| `day_number` | INTEGER | NOT NULL | Which plan day was completed |
| `status` | TEXT | NOT NULL | 'completed', 'skipped', 'partial' |
| `completed_at` | TIMESTAMPTZ | NULLABLE | When marked complete |
| `reading_duration_seconds` | INTEGER | NULLABLE | Time spent reading (if tracked) |
| `notes` | TEXT | NULLABLE | User's personal notes/reflections |
| **UNIQUE** | | `(user_plan_id, day_number)` | One log entry per day per plan |

### Table: `daily_content`

The public daily verse — one entry per calendar date, pre-generated.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `date` | DATE | UNIQUE, NOT NULL | The calendar date |
| `verse_reference` | TEXT | NOT NULL | "John 3:16" or "Psalm 23:1-6" |
| `verse_text` | TEXT | NOT NULL | Full verse text |
| `translation` | TEXT | DEFAULT 'KJV' | Which translation |
| `commentary` | TEXT | NULLABLE | 2-3 sentence reflection/devotional |
| `theme` | TEXT | NULLABLE | "Hope", "Faith", "Courage", etc. |
| `og_image_url` | TEXT | NULLABLE | Pre-generated or on-demand |
| `share_count` | INTEGER | DEFAULT 0 | Tracks virality per verse |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

### Table: `share_events`

Analytics for understanding which verses go viral.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `daily_content_id` | UUID | FK → daily_content.id | |
| `platform` | TEXT | NOT NULL | 'twitter', 'facebook', 'whatsapp', 'copy', 'instagram' |
| `user_id` | UUID | FK → users.id, NULLABLE | NULL = anonymous share |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

### Indexes (Critical for Performance)

```sql
-- Fast lookup: what's today's content?
CREATE UNIQUE INDEX idx_daily_content_date ON daily_content(date);

-- Fast lookup: user's active plan
CREATE INDEX idx_user_plans_user_status ON user_plans(user_id, status) WHERE status = 'active';

-- Fast lookup: today's assignment for a plan + day
CREATE INDEX idx_reading_assignments_plan_day ON reading_assignments(plan_id, day_number);

-- Fast lookup: user's reading log for a plan
CREATE INDEX idx_user_day_log_plan ON user_day_log(user_plan_id, day_number);

-- Analytics: share counts by date
CREATE INDEX idx_share_events_content ON share_events(daily_content_id, created_at);
```

### Supabase Row-Level Security (RLS) Policies

```sql
-- Users can only read/update their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own" ON users FOR UPDATE USING (auth.uid() = id);

-- Daily content is public (no auth required)
ALTER TABLE daily_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON daily_content FOR SELECT TO anon USING (true);

-- Reading plans are public (browsable without login)
ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON reading_plans FOR SELECT TO anon USING (true);

-- User plans are private
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own plans only" ON user_plans FOR ALL USING (auth.uid() = user_id);

-- User day logs are private
ALTER TABLE user_day_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own logs only" ON user_day_log
  FOR ALL USING (
    user_plan_id IN (SELECT id FROM user_plans WHERE user_id = auth.uid())
  );
```

---

## 5. System Design

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Vercel (Edge)                  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Next.js  │  │ API      │  │ Vercel OG     │  │
│  │ Pages    │  │ Routes   │  │ Image Gen     │  │
│  │ (SSR/    │  │ /api/*   │  │ /api/og       │  │
│  │  Static) │  │          │  │ (Edge Runtime)│  │
│  └────┬─────┘  └────┬─────┘  └───────────────┘  │
│       │              │                           │
│       │     ┌────────┴────────┐                  │
│       │     │  Vercel Cron    │                  │
│       │     │  (daily content │                  │
│       │     │   generation)   │                  │
│       │     └────────┬────────┘                  │
└───────┼──────────────┼───────────────────────────┘
        │              │
        ▼              ▼
┌──────────────────────────────┐
│     Supabase (PostgreSQL)    │
│                              │
│  - Auth (users, sessions)    │
│  - Database (all tables)     │
│  - RLS policies              │
│  - Edge Functions (optional) │
│  - Realtime (future: live    │
│    reading sessions)         │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│     External APIs            │
│                              │
│  - Bible text API            │
│  - (Optional) AI commentary  │
│    generation via Gemini     │
└──────────────────────────────┘
```

### Daily Content Generation Pipeline

This is the most critical scheduled process — it generates tomorrow's daily verse content.

```
Vercel Cron (runs daily at 11:00 PM CT)
    │
    ├── 1. Check: does tomorrow's daily_content row exist?
    │   └── If yes → skip (idempotent)
    │
    ├── 2. Select tomorrow's verse:
    │   ├── Option A: Sequential walk through a curated verse list
    │   ├── Option B: Themed selection (Monday = Hope, Tuesday = Wisdom, etc.)
    │   └── Option C: AI-curated based on liturgical calendar / current events
    │
    ├── 3. Fetch verse text from Bible API
    │   └── Cache response (same verse may appear in reading plans)
    │
    ├── 4. Generate commentary:
    │   ├── Option A: Pre-written human commentary (highest quality, not scalable)
    │   ├── Option B: AI-generated via Gemini (cost-effective, needs review queue)
    │   └── Option C: Pull from public domain commentaries (Matthew Henry, etc.)
    │
    ├── 5. Generate OG image:
    │   └── Call /api/og with verse text + reference → save URL
    │
    └── 6. Insert daily_content row
        └── Status: ready for tomorrow
```

**Why 11 PM CT:** Gives one hour buffer before midnight. If the cron fails, there's time to detect and manually trigger. Also: Forrest is in CT timezone.

### Reading Progress Engine

```
User clicks "Mark as Complete" on /read/[plan]/[day]
    │
    ├── 1. API Route: POST /api/progress/complete
    │   ├── Validate: user owns this plan
    │   ├── Validate: day_number is correct (prevent skipping ahead)
    │   └── Validate: not already completed (idempotent)
    │
    ├── 2. Transaction (atomic):
    │   ├── INSERT into user_day_log (status: 'completed')
    │   ├── UPDATE user_plans SET current_day = current_day + 1
    │   ├── UPDATE user_plans SET completed_days = completed_days + 1
    │   ├── UPDATE user_plans SET current_streak = calculate_streak()
    │   ├── UPDATE user_plans SET longest_streak = MAX(longest_streak, current_streak)
    │   └── IF current_day > plan.duration_days:
    │       └── UPDATE user_plans SET status = 'completed', completed_at = now()
    │
    ├── 3. Return updated progress to client
    │   └── { completedDays, currentStreak, longestStreak, percentComplete, isFinished }
    │
    └── 4. Client-side celebration animation
```

### Streak Calculation Logic

```typescript
function calculateStreak(userPlan: UserPlan, dayLogs: UserDayLog[]): number {
  const timezone = user.timezone || 'America/Chicago';
  const today = getDateInTimezone(timezone);

  let streak = 0;
  let checkDate = today;

  // Walk backwards from today
  while (true) {
    const dayNumber = getDayNumberForDate(userPlan, checkDate);
    const log = dayLogs.find(l => l.day_number === dayNumber);

    if (!log || log.status !== 'completed') {
      // Allow grace: if checking today and it's before 9 PM, don't break streak
      if (checkDate === today && getCurrentHourInTimezone(timezone) < 21) {
        checkDate = subtractDay(checkDate);
        continue;
      }
      break;
    }

    streak++;
    checkDate = subtractDay(checkDate);
  }

  return streak;
}
```

**Grace period:** If it's before 9 PM in the user's timezone, we don't count today as "missed" for streak purposes. This prevents anxiety for users who read in the evening.

### Catch-Up System Design

```typescript
interface CatchUpState {
  missedDays: number;            // How many days behind
  missedAssignments: Assignment[]; // What they need to read
  options: CatchUpOption[];       // Available strategies
}

interface CatchUpOption {
  type: 'batch' | 'spread' | 'skip' | 'restart';
  label: string;
  description: string;
  extraReadingPerDay?: number;   // For 'spread' option
  daysToRecover?: number;        // For 'spread' option
}

// When user returns after missing days:
function getCatchUpState(userPlan: UserPlan): CatchUpState {
  const daysBehind = calculateDaysBehind(userPlan);

  if (daysBehind === 0) return null; // No catch-up needed

  const missedAssignments = getAssignmentsForDays(
    userPlan.plan_id,
    userPlan.current_day,
    userPlan.current_day + daysBehind - 1
  );

  return {
    missedDays: daysBehind,
    missedAssignments,
    options: [
      {
        type: 'batch',
        label: 'Read them all today',
        description: `Catch up on ${daysBehind} days of reading in one session`,
      },
      {
        type: 'spread',
        label: `Spread over ${Math.ceil(daysBehind / 2)} days`,
        description: 'Add extra chapters to upcoming days until caught up',
        extraReadingPerDay: 2,
        daysToRecover: Math.ceil(daysBehind / 2),
      },
      {
        type: 'skip',
        label: 'Skip and continue from today',
        description: "Mark missed days as skipped — you can always go back later",
      },
      ...(daysBehind > 14 ? [{
        type: 'restart' as const,
        label: 'Start over',
        description: 'Reset to Day 1 with a fresh start',
      }] : []),
    ],
  };
}
```

**Note:** The "restart" option only appears if the user is 14+ days behind. For shorter gaps, it's not worth resetting.

---

## 6. Bible Text Source Strategy

### Recommended: API.Bible (Primary) + KJV Fallback (Local)

After researching available options:

| API | Translations | Rate Limit | Commercial Use | Cost |
|-----|-------------|------------|----------------|------|
| **API.Bible** | 2,500+ versions, 1,600+ languages | 5,000/day, 500 verses/request | ✅ Yes (with attribution) | Free |
| **ESV API** | ESV only | 5,000/day, 60/min | ❌ Non-commercial only | Free |
| **bible-api (GitHub)** | 200+ versions | Self-hosted, unlimited | ✅ Open source | Hosting cost |

**Decision: Use API.Bible as primary, with local KJV as fallback.**

Reasoning:
1. API.Bible supports commercial use (we have affiliate links = commercial)
2. 2,500+ translations means we can offer translation switching as a premium feature
3. ESV API explicitly prohibits commercial use — risky for a monetized platform
4. Local KJV backup means the site never goes down if the API is unavailable

**Implementation:**

```typescript
// Bible text fetching with fallback
async function getBibleText(
  reference: string, // "Genesis 1:1-3" or "John 3:16"
  translation: string = 'KJV'
): Promise<BibleText> {
  try {
    // Primary: API.Bible
    const result = await apiBibleFetch(reference, translation);

    // Cache in Supabase for 30 days (reduce API calls)
    await cacheVerse(reference, translation, result);

    return result;
  } catch (error) {
    // Fallback: local KJV data
    console.error('API.Bible failed, falling back to local KJV', error);
    return getLocalKJV(reference);
  }
}
```

**API.Bible attribution requirement:** Must display "Powered by API.Bible" somewhere on pages that show Bible text. Put it in the footer — small, non-intrusive.

### Local KJV Data

The KJV is public domain. We can bundle the full text (~4.4MB JSON) as a static asset or store it in Supabase. This guarantees the site works even if all external APIs are down.

Source: Use the open-source `wldeh/bible-api` dataset (GitHub, MIT license) which provides the full KJV in structured JSON.

---

## 7. OG Image Generation

### Architecture: Vercel OG (Edge Runtime)

The existing codebase already has `/app/opengraph-image.tsx` and `/app/twitter-image.tsx` stubs. We'll build on these.

**Route:** `GET /api/og?verse=John+3:16&text=For+God+so+loved+the+world...&ref=John+3:16+KJV`

**Design spec for OG images:**

```
┌──────────────────────────────────────────┐ 1200x630px
│                                          │
│     [BibleHabit logo - small, top-left]  │
│                                          │
│                                          │
│    "For God so loved the world,          │
│     that he gave his only begotten       │
│     Son, that whosoever believeth        │
│     in him should not perish, but        │
│     have everlasting life."              │
│                                          │
│              — John 3:16 (KJV)           │
│                                          │
│                                          │
│     biblehabit.com                       │
└──────────────────────────────────────────┘

Background: warm cream/parchment (#F5F0E8)
Verse text: dark brown serif (#3D2B1F), 32-40px
Reference: muted brown (#8B7355), 24px
Logo: subtle, doesn't compete with verse
```

**Implementation:**

```tsx
// /app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const verse = searchParams.get('verse') || 'John 3:16';
  const text = searchParams.get('text') || '';
  const ref = searchParams.get('ref') || verse;

  // Load custom serif font
  const fontData = await fetch(
    new URL('../../assets/fonts/Lora-Regular.ttf', import.meta.url)
  ).then(res => res.arrayBuffer());

  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1200px',
        height: '630px',
        backgroundColor: '#F5F0E8',
        padding: '60px 80px',
        fontFamily: 'Lora',
      }}>
        <div style={{
          fontSize: text.length > 200 ? '28px' : '36px',
          color: '#3D2B1F',
          textAlign: 'center',
          lineHeight: 1.6,
          maxWidth: '900px',
        }}>
          "{text}"
        </div>
        <div style={{
          fontSize: '24px',
          color: '#8B7355',
          marginTop: '30px',
        }}>
          — {ref}
        </div>
        <div style={{
          fontSize: '16px',
          color: '#B0A090',
          position: 'absolute',
          bottom: '30px',
        }}>
          biblehabit.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Lora', data: fontData, style: 'normal' }],
    }
  );
}
```

**Caching:** Vercel OG auto-caches at the Edge. Each unique verse gets generated once, then served from CDN. For daily verses, we can pre-warm the cache by hitting the OG endpoint during the nightly cron.

**Dynamic font sizing:** If verse text exceeds 200 characters, drop from 36px to 28px. If over 400 characters, drop to 22px. Prevents text overflow.

---

## 8. Edge Cases & Resilience

### 8.1 Missed Days (The #1 Drop-Off Point)

**Philosophy:** Never punish. Always welcome back. Make catching up feel achievable, not overwhelming.

| Days Missed | System Response |
|-------------|----------------|
| 1 | Gentle nudge: "You missed yesterday. Read both today?" |
| 2-7 | Catch-up prompt with 4 options (batch, spread, skip, continue) |
| 8-14 | Same options, but "spread" extends over more days |
| 15-30 | Same options + "restart" appears |
| 30+ | "Welcome back!" message, prominent restart option, but all options still available |

**Push notification strategy (future):**
- Day 1 missed: No notification (respect their time)
- Day 2 missed: Gentle notification at their usual reading time
- Day 3 missed: "Your streak is at risk" (only if they had a streak > 7)
- Day 7+ missed: Weekly digest: "Here's what you missed this week in your plan"

### 8.2 Restarting Plans Mid-Stream

```typescript
async function restartPlan(userPlanId: string): Promise<void> {
  // Don't delete — archive the old attempt
  await supabase.from('user_plans')
    .update({
      status: 'abandoned',
      updated_at: new Date()
    })
    .eq('id', userPlanId);

  // Create fresh plan instance
  const oldPlan = await getUserPlan(userPlanId);
  await supabase.from('user_plans').insert({
    user_id: oldPlan.user_id,
    plan_id: oldPlan.plan_id,
    status: 'active',
    started_at: new Date(),
    current_day: 1,
  });
}
```

**Key:** Old attempt is preserved (status = 'abandoned'), not deleted. User can see their history: "You've attempted this plan 3 times. You made it to Day 47 last time!"

### 8.3 Starting from Any Book/Chapter

Users should be able to say "I want to read the Bible in a year but start from Psalms." The system needs to handle this:

```typescript
function getCustomStartDay(planId: string, book: string, chapter: number): number {
  // Find the day_number in reading_assignments where this book+chapter appears
  const assignment = await supabase.from('reading_assignments')
    .select('day_number')
    .eq('plan_id', planId)
    .eq('book', book)
    .lte('chapter_start', chapter)
    .gte('chapter_end', chapter)
    .single();

  return assignment?.day_number || 1;
}
```

The plan still has the same total duration, but `current_day` starts at (say) Day 142 instead of Day 1. When they reach the end, it wraps around to Day 1 and continues until they've completed all days.

### 8.4 Multiple Devices / Progress Sync

Since all progress lives in Supabase (server-side), multi-device sync is automatic. The key consideration is **offline reading:**

- **Phase 1 (MVP):** No offline support. Progress syncs on page load.
- **Phase 2:** Service worker caches today's reading text. "Mark Complete" queues if offline, syncs when back online.
- **Phase 3:** Full PWA with offline reading plan support.

### 8.5 Plan Completion → What Next?

When a plan finishes, three things happen:
1. **Celebration:** Full-screen confetti + stats summary + shareable achievement image
2. **Profile badge:** "Completed: Bible in a Year (2026)" permanently on profile
3. **Next prompt:** "Start another plan" / "Re-read" / "Free reading mode"

If user does nothing after completing, they revert to Layer 1 experience (daily verse only, no plan assignments).

### 8.6 API.Bible Downtime

If API.Bible is unreachable:
1. Serve verses from local KJV cache (always available)
2. Log the failure for monitoring
3. Retry on next request (no exponential backoff needed — not a persistent connection)
4. Daily content cron pre-fetches tomorrow's verse, so real-time API availability is only needed for reading plan text

### 8.7 User Deletes Account

- Delete all user_plans, user_day_log, share_events for that user
- Supabase auth handles session/token cleanup
- GDPR compliant: no residual PII after deletion
- Soft-delete option: mark user as `deleted_at = now()`, hard-delete after 30 days (allows "undo")

---

## 9. Monetization Strategy

### Revenue Stream 1: Amazon Bible Affiliate Links (Primary)

Every reading plan page and daily verse page includes contextual affiliate links:

| Placement | Link Type | Example |
|-----------|-----------|---------|
| Daily verse page | "Read this in a study Bible" | Link to ESV Study Bible on Amazon |
| Plan selection | "Get a physical Bible for this plan" | Link to relevant Bible edition |
| Plan completion | "Gift a Bible to celebrate" | Link to gift-worthy editions |
| Sidebar/footer | "Our recommended Bibles" | Curated list page with affiliate links |

**Estimated revenue:** At 1,000 DAU with 2% click-through and 4% Amazon conversion: ~$50-100/month initially. Scales linearly with traffic.

### Revenue Stream 2: Premium Subscription (Phase 3+)

| Feature | Free | Premium ($4.99/mo) |
|---------|------|-------------------|
| Daily verse | ✅ | ✅ |
| Reading plans | ✅ (3 plans) | ✅ (All plans + custom) |
| Progress tracking | ✅ | ✅ |
| Ad-free experience | ❌ | ✅ |
| Multiple translations | ❌ (KJV only) | ✅ (ESV, NIV, NLT, etc.) |
| Audio Bible | ❌ | ✅ |
| Export/print reading log | ❌ | ✅ |
| Priority support | ❌ | ✅ |

**Stripe integration already exists** in the codebase (package.json has `stripe` and `@stripe/stripe-js`). Just need to wire up the subscription flow.

### Revenue Stream 3: Sponsored Content (Phase 4+)

Christian publishers, Bible study brands, and church tech companies would pay for tasteful, relevant placements. Only pursue this at 10,000+ DAU.

---

## 10. Phased Rollout

### Phase 1: Layer 1 MVP (Week 1-2) — LAUNCH BLOCKER

**Goal:** Daily verse page is live, shareable, and beautiful. No auth, no plans.

| Task | Effort | Owner |
|------|--------|-------|
| Design daily verse page (`/today`) — verse, reference, commentary | 4h | Rowan |
| Build `/api/og` route with dynamic verse OG images | 3h | Rowan |
| Create `daily_content` table in Supabase | 1h | Rowan |
| Build daily content cron (Vercel Cron or manual seed) | 3h | Rowan |
| Seed first 30 days of curated daily verses | 2h | Atlas (research) |
| Share buttons component (Twitter, Facebook, WhatsApp, Copy) | 2h | Rowan |
| Verse archive page (`/archive`) | 2h | Rowan |
| Amazon affiliate links on verse page | 1h | Rowan |
| Mobile responsiveness pass | 2h | Rowan |
| Playwright verification: OG images render, share links work | 1h | Rowan |
| **Total** | **~21h** | |

**Deliverable:** A live URL where anyone can see today's Bible verse and share it with a beautiful social card.

### Phase 2: Auth + Plan Selection (Week 3-4)

**Goal:** Users can create accounts and browse reading plans.

| Task | Effort | Owner |
|------|--------|-------|
| NextAuth Google + email magic link setup | 3h | Rowan |
| `reading_plans` + `reading_assignments` tables | 2h | Rowan |
| Seed 4 reading plans with full day-by-day assignments | 6h | Atlas (research) + Rowan |
| Plan browsing page (`/plans`) | 3h | Rowan |
| Plan detail page (`/plans/[slug]`) with schedule preview | 3h | Rowan |
| Plan start flow (choose date, optional custom start) | 3h | Rowan |
| `user_plans` table + API routes | 2h | Rowan |
| **Total** | **~22h** | |

**Deliverable:** Users can sign up, browse plans, and start one.

### Phase 3: Progress Tracking + Dashboard (Week 5-6)

**Goal:** Users see personalized reading assignments and track completion.

| Task | Effort | Owner |
|------|--------|-------|
| Personalized `/today` (logged-in: shows plan assignment) | 4h | Rowan |
| Reading view (`/read/[plan]/[day]`) with Bible text from API | 5h | Rowan |
| "Mark Complete" flow with progress update | 3h | Rowan |
| Progress dashboard with streak, %, calendar heatmap | 5h | Rowan |
| `user_day_log` table + API routes | 2h | Rowan |
| Streak calculation with timezone + grace period | 3h | Rowan |
| **Total** | **~22h** | |

**Deliverable:** Full daily reading loop — see assignment, read it, mark complete, see progress.

### Phase 4: Catch-Up + Advanced Features (Week 7-8)

**Goal:** Handle missed days gracefully, plan completion, polish.

| Task | Effort | Owner |
|------|--------|-------|
| Catch-up system (4 options: batch, spread, skip, restart) | 5h | Rowan |
| Plan completion celebration + shareable achievement | 3h | Rowan |
| Push notification opt-in (email reminders first) | 3h | Rowan |
| Profile page with reading history + badges | 3h | Rowan |
| Premium subscription flow (Stripe) | 4h | Rowan |
| Multiple translation support via API.Bible | 3h | Rowan |
| Performance optimization (caching, prefetching) | 2h | Rowan |
| **Total** | **~23h** | |

**Deliverable:** Complete, polished platform ready for growth.

### Timeline Summary

```
Week 1-2:  ████████████████████  Phase 1: Daily Verse MVP (LIVE)
Week 3-4:  ████████████████████  Phase 2: Auth + Plans
Week 5-6:  ████████████████████  Phase 3: Progress Tracking
Week 7-8:  ████████████████████  Phase 4: Catch-Up + Premium
```

**Total estimated effort:** ~88 hours of development across 8 weeks.

---

## 11. SEO & Growth Mechanics

### SEO Strategy

| Page | Target Keywords | Strategy |
|------|----------------|----------|
| `/today` | "daily bible verse", "bible verse of the day" | Fresh content daily, strong OG images |
| `/archive` | "bible verse [date]", "[verse reference]" | Each past verse is a unique, indexable page |
| `/plans` | "bible reading plan", "read bible in a year" | Evergreen landing page for plan seekers |
| `/plans/[slug]` | "[plan name] reading plan", "bible in a year schedule" | Long-tail plan-specific keywords |

**Technical SEO:**
- Server-side rendering for all public pages (Next.js SSR/ISR)
- Dynamic sitemap generation including all archive dates
- Proper `<meta>` OG tags on every page
- robots.txt allowing `/api/og` for social crawlers
- Structured data (JSON-LD) for Bible verse schema

### Organic Growth Loops

```
Loop 1: Daily Verse Share Loop
User sees verse → shares on social → friend sees OG image → clicks → becomes new user → shares

Loop 2: Plan Completion Share Loop
User completes plan → shares achievement → friend sees "I read the whole Bible" → signs up

Loop 3: SEO Discovery Loop
Google indexes archive pages → searcher finds "Psalm 23:1" → lands on BibleHabit →
browses other verses → bookmarks → returns daily
```

### Email Strategy (Phase 3+)

| Email | Trigger | Content |
|-------|---------|---------|
| Welcome | Sign up | "Welcome! Here's how BibleHabit works" |
| Daily reminder | 8 AM user timezone | "Today's reading: [assignment]" (if opted in) |
| Streak at risk | 2 days missed | "Your 15-day streak — don't lose it!" |
| Weekly digest | Sunday morning | "This week: 5/7 days completed, here's what's ahead" |
| Plan milestone | 25%, 50%, 75% complete | "You're halfway through the Bible!" |
| Plan complete | Final day marked | "Congratulations! You read the whole Bible." |

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API.Bible rate limits hit | Medium | High | Local KJV fallback + aggressive caching (30-day TTL) |
| API.Bible changes terms | Low | High | KJV fallback is always available; can self-host bible-api |
| Low share rate on OG images | Medium | Medium | A/B test OG designs; test different verse selections |
| Users don't return after Day 1 | High | High | Email capture on first visit (soft gate); daily reminder emails |
| Streak mechanics feel punishing | Medium | High | Grace period; "welcome back" > "you failed"; no shame UI |
| Supabase free tier limits | Low (short-term) | Medium | Monitor usage; upgrade to Pro ($25/mo) when needed |
| Copyright issues with translations | Low | High | KJV is public domain; API.Bible handles licensing for others |
| Mobile performance (large Bible text) | Medium | Medium | Paginate chapters; lazy-load; virtual scrolling for long passages |

---

## 13. Open Questions for Forrest

These decisions need Forrest's input before development begins:

1. **Domain:** Which domain from the research list? (Top picks: openthyword.com, versebyday.com, dwellscripture.com, selahreading.com)

2. **Default translation:** Start with KJV only (public domain, zero risk) or launch with API.Bible multi-translation from Day 1?

3. **Commentary source:** AI-generated via Gemini (fast, scalable) vs. curated from public domain commentaries (slower, higher quality) vs. Forrest writes them manually (highest quality, lowest scale)?

4. **Monetization priority:** Launch with Amazon affiliates from Day 1, or keep it clean and add monetization later?

5. **Branding:** The current project is "biblehabit" — is this the final brand name, or placeholder until domain is chosen?

6. **Reading plan content:** Should we build 4 plans for launch (Bible in a Year, 6 Months, 3 Years, NT in 90 Days) or start with just 1 (Bible in a Year)?

7. **Email provider:** Use Supabase's built-in email (limited) or integrate a proper ESP (Resend, Postmark, etc.) from the start?

8. **Analytics:** Vercel Analytics (simple) or something more robust like PostHog/Plausible for understanding share behavior?

---

## Appendix A: Pre-Built Reading Plan — Bible in a Year (Sample)

| Day | Old Testament | New Testament | Psalms/Proverbs |
|-----|--------------|---------------|-----------------|
| 1 | Genesis 1-2 | Matthew 1 | Psalm 1 |
| 2 | Genesis 3-5 | Matthew 2 | Psalm 2 |
| 3 | Genesis 6-8 | Matthew 3 | Psalm 3 |
| 4 | Genesis 9-11 | Matthew 4 | Psalm 4 |
| 5 | Genesis 12-14 | Matthew 5:1-26 | Psalm 5 |
| ... | ... | ... | ... |
| 365 | Malachi 3-4 | Revelation 22 | Psalm 150 |

**Plan design philosophy:** Each day includes OT + NT + Psalms/Proverbs. This prevents "desert stretches" (e.g., Leviticus for a week straight) and maintains variety. Most popular Bible-in-a-year plans (Robert Murray M'Cheyne, YouVersion) use this parallel-track approach.

---

## Appendix B: Tech Stack Summary

| Layer | Technology | Status |
|-------|-----------|--------|
| Framework | Next.js 16 (App Router) | ✅ Installed |
| UI | React 19 + Tailwind CSS v4 | ✅ Installed |
| Auth | NextAuth v5 (beta.30) + Supabase Adapter | ✅ Installed |
| Database | Supabase (PostgreSQL) | ✅ Connected |
| Payments | Stripe | ✅ Installed |
| Hosting | Vercel | ✅ Connected |
| OG Images | Vercel OG (@vercel/og, Edge Runtime) | 🔧 Stub exists |
| Bible API | API.Bible (primary) + local KJV (fallback) | 📋 Planned |
| Email | Nodemailer (installed) → migrate to Resend | ✅ Installed |
| Fonts | Lora (serif, for verse text) + Inter (sans, for UI) | 📋 Planned |

---

*This document is the complete technical blueprint for BibleHabit. No code should be written until Forrest reviews and approves this plan. All architecture decisions align with the previously approved tech stack (Task #451).*

*Prepared by the product team — March 29, 2026.*
