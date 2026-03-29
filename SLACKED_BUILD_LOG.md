# Slacked.co Build Log
_Written by Claude Sonnet 4.6 on 2026-03-24. Read this before touching the site._

## What This Site Is
DFY (done-for-you) marketing agency targeting real estate agents and brokers.
Like spp.co / Wayfront: clients sign up, pay retainer, book onboarding call via Calendly.

**Packages:**
- Agent Essentials — $499/mo (SEO, 2 blog posts, 1 landing page, 4 social graphics, GBP)
- Agent Growth — $999/mo (everything above × more, 3 pages, 8 social posts, CRM setup, 1:1 call)

**Target:** Solo agents and brokerages. Real estate focused only.

## Stack
- Next.js 16.1.6 (App Router)
- React 19
- Tailwind v4
- NextAuth v5 (Google OAuth — for future dashboard login)
- Deployed on Vercel (auto-deploy from `main` branch on GitHub)

## Key Files
| File | Purpose |
|---|---|
| `src/app/page.tsx` | Public marketing landing page |
| `src/app/onboarding/page.tsx` | 4-step onboarding form + Calendly embed |
| `src/app/layout.tsx` | Root layout, metadata, fonts |
| `src/app/dashboard/page.tsx` | Client dashboard (future — currently mock data) |
| `src/auth.ts` | NextAuth v5 config (Google OAuth) |
| `src/middleware.ts` | Route protection (dashboard requires login) |
| `next.config.ts` | Webpack forced (Turbopack has workspace root bug in v16) |

## Build Quirk — Use `--webpack`
Next.js 16 defaults to Turbopack for builds, but it throws a workspace root error when
the `src/app` directory doesn't contain `next/package.json`. Fix is to force webpack:

```bash
next build --webpack
```

This is set in `package.json` scripts so Vercel picks it up automatically.

## Design System
All inline styles (no Tailwind classes used in landing page — faster iteration).

| Token | Value | Use |
|---|---|---|
| Background | `#05060a` | Page bg |
| Accent cyan | `#00d2ff` | Primary CTAs, logo |
| Accent green | `#00e5a0` | Gradient endpoint, dots |
| Text primary | `#e2e8f0` | Body copy |
| Text muted | `#94a3b8` | Subtitles |
| Text dim | `#64748b` | Labels, nav links |
| Border | `rgba(255,255,255,0.06)` | Dividers |

Gradient: `linear-gradient(135deg, #00d2ff, #00e5a0)` — used on primary CTAs and h1 accent text.

## Landing Page Structure (`page.tsx`)
1. **Nav** — sticky, blur backdrop, Book a Call CTA → `/onboarding`
2. **Hero** — headline, subhead, two CTAs
3. **Credentials Bar** — 5 trust signals (Oak Forest, 45+ contractor agency, $50K+/mo, Austin TX, AI-native)
4. **Stats row** — 45+ contractors, 12 yrs marketing, $499, 100% RE focused
5. **Problem section** — "You're busy. Marketing falls apart."
6. **Services** — 6 cards (landing pages, local SEO, content, social graphics, email, ops/admin)
7. **How It Works** — 3 steps (form → call → we handle it)
8. **Packages** — 2 cards ($499 Essentials, $999 Growth highlighted)
9. **About Forrest** — Oak Forest Realty, 45+ contractor agency, AI-native workflow, 12 yrs RE
10. **FAQ** — 6 items
11. **Final CTA** — dark card, "Book a Free 30-Min Strategy Call" button
12. **Footer** — copyright, legal links

All CTAs route to `/onboarding` (not external Calendly directly — capture info first).

## Onboarding Form (`onboarding/page.tsx`)
4-step client-side form (no server component — `"use client"`):

1. **About You** — name, email, phone, brokerage, market area, years active
2. **What You Need** — 8 checkboxes (website, SEO, blog, social, email, CRM, listing pages, other) + biggest challenge dropdown + existing website question
3. **Package Selection** — $499 / $999 / unsure radio, timeline dropdown, notes textarea
4. **Book a Call** — Calendly iframe embedded

### Calendly Setup (TODO for Forrest)
```tsx
const CALENDLY_URL = "https://calendly.com/forrestwebber/strategy-call"
```
Replace with your actual Calendly link. In Calendly settings:
- Event duration: 30 min
- Buffer after: 30 min (so your calendar blocks 60 min total)

### Form Submission (TODO)
Step 3 "Next" button has a comment: `// TODO: wire up to your CRM / Supabase / email notification`
Currently just advances to step 4. Wire up with:
- `fetch('/api/onboarding', { method: 'POST', body: JSON.stringify(formData) })`
- Create `src/app/api/onboarding/route.ts` → sends email (Resend/SendGrid) or writes to Supabase

## Credentials Bar
No real press coverage exists on forrestwebber.com (verified 2026-03-24).
Used honest credential signals instead of fake "as seen in" logos:
- Managing Partner, Oak Forest Realty
- 45+ Contractor Agency (scaled & exited)
- $50K+/mo Digital Assets Built
- Austin, TX (investor & developer)
- AI-Native Stack

**Do NOT add fake press logos** unless Forrest confirms actual coverage.

## Deployment
- GitHub repo: `forrestwebber/slacked-co`
- Vercel project connected to `main` branch
- Auto-deploys on every push to `main`
- Domain: slacked.co (already configured in Vercel)

## What's Left
- [ ] Replace `CALENDLY_URL` placeholder with real link
- [ ] Wire form submission to email/CRM (Step 3 → API route)
- [ ] Connect payments (Stripe — when ready to sell)
- [ ] Client dashboard (`/dashboard`) — currently mock data, needs real backend
- [ ] Blog/SEO content (could be Ellie's job once agent loop is stable)

## How to Make Changes
1. Edit files in `src/app/`
2. Test locally: `npm run dev` (runs at localhost:3000)
3. Build check: `npm run build` (uses webpack per package.json)
4. Deploy: `git push origin main` → Vercel auto-deploys

Rowan: do NOT use `next dev --turbopack` or `next build --turbopack`. Use webpack. See above.
