#!/bin/bash
set -e

# BibleHabit deploys to VERCEL (project: biblehabit, scope: forrestwebber-5163s-projects).
# biblehabit.co DNS points at Vercel (76.76.21.21). The old Cloudflare Pages
# path (npm run pages:build + wrangler) is retired — do not resurrect it.

echo "=== Deploying biblehabit to Vercel ==="

echo "1. Building locally to catch errors early..."
npm run build

echo "2. Deploying to Vercel production..."
npx vercel deploy --prod --yes --scope forrestwebber-5163s-projects

echo "3. Verifying live site..."
sleep 5
curl -sI https://biblehabit.co | head -4

echo "4. Syncing to GitHub..."
git add -A
git diff --staged --quiet || git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')"
git push origin main || echo "GitHub push failed — deploy succeeded, run: git push origin main"

echo "=== biblehabit deploy complete ==="
