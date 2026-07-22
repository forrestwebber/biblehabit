#!/bin/bash
set -e

PROJECT="biblehabit"
SITE_URL="https://biblehabit.co"
CF_ACCOUNT="34208a85c5a0f9081409c583d7add798"
CF_EMAIL="hello@forrestwebber.com"
CF_API_KEY="018b059f82440aa5b75972845bf9313c4b5b8"

echo "=== Deploying $PROJECT ==="

echo "1. Building..."
npm run pages:build

echo "2. Assembling assets..."
rm -rf .open-next/assets && mkdir -p .open-next/assets
cp .open-next/worker.js .open-next/assets/_worker.js
[ -d .open-next/cloudflare ]         && cp -r .open-next/cloudflare .open-next/assets/
[ -d .open-next/middleware ]         && cp -r .open-next/middleware .open-next/assets/
[ -d .open-next/server-functions ]   && cp -r .open-next/server-functions .open-next/assets/
[ -d .open-next/.build ]             && cp -r .open-next/.build .open-next/assets/.build
[ -d .next/static ]                  && mkdir -p .open-next/assets/_next && cp -r .next/static .open-next/assets/_next/
[ -d public ]                        && cp -rn public/. .open-next/assets/

cat > .open-next/assets/_routes.json << 'JSON'
{"version":1,"include":["/*"],"exclude":["/_next/static/*","/favicon.ico","/robots.txt","/*.svg","/*.png","/*.jpg","/*.jpeg","/*.gif","/*.webp","/*.ico"]}
JSON

echo "3. Recording pre-deploy snapshot..."
PREV_DEPLOY=$(curl -s   "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT/pages/projects/$PROJECT/deployments?per_page=1"   -H "X-Auth-Email: $CF_EMAIL"   -H "X-Auth-Key: $CF_API_KEY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['result'][0]['id'] if d.get('result') else '')" 2>/dev/null || echo "")

echo "4. Deploying to Cloudflare Pages..."
unset CLOUDFLARE_API_TOKEN
DEPLOY_OUT=$(npx wrangler pages deploy .open-next/assets \
  --project-name $PROJECT \
  --branch main \
  --commit-dirty=true 2>&1)
echo "$DEPLOY_OUT"

echo "5. Syncing to GitHub..."
git add -A
git diff --staged --quiet || git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')"
git push origin main || echo "⚠️  GitHub push failed — deploy succeeded, run: git push origin main"

echo "=== $PROJECT deploy complete! ==="
