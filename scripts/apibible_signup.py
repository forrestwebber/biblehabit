#!/usr/bin/env python3
"""
api.bible signup script
- Gets to Step 2 with all fields filled
- Prints a LOUD prompt to solve reCAPTCHA
- Waits up to 10 min for form to advance past Step 2
- Automatically handles Steps 3 and 4
- Retrieves and saves the API key
- Queries GET /v1/bibles for NIV and ESV Bible IDs

Credentials:
  email: hello@biblehabit.co
  password: BibleHabit2026!
"""

import asyncio
import os
import re
import json
import urllib.request
import urllib.error
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/apibible"


def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"


def get_bibles(api_key):
    """Query api.bible for all Bible translations and find NIV/ESV IDs."""
    url = "https://api.scripture.api.bible/v1/bibles"
    req = urllib.request.Request(url, headers={"api-key": api_key})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            bibles = data.get("data", [])
            results = {}
            for bible in bibles:
                abbr = (bible.get("abbreviation") or "").upper()
                name = bible.get("name", "")
                bid = bible.get("id", "")
                if "NIV" in abbr or "New International" in name:
                    results.setdefault("NIV", []).append({"id": bid, "name": name, "abbr": abbr})
                if "ESV" in abbr or "English Standard" in name:
                    results.setdefault("ESV", []).append({"id": bid, "name": name, "abbr": abbr})
            return results, bibles
    except Exception as e:
        return {"error": str(e)}, []


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=200,
            args=["--no-sandbox"]
        )
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()

        # ── STEP 1 ───────────────────────────────────────────────────────────
        print("Navigating to api.bible signup...")
        try:
            await page.goto("https://api.bible/sign-up/starter", wait_until="domcontentloaded", timeout=25000)
        except Exception as e:
            print(f"Navigation warning: {e}")
        await page.wait_for_timeout(4000)
        await page.screenshot(path=ss("01_step1"))
        print(f"URL: {page.url}")

        # App name
        await page.evaluate("""() => {
            const el = document.getElementById('appName');
            if(el) {
                el.value = 'BibleHabit';
                el.dispatchEvent(new Event('input', {bubbles:true}));
                el.dispatchEvent(new Event('change', {bubbles:true}));
            }
        }""")

        # "No revenue" radio
        await page.evaluate("""() => {
            document.querySelectorAll('label').forEach(l => {
                if(l.textContent.toLowerCase().includes('no, there will be no')) l.click();
            });
        }""")

        # "0-1K" user count radio
        await page.evaluate("""() => {
            document.querySelectorAll('label').forEach(l => {
                if(l.textContent.trim() === '0-1K') l.click();
            });
        }""")
        await page.wait_for_timeout(500)

        # Click Continue
        await page.evaluate("""() => {
            document.querySelectorAll('button').forEach(b => {
                if(b.textContent.trim() === 'Continue') b.click();
            });
        }""")
        await page.wait_for_timeout(2500)

        # Dismiss "Are you sure?" dialog if present
        dismissed = await page.evaluate("""() => {
            for(const b of document.querySelectorAll('button')) {
                if(['Yes, continue', 'Yes'].includes(b.textContent.trim())) {
                    b.click();
                    return b.textContent.trim();
                }
            }
            return null;
        }""")
        if dismissed:
            print(f"Dismissed dialog: {dismissed}")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("02_step2"))

        body = await page.inner_text("body")
        if "Step 2" not in body:
            print(f"WARNING: Not on Step 2. Body: {body[:200]}")

        # ── STEP 2 ───────────────────────────────────────────────────────────
        print("Filling Step 2 fields...")

        # Basic text fields
        await page.evaluate("""() => {
            const fields = {
                firstName: 'BibleHabit',
                lastName: 'App',
                organizationName: 'BibleHabit',
                email: 'hello@biblehabit.co'
            };
            for(const [id, val] of Object.entries(fields)) {
                const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
                if(el) {
                    el.value = val;
                    el.dispatchEvent(new Event('input', {bubbles:true}));
                    el.dispatchEvent(new Event('change', {bubbles:true}));
                }
            }
        }""")

        await page.wait_for_timeout(500)

        # Org Type dropdown → Individual
        print("Selecting org type: Individual")
        await page.evaluate("""() => {
            for(const b of document.querySelectorAll('button')) {
                const txt = b.textContent.toLowerCase();
                if(txt.includes('organization type') || txt.includes('select your org')) {
                    b.click();
                    return;
                }
            }
        }""")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=ss("03_org_type_open"))

        await page.evaluate("""() => {
            for(const opt of document.querySelectorAll('[role="option"], li')) {
                if(opt.textContent.trim() === 'Individual' && opt.offsetParent !== null) {
                    opt.click();
                    return;
                }
            }
            // broader fallback
            for(const el of document.querySelectorAll('*')) {
                if(el.textContent.trim() === 'Individual' && el.offsetParent !== null &&
                   ['LI', 'DIV', 'SPAN', 'BUTTON', 'A'].includes(el.tagName)) {
                    el.click();
                    return;
                }
            }
        }""")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=ss("04_org_type_selected"))

        # Location dropdown → United States
        print("Selecting location: United States")
        await page.evaluate("""() => {
            for(const b of document.querySelectorAll('button')) {
                const txt = b.textContent.toLowerCase();
                if(txt.includes('organization location') || txt.includes('country') || txt.includes('select location')) {
                    b.click();
                    return;
                }
            }
        }""")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=ss("05_location_open"))

        await page.evaluate("""() => {
            for(const opt of document.querySelectorAll('[role="option"], li')) {
                if(opt.textContent.trim() === 'United States' && opt.offsetParent !== null) {
                    opt.click();
                    return;
                }
            }
        }""")
        await page.wait_for_timeout(1000)

        # Re-fill fields in case React reset them after dropdown selections
        await page.evaluate("""() => {
            const fields = {
                firstName: 'BibleHabit',
                lastName: 'App',
                organizationName: 'BibleHabit',
                email: 'hello@biblehabit.co'
            };
            for(const [id, val] of Object.entries(fields)) {
                const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
                if(el && !el.value) {
                    el.value = val;
                    el.dispatchEvent(new Event('input', {bubbles:true}));
                    el.dispatchEvent(new Event('change', {bubbles:true}));
                }
            }
            // Passwords
            document.querySelectorAll('input[type=password]').forEach(inp => {
                if(!inp.value) {
                    inp.value = 'BibleHabit2026!';
                    inp.dispatchEvent(new Event('input', {bubbles:true}));
                    inp.dispatchEvent(new Event('change', {bubbles:true}));
                }
            });
        }""")
        await page.wait_for_timeout(800)

        # Check current form state
        form_state = await page.evaluate("""() => {
            const state = {};
            document.querySelectorAll('input:not([type=hidden])').forEach(inp => {
                const key = inp.id || inp.name || inp.placeholder || 'unknown';
                state[key] = inp.value ? (inp.type === 'password' ? '***filled***' : inp.value) : '';
            });
            document.querySelectorAll('[role="combobox"]').forEach(el => {
                state['combo_' + (el.id || el.getAttribute('name') || 'x')] = el.textContent.trim();
            });
            return state;
        }""")
        print(f"Form state: {form_state}")

        await page.screenshot(path=ss("06_step2_filled"))

        print("\n" + "=" * 70)
        print("  *** ACTION REQUIRED: SOLVE reCAPTCHA ***")
        print("")
        print("  Look at the Chromium browser window that just opened.")
        print("  1. Check all fields are filled correctly")
        print("  2. Click the reCAPTCHA checkbox 'I'm not a robot'")
        print("  3. Complete any image challenge if it appears")
        print("  4. Click the 'Create Account' button")
        print("")
        print("  Waiting up to 10 minutes...")
        print("=" * 70)

        # Wait up to 10 min for the page to advance past Step 2
        api_key = None
        for i in range(120):  # 120 × 5s = 600s = 10 min
            await asyncio.sleep(5)
            cur_url = page.url
            try:
                cur_body = await page.inner_text("body")
            except Exception:
                cur_body = ""

            # Take screenshots periodically
            if i % 6 == 0:
                await page.screenshot(path=ss(f"07_wait_{i:03d}"))
                print(f"  {i*5}s — url: {cur_url[:80]}")

            # Detect advancement past Step 2
            past_step2 = (
                "Step 3" in cur_body or
                "Step 4" in cur_body or
                "sign-up/starter" not in cur_url or
                any(kw in cur_body.lower() for kw in [
                    "api key", "your key", "dashboard", "application created",
                    "congratulations", "success", "get started"
                ])
            )

            if past_step2:
                print(f"\nAdvanced past Step 2! URL: {cur_url}")
                break

        await page.screenshot(path=ss("08_after_captcha"))

        # ── STEP 3 & 4 (auto-click Continue) ────────────────────────────────
        for attempt in range(6):
            await page.wait_for_timeout(2000)
            try:
                cur_url = page.url
                cur_body = await page.inner_text("body")
            except Exception:
                break

            print(f"Post-captcha attempt {attempt}: {cur_url[:80]}")
            print(f"  Body: {cur_body[:150]}")

            # Extract any visible API key
            key_matches = re.findall(r'\b([a-f0-9]{32,})\b', cur_body)
            if key_matches:
                api_key = key_matches[0]
                print(f"\n*** API KEY FOUND: {api_key} ***")

            # Also look for longer alphanumeric keys
            long_tokens = re.findall(r'\b([A-Za-z0-9_-]{40,})\b', cur_body)
            if long_tokens:
                print(f"Long tokens: {long_tokens[:3]}")
                if not api_key:
                    api_key = long_tokens[0]

            # Auto-click Continue/Next/Done
            clicked = await page.evaluate("""() => {
                for(const b of document.querySelectorAll('button, [type="submit"]')) {
                    const t = b.textContent.trim();
                    if(['Continue', 'Next', 'Finish', 'Done', 'Get API Key', 'View Dashboard'].includes(t) && b.offsetParent !== null) {
                        b.click();
                        return t;
                    }
                }
                return null;
            }""")
            if clicked:
                print(f"  Clicked: {clicked}")
                await page.wait_for_timeout(3000)
                await page.screenshot(path=ss(f"09_step_{attempt}"))

            # Check if we left the signup flow
            if "sign-up/starter" not in page.url:
                break

        # ── FINAL STATE ──────────────────────────────────────────────────────
        await page.screenshot(path=ss("10_final"))
        try:
            final_body = await page.inner_text("body")
        except Exception:
            final_body = ""
        final_url = page.url

        print(f"\n=== FINAL STATE ===")
        print(f"URL: {final_url}")
        print(f"Body (first 3000 chars):\n{final_body[:3000]}")

        # Last attempt to extract API key from page
        if not api_key:
            # Look for anything that looks like an API key
            candidates = re.findall(r'\b([A-Za-z0-9_-]{30,})\b', final_body)
            for c in candidates:
                if not c.startswith("http") and not c[0].isdigit():
                    api_key = c
                    print(f"\nPotential API key from page: {api_key}")
                    break

        # ── TRY DASHBOARD FOR API KEY ────────────────────────────────────────
        if not api_key:
            print("\nChecking dashboard for API key...")
            try:
                await page.goto("https://api.bible/dashboard", wait_until="domcontentloaded", timeout=15000)
            except Exception:
                pass
            await page.wait_for_timeout(3000)
            await page.screenshot(path=ss("11_dashboard"))
            dash_body = await page.inner_text("body")
            print(f"Dashboard: {dash_body[:500]}")

            candidates = re.findall(r'\b([A-Za-z0-9_-]{30,})\b', dash_body)
            for c in candidates:
                if not c.startswith("http") and not c[0].isdigit():
                    api_key = c
                    print(f"API key from dashboard: {api_key}")
                    break

        # ── BIBLE IDs ────────────────────────────────────────────────────────
        if api_key:
            print(f"\n=== QUERYING BIBLES WITH KEY: {api_key} ===")
            niv_esv, all_bibles = get_bibles(api_key)
            if "error" in niv_esv:
                print(f"Bible query error: {niv_esv['error']}")
            else:
                print("\n--- NIV Bible IDs ---")
                for b in niv_esv.get("NIV", []):
                    print(f"  ID: {b['id']}  Name: {b['name']}  Abbr: {b['abbr']}")
                print("\n--- ESV Bible IDs ---")
                for b in niv_esv.get("ESV", []):
                    print(f"  ID: {b['id']}  Name: {b['name']}  Abbr: {b['abbr']}")
                print(f"\nTotal bibles returned: {len(all_bibles)}")

            # Save results to file
            results = {
                "api_key": api_key,
                "niv": niv_esv.get("NIV", []),
                "esv": niv_esv.get("ESV", []),
            }
            out_path = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/api_bible_results.json"
            with open(out_path, "w") as f:
                json.dump(results, f, indent=2)
            print(f"\nResults saved to: {out_path}")
        else:
            print("\nNo API key found. Account creation may not have completed.")
            print("Check the Chromium window and screenshots in:")
            print(f"  {SCREENSHOT_DIR}/")

        await browser.close()
        print("\n=== DONE ===")


asyncio.run(main())
