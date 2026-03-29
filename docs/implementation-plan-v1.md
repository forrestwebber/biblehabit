# Slacked.co Client Services — Deep Implementation Plan v1

**Prepared for:** Forrest Webber
**Date:** March 29, 2026
**Status:** DRAFT — Ready for Review
**Tagline:** "AI works. You slack."

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Breakdown](#2-product-breakdown)
3. [User Flows](#3-user-flows)
4. [Data Model](#4-data-model)
5. [System Design](#5-system-design)
6. [Basecamp Auto-Provisioning](#6-basecamp-auto-provisioning)
7. [AI Communication Loop](#7-ai-communication-loop)
8. [Edge Cases & Resilience](#8-edge-cases--resilience)
9. [Phased Rollout](#9-phased-rollout)
10. [Prioritization: First Paying Client This Week](#10-prioritization-first-paying-client-this-week)
11. [Growth & Retention Mechanics](#11-growth--retention-mechanics)
12. [Risk Register](#12-risk-register)
13. [Open Questions for Forrest](#13-open-questions-for-forrest)

---

## 1. Executive Summary

Slacked.co is a done-for-you digital marketing agency where AI agents do the work and human clients see polished deliverables. The platform has two layers: a public marketing site that converts prospects into booked calls, and a private client portal where paying customers track deliverables, communicate with the team, and manage their subscription. Revenue comes from monthly retainers ranging from $499/mo (Agent Essentials) to $5,000+/mo (Premium engagements). The competitive advantage is radical transparency — clients see real-time progress in Basecamp and a custom dashboard, eliminating the "black box agency" problem that causes 67% of agency churn.

This plan covers the complete system: how a stranger becomes a paying client, how their payment triggers automatic project setup, how deliverables flow through the AI pipeline, and how we handle every edge case from failed payments to scope disputes.

---

## 2. Product Breakdown

### Layer 1: Public Site (Acquisition Engine)

The public site exists for one purpose: convert visitors into booked discovery calls.

| Component | Purpose | Current Status | Priority |
|-----------|---------|---------------|----------|
| **Landing Page** (`/`) | Hero + social proof + CTA → book call | ✅ Live | — |
| **Pricing Page** (`/plans`) | Tier comparison → CTA → Stripe checkout | ✅ Live (2 tiers) | Update to 3 tiers |
| **Case Studies** (`/work`) | Proof of results → build trust | ❌ Not built | Week 2 |
| **Blog** (`/blog`) | SEO + thought leadership | ❌ Not built | Week 3 |
| **Calendly Embed** (`/book`) | Discovery call scheduling | ⚠️ Placeholder URL | **Day 1 blocker** |
| **Social Proof Bar** | Starter Story + Niche Pursuits logos | ✅ Live | — |
| **Privacy/Terms** | Legal compliance | ✅ Live | — |

**What justifies $499–$5,000+/mo:**

The pricing is justified by deliverable volume and strategic depth, not by platform access:

| Tier | Monthly Price | Deliverables | Strategic Depth | Support Level |
|------|-------------|-------------|-----------------|--------------|
| **Agent Essentials** | $499/mo | Website, GBP, 4 blogs, 8 social posts, lead forms, monthly report | Template-driven, AI-generated, light human review | Email, 24h response |
| **Agent Growth** | $999/mo | All Essentials + 8 blogs, 16 social, Google/FB ads, email drips, video content | Custom strategy, competitor analysis, weekly calls | Same-day priority |
| **Premium / Custom** | $2,500–$7,500/mo | Full-service: 20+ social, 8+ blogs, ad management, outreach, QBR | Dedicated strategist, quarterly business reviews, full competitive monitoring | Slack/phone, same-hour |

**Unit economics at scale:**
- Agent Essentials: ~$50 in AI compute + $30 hosting = $80 COGS → 84% margin
- Agent Growth: ~$120 in AI compute + $50 ads management overhead = $170 COGS → 83% margin
- Premium: ~$400 AI + $200 human review time → 88%+ margin at $5K

### Layer 2: Client Portal (Retention Engine)

Once a client pays, they enter a dual-portal experience: the Slacked.co dashboard (real-time status, invoices, messaging) and a Basecamp project (deliverables, approvals, communication history).

| Component | Purpose | Current Status |
|-----------|---------|---------------|
| **Dashboard Overview** (`/dashboard`) | At-a-glance subscription status, recent deliverables, next milestones | ✅ Built |
| **Deliverables Tracker** (`/dashboard/deliverables`) | List of all deliverables with status (draft → review → approved → live) | ✅ Built |
| **Messages** (`/dashboard/messages`) | Threaded communication with the Slacked team | ✅ Built |
| **Invoices** (`/dashboard/invoices`) | Payment history, upcoming invoices, downloadable receipts | ✅ Built |
| **Billing** (`/dashboard/billing`) | Stripe Customer Portal link, plan upgrade/downgrade | ✅ Built |
| **Onboarding** (`/onboarding`) | Multi-step intake form (business info → goals → assets → preferences) | ⚠️ Built, not wired to backend |
| **Settings** (`/dashboard/settings`) | Profile, notification preferences, team access | ✅ Built |

**The Basecamp layer (client-visible):**

Each paying client gets a dedicated Basecamp project. They see:
- Welcome message explaining how everything works
- "Deliverables" todo list with every piece of content/work
- "Weekly Updates" message thread
- "Monthly Reports" with analytics and ROI
- Comment threads on every deliverable for approval/feedback

They do NOT see:
- Internal cost tracking
- AI agent dispatch logs
- Draft iterations before review
- Team discussions about strategy pivots

---

## 3. User Flows

### Flow 1: Prospect → Paying Client

```
Visitor lands on slacked.co (organic, social, referral)
    │
    ├── Reads hero: "AI works. You slack."
    ├── Scrolls social proof (Starter Story, Niche Pursuits mentions)
    ├── Clicks "See Plans" or "Book a Call"
    │
    ▼
Pricing Page (/plans)
    │
    ├── Compares 3 tiers
    ├── Clicks "Get Started" on chosen tier
    │
    ▼
Calendly Discovery Call (/book)
    │
    ├── Picks 30-min slot
    ├── Fills pre-call questionnaire (auto-created Google Form)
    │
    ▼
Discovery Call (Zoom)
    │
    ├── Forrest/Solomon walks through goals, audit, fit check
    ├── If fit → sends Stripe checkout link via email
    │
    ▼
Stripe Checkout
    │
    ├── Client pays first month
    ├── Stripe fires `checkout.session.completed` webhook
    │
    ▼
Auto-Provisioning Pipeline (see Section 5)
    │
    ├── Supabase: client record created, subscription active
    ├── Basecamp: project auto-created with template
    ├── Email: welcome email with dashboard login + Basecamp invite
    ├── Dashboard: client can log in immediately
    │
    ▼
Onboarding Flow (/onboarding)
    │
    ├── Step 1: Business information
    ├── Step 2: Goals & target audience
    ├── Step 3: Brand assets upload
    ├── Step 4: Competitor links & preferences
    │
    ▼
Active Client (ongoing)
    ├── Deliverables appear in dashboard + Basecamp
    ├── Weekly updates posted to Basecamp
    ├── Monthly reports with analytics
    └── Renewal: Stripe auto-charges, cycle continues
```

### Flow 2: Deliverable Lifecycle

```
Solomon dispatches AI agent (e.g., "Write 4 blog posts for Decker Law")
    │
    ▼
Agent produces draft → saved to ~/antigravity/projects/slacked-co/client-work/{client}/
    │
    ▼
QA review (Solomon or human spot-check)
    │
    ├── Pass → status: "ready_for_review"
    ├── Fail → agent re-dispatched with feedback
    │
    ▼
Client notification (email + dashboard + Basecamp todo)
    │
    ▼
Client reviews in Basecamp (comments, approvals)
    │
    ├── Approved → status: "approved", published/deployed
    ├── Revision requested → status: "revision", agent re-dispatched
    │
    ▼
Deliverable marked "live" → reflected in monthly report
```

### Flow 3: Client Communication

```
Client sends message via:
    ├── Dashboard /messages
    ├── Basecamp comment
    ├── Email (forwarded to Basecamp)
    │
    ▼
Solomon receives via webhook/polling
    │
    ▼
AI drafts response (context-aware: knows client, subscription, recent deliverables)
    │
    ▼
Response posted to Basecamp + mirrored to dashboard
    │
    ├── Routine → auto-sent (with human tone)
    ├── Escalation (billing, complaint, scope) → flagged for Forrest
    │
    ▼
Client sees response within SLA:
    ├── Essentials: 24 hours
    ├── Growth: same-day
    └── Premium: same-hour
```

### Flow 4: Subscription Renewal & Churn Prevention

```
Stripe fires `invoice.paid` (monthly)
    │
    ▼
Supabase: subscription period extended
Dashboard: invoice added to history
Basecamp: "Monthly renewal confirmed" posted
    │
    ▼
7 days before renewal:
    ├── Automated "Month in Review" email with ROI highlights
    ├── Dashboard: renewal reminder with deliverable summary
    │
    ▼
If `invoice.payment_failed`:
    ├── Supabase: subscription status → "past_due"
    ├── Email: "Payment failed — update your card" with Stripe portal link
    ├── Basecamp: internal flag for Forrest
    ├── Grace period: 7 days (deliverables continue)
    ├── After 7 days: access restricted, deliverables paused
    └── After 14 days: subscription canceled, project archived
```

---

## 4. Data Model

### Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   clients    │────<│  subscriptions   │     │  deliverables   │
│              │     │                  │     │                 │
│ id (PK)      │     │ id (PK)          │     │ id (PK)         │
│ email        │     │ client_id (FK)   │     │ client_id (FK)  │
│ name         │     │ stripe_sub_id    │     │ title           │
│ company      │     │ stripe_cust_id   │     │ type            │
│ phone        │     │ plan_tier        │     │ status          │
│ bc_project_id│     │ status           │     │ due_date        │
│ bc_person_id │     │ current_period_* │     │ delivered_at    │
│ onboarding_  │     │ cancel_at        │     │ bc_todo_id      │
│   complete   │     │ created_at       │     │ file_url        │
│ created_at   │     └──────────────────┘     │ feedback        │
│ updated_at   │                              │ created_at      │
└─────────────┘                              └─────────────────┘
       │
       │     ┌──────────────────┐     ┌─────────────────────┐
       ├────<│    messages      │     │  onboarding_steps   │
       │     │                  │     │                     │
       │     │ id (PK)          │     │ id (PK)             │
       │     │ client_id (FK)   │     │ client_id (FK)      │
       │     │ sender           │     │ step_number         │
       │     │ body             │     │ step_name           │
       │     │ channel          │     │ status              │
       │     │ bc_comment_id    │     │ data (jsonb)        │
       │     │ read_at          │     │ completed_at        │
       │     │ created_at       │     │ created_at          │
       │     └──────────────────┘     └─────────────────────┘
       │
       ├────<┌──────────────────┐
       │     │    invoices      │
       │     │                  │
       │     │ id (PK)          │
       │     │ client_id (FK)   │
       │     │ stripe_inv_id    │
       │     │ amount_cents     │
       │     │ status           │
       │     │ period_start     │
       │     │ period_end       │
       │     │ pdf_url          │
       │     │ created_at       │
       │     └──────────────────┘
       │
       └────<┌──────────────────────┐
             │  client_projects     │
             │                      │
             │ id (PK)              │
             │ client_id (FK)       │
             │ bc_project_id        │
             │ bc_todolist_ids (json│
             │ drive_folder_id      │
             │ repo_path            │
             │ domain               │
             │ created_at           │
             └──────────────────────┘
```

### SQL Schema

```sql
-- Clients: core identity + links to external systems
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    bc_project_id BIGINT,          -- Basecamp project ID
    bc_person_id BIGINT,           -- Basecamp person ID (client invite)
    onboarding_complete BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}',   -- flexible: industry, timezone, preferences
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions: Stripe-synced billing state
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    plan_tier TEXT NOT NULL CHECK (plan_tier IN ('essentials', 'growth', 'premium', 'custom')),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deliverables: every piece of work we produce
CREATE TABLE deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'blog_post', 'social_post', 'ad_creative', 'email_campaign',
        'website_page', 'report', 'video', 'gbp_update', 'seo_audit', 'other'
    )),
    status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('queued', 'in_progress', 'internal_review', 'ready_for_review',
                          'revision', 'approved', 'live', 'canceled')),
    due_date DATE,
    delivered_at TIMESTAMPTZ,
    bc_todo_id BIGINT,             -- linked Basecamp todo
    file_url TEXT,                  -- Google Drive or S3 link
    feedback TEXT,                  -- client feedback on this deliverable
    agent_id TEXT,                  -- which AI agent produced this
    revision_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages: unified inbox across all channels
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('client', 'team', 'system')),
    body TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('dashboard', 'basecamp', 'email')),
    bc_comment_id BIGINT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices: Stripe invoice mirror
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    amount_cents INT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding steps: track intake progress
CREATE TABLE onboarding_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    step_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'complete', 'skipped')),
    data JSONB DEFAULT '{}',       -- form data for this step
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, step_number)
);

-- Client projects: links to all external resources for a client engagement
CREATE TABLE client_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    bc_project_id BIGINT NOT NULL,
    bc_todolist_ids JSONB DEFAULT '[]',
    drive_folder_id TEXT,          -- Google Drive folder for client assets
    repo_path TEXT,                -- local repo path for client-specific work
    domain TEXT,                   -- client's website domain
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Clients can only see their own data
CREATE POLICY "clients_own_data" ON clients
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "subscriptions_own_data" ON subscriptions
    FOR SELECT USING (client_id IN (
        SELECT id FROM clients WHERE auth.uid()::text = id::text
    ));

-- (Similar policies for deliverables, messages, invoices, onboarding_steps)
```

---

## 5. System Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INTERNET                                   │
│                                                                     │
│   Visitor ──→ slacked.co (Vercel) ──→ Stripe Checkout              │
│                    │                       │                        │
│                    │                       │ webhook                │
│                    ▼                       ▼                        │
│              NextAuth v5          /api/webhooks/stripe              │
│              (Google OAuth)              │                          │
│                    │                     │                          │
│                    ▼                     ▼                          │
│              ┌──────────┐     ┌──────────────────┐                 │
│              │ Supabase │◄────│  Webhook Handler │                 │
│              │ (Postgres│     │  (Next.js API)   │                 │
│              │  + Auth) │     └────────┬─────────┘                 │
│              └──────────┘              │                            │
│                                        │ on checkout.session.completed │
│                                        ▼                            │
│                              ┌──────────────────┐                  │
│                              │ Auto-Provisioner  │                  │
│                              │                   │                  │
│                              │ 1. Create client  │                  │
│                              │ 2. Create BC proj │                  │
│                              │ 3. Create Drive   │                  │
│                              │ 4. Send welcome   │                  │
│                              │ 5. Init onboarding│                  │
│                              └──────────────────┘                  │
│                                                                     │
│   ┌─────────────────────────────────────────────────┐              │
│   │           Solomon (Mac mini)                     │              │
│   │                                                  │              │
│   │   Polls BC for client messages                   │              │
│   │   Dispatches AI agents for deliverables          │              │
│   │   Posts updates/deliverables back to BC          │              │
│   │   Monitors subscription health via Supabase      │              │
│   └─────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### Stripe → Supabase → Basecamp Auto-Creation Flow

**Step-by-step for `checkout.session.completed`:**

```javascript
// /api/webhooks/stripe/route.ts (pseudocode)

async function handleCheckoutComplete(session) {
  // 1. Extract customer data from Stripe session
  const { customer_email, customer, subscription, metadata } = session;
  const stripeCustomer = await stripe.customers.retrieve(customer);
  const stripeSub = await stripe.subscriptions.retrieve(subscription);

  // 2. Create client in Supabase
  const { data: client } = await supabase.from('clients').insert({
    email: customer_email,
    name: stripeCustomer.name,
    company: metadata.company_name,
    metadata: { plan_selected: metadata.plan_tier }
  }).select().single();

  // 3. Create subscription record
  await supabase.from('subscriptions').insert({
    client_id: client.id,
    stripe_subscription_id: stripeSub.id,
    stripe_customer_id: customer,
    plan_tier: metadata.plan_tier,
    status: stripeSub.status,
    current_period_start: new Date(stripeSub.current_period_start * 1000),
    current_period_end: new Date(stripeSub.current_period_end * 1000),
  });

  // 4. Create Basecamp project via Solomon MCP
  const bcProject = await createBasecampProject({
    name: `${stripeCustomer.name} — Slacked Services`,
    template: 'client-engagement-template',
    clientEmail: customer_email,
  });

  // 5. Create Google Drive folder
  const driveFolder = await createDriveFolder({
    name: `Client — ${stripeCustomer.name}`,
    parent: 'Slacked Client Files',
  });

  // 6. Link everything in client_projects
  await supabase.from('client_projects').insert({
    client_id: client.id,
    bc_project_id: bcProject.id,
    drive_folder_id: driveFolder.id,
  });

  // 7. Initialize onboarding steps
  const steps = [
    { step_number: 1, step_name: 'Business Information' },
    { step_number: 2, step_name: 'Goals & Target Audience' },
    { step_number: 3, step_name: 'Brand Assets Upload' },
    { step_number: 4, step_name: 'Competitor Analysis & Preferences' },
  ];
  await supabase.from('onboarding_steps').insert(
    steps.map(s => ({ client_id: client.id, ...s }))
  );

  // 8. Send welcome email
  await sendWelcomeEmail({
    to: customer_email,
    name: stripeCustomer.name,
    dashboardUrl: `https://slacked.co/dashboard`,
    basecampInviteUrl: bcProject.invite_url,
  });
}
```

### Deliverable Tracking System

Deliverables are tracked in both Supabase and Basecamp simultaneously:

1. **Creation:** Solomon creates a deliverable record in Supabase AND a Basecamp todo in the client's project
2. **Progress:** Agent updates status in Supabase; Basecamp todo description updated with latest draft link
3. **Client Review:** Client comments on Basecamp todo → Solomon webhook picks up comment → mirrors to dashboard messages
4. **Approval:** Client checks off todo OR comments "approved" → status updated to `approved` in both systems
5. **Deployment:** Team deploys (publishes blog, launches ad, etc.) → status set to `live`

---

## 6. Basecamp Auto-Provisioning

When a new client pays, Solomon creates a Basecamp project from a template structure:

```
📁 {Client Name} — Slacked Services
├── 📋 Deliverables (client-visible)
│   ├── [Todo] Blog Post: "{topic}" — Due {date}
│   ├── [Todo] Social Media Pack — Week of {date}
│   └── [Todo] Monthly Analytics Report — {month}
│
├── 📋 Onboarding Checklist (client-visible)
│   ├── [Todo] Complete Business Info Form
│   ├── [Todo] Upload Brand Assets
│   ├── [Todo] Review & Approve Strategy Doc
│   └── [Todo] Approve First Deliverable Batch
│
├── 💬 Updates & Communication (client-visible)
│   ├── [Message] Welcome to Slacked!
│   ├── [Message] Week 1 Update
│   └── [Message] Monthly Report — {month}
│
├── 📋 Internal: Agent Dispatch (hidden from client)
│   ├── [Todo] Generate 4 blog posts — Atlas
│   ├── [Todo] Create social graphics — Aria
│   └── [Todo] Run competitive audit — Atlas
│
├── 📋 Internal: Cost Tracking (hidden from client)
│   └── [Todo] March 2026: $47.23 API costs
│
└── 📋 Internal: Strategy Notes (hidden from client)
    └── [Message] Discovery call notes + strategy
```

**Client access control:** Basecamp's native "Client" role limits visibility. Clients see only lists/messages not marked as internal. This is critical — they must never see agent dispatch logs, cost data, or draft iterations.

---

## 7. AI Communication Loop

The AI communication loop is how Solomon handles client messages without Forrest needing to be hands-on:

```
Client writes message (BC comment, dashboard, or email)
    │
    ▼
Solomon receives message (BC webhook or Supabase realtime)
    │
    ▼
Context assembly:
    ├── Client profile (industry, preferences, communication style)
    ├── Subscription tier (determines SLA + formality level)
    ├── Recent deliverables (last 30 days)
    ├── Open todos (what's pending)
    ├── Conversation history (last 10 messages)
    │
    ▼
Classification:
    ├── ROUTINE (status check, thank you, simple question) → auto-respond
    ├── FEEDBACK (deliverable revision request) → update deliverable + dispatch agent
    ├── BILLING (payment question, upgrade request) → respond + flag if action needed
    ├── ESCALATION (complaint, scope dispute, cancellation) → flag Forrest immediately
    │
    ▼
Response generation (Gemini via Solomon brain):
    ├── Tone: professional, warm, specific to their industry
    ├── Always reference specific deliverables by name
    ├── Include next steps and timeline
    ├── Never promise something not in their tier
    │
    ▼
Post response to BC + mirror to dashboard messages table
```

**SLA enforcement:**
- Solomon checks unread messages every 15 minutes
- If a message from a Growth/Premium client is 4+ hours old with no response → Forrest gets Telegram alert
- If any message is 20+ hours old → critical alert

---

## 8. Edge Cases & Resilience

| Edge Case | Detection | Handling | Fallback |
|-----------|-----------|----------|----------|
| **Failed payment** | `invoice.payment_failed` webhook | Email client with Stripe portal link. 7-day grace. | After 14 days: cancel subscription, archive BC project, notify Forrest |
| **Scope creep** | Client requests work outside tier | AI classifies request against tier deliverables. If out-of-scope → suggest upgrade. | Forrest reviews if ambiguous |
| **Client churn signal** | Declining engagement (no BC logins, no comments for 14+ days) | Automated "check-in" message. If 30 days inactive → Forrest alert with win-back offer draft | Manual outreach with case study/ROI data |
| **Deliverable quality dispute** | Client marks deliverable as "rejected" or leaves negative feedback | Immediate re-dispatch with client's exact feedback. Forrest notified. Max 2 revision cycles before human intervention | Forrest calls client directly |
| **Stripe webhook failure** | Missing expected events (no `invoice.paid` after 48h of period end) | Cron job checks Stripe API directly every 6 hours for subscription status sync | Manual reconciliation |
| **Basecamp project creation fails** | API error during provisioning | Retry 3x with exponential backoff. If all fail → Forrest Telegram alert with client details | Manual BC project creation from template |
| **Duplicate checkout** | Same email, two `checkout.session.completed` events | Idempotency check: if client + subscription already exists, skip provisioning | Log and alert |
| **Client adds team member** | Client invites colleague to BC or asks for dashboard access | Supported: multiple users per client via `client_team_members` join table | Forrest approves new user |
| **Mid-cycle upgrade** | Client upgrades from Essentials → Growth | Stripe proration handled automatically. Supabase `plan_tier` updated via webhook. Deliverable cadence increased immediately | Notify Solomon to dispatch additional agent tasks |
| **Data deletion request** | Client requests account deletion (GDPR/CCPA) | Delete Supabase records, archive BC project, cancel Stripe subscription, confirm via email | Forrest approves before execution |

---

## 9. Phased Rollout

### Phase 0: Payment-Ready (Days 1–2) ← **THIS WEEK**
- [ ] Configure real Stripe API keys in Vercel
- [ ] Create Stripe products/prices for all 3 tiers
- [ ] Set up Stripe webhook endpoint (`/api/webhooks/stripe`)
- [ ] Replace Calendly placeholder with real URL
- [ ] Wire onboarding form to Supabase
- [ ] Test full checkout → provisioning flow end-to-end

**Success criteria:** A test card payment creates a client record in Supabase.

### Phase 1: First Client (Days 3–7)
- [ ] Add 3rd pricing tier (Premium) to `/plans`
- [ ] Deploy Supabase schema (all 7 tables above)
- [ ] Implement auto-provisioning webhook handler
- [ ] Create Basecamp project template
- [ ] Build welcome email template (Nodemailer)
- [ ] Manual smoke test: full prospect → paying client flow

**Success criteria:** First real client completes checkout, sees dashboard, has BC project.

### Phase 2: Delivery Engine (Weeks 2–3)
- [ ] Solomon integration: poll new clients from Supabase, dispatch onboarding agents
- [ ] Deliverable pipeline: agent creates → QA reviews → client approves
- [ ] BC webhook: client comments sync to dashboard messages
- [ ] Monthly report auto-generation
- [ ] Case study page (`/work`) with first client results (anonymized if needed)

**Success criteria:** Deliverables flowing through pipeline without manual intervention.

### Phase 3: Scale & Retention (Weeks 4–8)
- [ ] Churn detection automation
- [ ] SLA monitoring and alerting
- [ ] Client NPS survey automation (quarterly)
- [ ] Blog + SEO content pipeline
- [ ] Referral program ("Refer a business, get 1 month free")
- [ ] Upgrade nudge automation (usage-based triggers)

**Success criteria:** 5+ active clients, <5% monthly churn, NPS > 50.

---

## 10. Prioritization: First Paying Client This Week

**The critical path to revenue has exactly 6 steps:**

| # | Task | Blocker? | Time Estimate | Owner |
|---|------|----------|--------------|-------|
| 1 | Set real Stripe keys in Vercel env vars | **YES — nothing works without this** | 15 min | Forrest |
| 2 | Create 3 Stripe Products + Prices (Essentials $499, Growth $999, Premium $2,500) | YES | 20 min | Forrest/Solomon |
| 3 | Replace Calendly placeholder URL on `/book` | YES — can't book calls | 5 min | Rowan |
| 4 | Wire `/api/webhooks/stripe` to handle `checkout.session.completed` | YES — payment doesn't create client | 2 hours | Rowan |
| 5 | Wire onboarding form submission to Supabase | Nice-to-have for Day 1 | 1 hour | Rowan |
| 6 | Deploy Supabase tables (clients + subscriptions minimum) | YES | 30 min | Rowan |

**Total to payment-ready: ~4 hours of dev work + Forrest's Stripe setup.**

Everything else (BC auto-provisioning, AI communication loop, deliverable pipeline) can run manually for the first 1–3 clients while automation is built. The first client's BC project can be created by hand. The first deliverables can be dispatched manually. **Don't let automation block revenue.**

---

## 11. Growth & Retention Mechanics

| Lever | Mechanism | Expected Impact |
|-------|-----------|----------------|
| **Social proof loop** | Every client engagement → anonymized case study → landing page | +20% conversion rate |
| **Referral program** | Refer a business → 1 month free for both | 15-25% of new clients from referrals |
| **Upgrade triggers** | Client hits deliverable limits → automated upgrade nudge with ROI projection | 10-15% upgrade rate per quarter |
| **QBR lock-in** | Quarterly business review showing cumulative ROI makes cancellation feel like losing an investment | -30% churn vs. agencies without QBRs |
| **Content flywheel** | Blog posts we write for clients → demonstrate our capability → attract new prospects | Compounding organic traffic |
| **Basecamp transparency** | Clients see exactly what's happening, reducing anxiety and support tickets | 40% fewer "what's happening?" messages |

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Stripe keys not configured** | HIGH (currently true) | CRITICAL — zero revenue | Forrest configures this week |
| **First client has bad experience** | MEDIUM | HIGH — reputation damage | Over-deliver on first 3 clients manually |
| **AI deliverable quality too low** | MEDIUM | HIGH — churn | Human QA layer on all deliverables for first 90 days |
| **Solomon downtime during client message** | LOW | MEDIUM — missed SLA | Cron-based fallback checks every 30 min |
| **Basecamp API rate limits** | LOW | LOW — delayed provisioning | Exponential backoff + queue |
| **Competitor launches similar AI agency model** | MEDIUM | MEDIUM | Speed to market + Forrest's personal brand as moat |

---

## 13. Open Questions for Forrest

1. **Stripe account:** Is slacked.co connected to an active Stripe account? Do you need to create one?
2. **Calendly:** What's the real Calendly link to replace the placeholder?
3. **Tier 3 pricing:** Is Premium $2,500/mo or $5,000/mo? The blueprint says $5K but the codebase historically had $7,497.
4. **First target client:** Do you have someone in mind for the first paid engagement? A warm lead shortens time-to-revenue dramatically.
5. **Client communication ownership:** Should Solomon auto-respond to all routine messages, or do you want to review responses for the first few clients?
6. **Basecamp client access:** Have you tested inviting an external user as a "Client" to a BC project? Need to verify the visibility controls work as expected.
7. **Domain for client emails:** Will welcome emails come from `hello@slacked.co` or a different address? Need DNS records (SPF/DKIM) configured.
8. **Supabase project:** Is the current Supabase project the one to use for production client data, or should we create a separate production instance?

---

*This plan was prepared by the Slacked.co strategy team. It covers the complete system from prospect acquisition through client retention. The critical path to first revenue requires approximately 4 hours of development and Forrest's Stripe configuration. Everything else can be built iteratively while serving the first clients manually.*

*Total word count: ~3,200 words*
