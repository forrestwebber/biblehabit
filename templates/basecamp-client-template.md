# Slacked.co — Basecamp Client Project Template

## Overview
Reusable project template for onboarding new Slacked.co clients into Basecamp.
Each client gets a dedicated project with client-visible and internal-only sections.

## Demo Project
- **Name:** DEMO CLIENT - Slacked Services
- **Project ID:** 46682976
- **URL:** https://3.basecamp.com/6048712/projects/46682976

---

## Template Structure

### MESSAGE BOARD (Client-Visible)
**Welcome Message** — Posted automatically on project creation.
Contains:
- Onboarding steps (4-step process)
- Communication guidelines (Chat for quick Qs, Message Board for formal)
- What they can see vs. what's internal
- Monthly reports will be posted here

### TODO LISTS

| List Name | Visibility | Purpose |
|-----------|-----------|---------|
| This Month's Deliverables | CLIENT VISIBLE | Tracks current month's work items |
| Onboarding Checklist | CLIENT VISIBLE | What we need from the client |
| Internal Work Queue | HIDDEN | Agent tasks, internal ops |
| Completed Archive | CLIENT VISIBLE | Delivered work moved here |

#### Sample Todos — This Month's Deliverables
- Google Business Profile setup and optimization
- Website SEO audit and keyword research
- Social media content calendar (Month 1)

#### Sample Todos — Onboarding Checklist
- Send logo files (PNG, SVG preferred)
- Share Google Business Profile access
- Provide website admin/CMS login credentials
- Share social media account access
- Fill out brand guidelines questionnaire

#### Sample Todos — Internal Work Queue
- Run initial website crawl and technical audit
- Build competitor analysis report
- Set up analytics tracking (GA4 + Search Console)

### DOCS & FILES

| Document | Visibility | Purpose |
|----------|-----------|---------|
| Service Agreement | CLIENT VISIBLE | What's included in their plan |
| Brand Guidelines | HIDDEN until filled | Brand info questionnaire we collect |
| Strategy Notes | HIDDEN | Internal planning and strategy |

---

## How to Create a New Client Project (Solomon Playbook)

### Basecamp does NOT support project templates via API creation.
The API has a `POST /templates/:id/project_constructions.json` endpoint to create projects FROM existing templates, but templates themselves must be created via the Basecamp UI.

### Option A: Use BC UI to Save as Template (Recommended)
1. Go to the DEMO project: https://3.basecamp.com/6048712/projects/46682976
2. Click the project name → "Save as Template"
3. Name it "Slacked Client Template"
4. For each new client: Create project from template, rename to "[CLIENT NAME] - Slacked Services"

### Option B: Automated via Solomon (CLI Script)
Solomon can replicate this structure programmatically using the basecamp CLI:

```bash
# 1. Create project
basecamp projects create "[CLIENT] - Slacked Services" -d "Slacked.co DFY marketing services"

# 2. Post welcome message
basecamp messages create "Welcome to Slacked Services!" "<welcome HTML>" -p [PROJECT_ID]

# 3. Create todo lists
basecamp todolists create "This Month's Deliverables" -p [PROJECT_ID] -d "CLIENT VISIBLE"
basecamp todolists create "Onboarding Checklist" -p [PROJECT_ID] -d "CLIENT VISIBLE"
basecamp todolists create "Internal Work Queue" -p [PROJECT_ID] -d "HIDDEN FROM CLIENT"
basecamp todolists create "Completed Archive" -p [PROJECT_ID] -d "CLIENT VISIBLE"

# 4. Add onboarding todos (use -l [LIST_ID] for each)
basecamp todos create "Send logo files (PNG, SVG preferred)" -p [PROJECT_ID] -l [ONBOARDING_LIST_ID]
basecamp todos create "Share Google Business Profile access" -p [PROJECT_ID] -l [ONBOARDING_LIST_ID]
basecamp todos create "Provide website admin/CMS login credentials" -p [PROJECT_ID] -l [ONBOARDING_LIST_ID]
basecamp todos create "Share social media account access" -p [PROJECT_ID] -l [ONBOARDING_LIST_ID]
basecamp todos create "Fill out brand guidelines questionnaire" -p [PROJECT_ID] -l [ONBOARDING_LIST_ID]

# 5. Create docs
basecamp docs documents create "Service Agreement" "<service agreement HTML>" -p [PROJECT_ID]
basecamp docs documents create "Brand Guidelines" "<brand guidelines HTML>" -p [PROJECT_ID]
basecamp docs documents create "Strategy Notes" "<strategy notes HTML>" -p [PROJECT_ID]
```

### Option C: API Template Construction
If a template is saved via the UI (Option A), Solomon can create new projects from it:
```
POST /templates/:template_id/project_constructions.json
{
  "project": {
    "name": "[CLIENT] - Slacked Services",
    "description": "Slacked.co DFY marketing services for [CLIENT]"
  }
}
```

---

## Client Visibility Rules

When adding a client as a "Client" role in Basecamp:
- **Visible by default:** Message Board, Chat, all todo lists (unless explicitly hidden)
- **Must manually hide:** Internal Work Queue, Strategy Notes, Brand Guidelines (until filled)
- Use Basecamp's "Client side" toggle on each tool/list to control visibility

## Post-Creation Checklist
1. ✅ Create project with client name
2. ✅ Post welcome message
3. ✅ Create all 4 todo lists with sample items
4. ✅ Create all 3 docs with templates
5. ☐ Invite client as "Client" role
6. ☐ Hide Internal Work Queue from client view
7. ☐ Hide Strategy Notes from client view
8. ☐ Hide Brand Guidelines until client fills it out
9. ☐ Customize Service Agreement with actual plan details
10. ☐ Set up month's deliverables based on client's plan

---

## All Created IDs (Demo Project)

| Item | BC ID |
|------|-------|
| Project | 46682976 |
| Message Board | 9729608341 |
| Welcome Message | 9729608534 |
| Todoset | 9729608342 |
| This Month's Deliverables (list) | 9729608618 |
| Onboarding Checklist (list) | 9729608636 |
| Internal Work Queue (list) | 9729608647 |
| Completed Archive (list) | 9729608660 |
| Docs Vault | 9729608344 |
| Service Agreement (doc) | 9729609009 |
| Brand Guidelines (doc) | 9729609042 |
| Strategy Notes (doc) | 9729609102 |

Created: 2026-03-29
