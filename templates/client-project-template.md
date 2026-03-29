# Slacked.co Client Project Template — Basecamp

## Overview
This document defines the standard Basecamp project structure for every new Slacked.co client.

**Live Demo Project:** https://3.basecamp.com/6048712/projects/46684247
**Demo Project Name:** "DEMO CLIENT - Slacked Services"
**Demo Project ID:** 46684247

---

## Template Structure

### 1. MESSAGE BOARD (Client-Visible)
**Welcome Message** — posted on project creation:
- "Welcome to Slacked Services" with onboarding steps
- Outlines 4-step process: Onboarding (Week 1), Strategy Session, Deliverables Begin (Week 2+), Monthly Reports
- Monthly performance reports also posted here on the 1st

### 2. TODO LISTS

#### A. "This Month's Deliverables" [CLIENT VISIBLE]
Purpose: Client tracks what we're delivering this month.
Sample todos:
- Website audit and recommendations report
- Google Business Profile optimization
- Social media content calendar (Month 1)

#### B. "Onboarding Checklist" [CLIENT VISIBLE]
Purpose: Everything we need from the client to start work.
Sample todos:
- Send brand colors, logo files, and fonts
- Share login access: Google Analytics, Search Console, social accounts
- Complete brand questionnaire (sent via email)
- Approve service agreement in Docs

#### C. "Internal Work Queue" [HIDDEN FROM CLIENT]
Purpose: Agent tasks and internal work items.
Sample todos:
- Run SEO baseline audit
- Set up analytics tracking and dashboards
- Build content pipeline in CMS
- Competitor analysis report

#### D. "Completed Archive" [CLIENT VISIBLE]
Purpose: Delivered work and completed milestones. Completed todos move here.

### 3. DOCS & FILES

#### A. "Service Agreement" [CLIENT VISIBLE]
- What the client gets (SEO, GBP, social, website maintenance, dedicated account manager)
- Communication SLA (24 business hours, updates via Basecamp, monthly reports on 1st)
- Terms (month-to-month, 30-day cancellation notice)
- Client confirms by checking "Approve service agreement" todo

#### B. "Brand Guidelines" [HIDDEN UNTIL FILLED]
- Brand identity: colors, fonts, logo files
- Voice & tone: personality, words to use/avoid
- Target audience: demographics, pain points, competitors

#### C. "Strategy Notes" [HIDDEN — INTERNAL ONLY]
- Client overview: industry, digital presence score, primary goal, budget tier
- 90-day plan (Month 1: audit/onboarding, Month 2: content ramp-up, Month 3: full velocity)
- Risk factors
- Upsell opportunities

---

## How to Create a New Client Project

### Via Basecamp CLI (Recommended — Solomon can automate)

```bash
# 1. Create the project
basecamp projects create "[CLIENT NAME] - Slacked Services" \
  -d "Slacked.co client project — DFY digital marketing services."

# 2. Create 4 todo lists (use project ID from step 1)
basecamp todolists create "This Month's Deliverables" -p [PROJECT_ID] -d "Current month's work items — track progress here"
basecamp todolists create "Onboarding Checklist" -p [PROJECT_ID] -d "Everything we need from you to get started"
basecamp todolists create "Internal Work Queue" -p [PROJECT_ID] -d "Internal team tasks — not visible to client"
basecamp todolists create "Completed Archive" -p [PROJECT_ID] -d "All delivered and approved work items"

# 3. Add onboarding todos
basecamp todos create "Send brand colors, logo files, and fonts" -p [PROJECT_ID] -l [ONBOARDING_LIST_ID]
basecamp todos create "Share login access: Google Analytics, Search Console, social accounts" -p [PROJECT_ID] -l [ONBOARDING_LIST_ID]
basecamp todos create "Complete brand questionnaire (sent via email)" -p [PROJECT_ID] -l [ONBOARDING_LIST_ID]
basecamp todos create "Approve service agreement in Docs" -p [PROJECT_ID] -l [ONBOARDING_LIST_ID]

# 4. Create 3 docs (HTML body content templates in this file's appendix)
basecamp docs documents create "Service Agreement" "[SERVICE_AGREEMENT_HTML]" -p [PROJECT_ID]
basecamp docs documents create "Brand Guidelines" "[BRAND_GUIDELINES_HTML]" -p [PROJECT_ID]
basecamp docs documents create "Strategy Notes" "[STRATEGY_NOTES_HTML]" -p [PROJECT_ID]

# 5. Post welcome message
basecamp messages create "Welcome to Slacked Services" "[WELCOME_HTML]" -p [PROJECT_ID]

# 6. Enable client access — add client as "Client" role via BC UI
# 7. Customize all [CLIENT NAME] and [pending] placeholders
```

### Client Visibility Rules
| Item | Client Sees? |
|------|-------------|
| Welcome Message | Yes |
| Monthly Reports | Yes |
| This Month's Deliverables | Yes |
| Onboarding Checklist | Yes |
| Internal Work Queue | **No** |
| Completed Archive | Yes |
| Service Agreement | Yes |
| Brand Guidelines | Yes (after onboarding) |
| Strategy Notes | **No** |

---

## API Template Note
Basecamp 4 supports project templates, but the API's template creation is read-only (you can create projects *from* templates, but not create new templates via API). Templates must be created via the Basecamp UI: **Admin > Templates > Save as Template**. Once saved, projects can be instantiated via `basecamp templates construct [TEMPLATE_ID] --name "[CLIENT]"`.

**Recommendation:** Save the demo project as a BC template via the UI, then use `templates construct` for future clients.

---

## IDs Reference (Demo Project — 46684247)

| Component | ID |
|---|---|
| Project | 46684247 |
| Message Board | 9729869487 |
| Todoset | 9729869490 |
| Docs & Files Vault | 9729869491 |
| This Month's Deliverables | 9729869726 |
| Onboarding Checklist | 9729869732 |
| Internal Work Queue | 9729869738 |
| Completed Archive | 9729869745 |
| Service Agreement doc | 9729869976 |
| Brand Guidelines doc | 9729870000 |
| Strategy Notes doc | 9729870115 |
| Welcome Message | 9729869718 |

---

*Updated: 2026-03-29*
*Template v2 — fully populated demo project with CLI automation script*
