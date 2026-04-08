#!/usr/bin/env python3
"""
api.bible signup - v2
Uses Playwright native methods (click/fill) instead of JS evaluate for form fills.
Waits for manual reCAPTCHA on Step 2.
"""

import asyncio
import os
import re
import json
import urllib.request
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/apibible"


def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"


def get_bibles(api_key):
    url = "https://api.scripture.api.bible/v1/bibles"
    req = urllib.request.Request(url, headers={"api-key": api_key})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read())
            bibles = data.get("data", [])
            results = {}
            for b in bibles:
                abbr = (b.get("abbreviation") or "").upper()
                name = b.get("name", "")
                bid = b.get("id", "")
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
        browser = await p.chromium.launch(headless=False, slow_mo=300, args=["--no-sandbox"])
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()

        # ── STEP 1 ───────────────────────────────────────────────────────────
        print("Loading Step 1...")
        try:
            await page.goto("https://api.bible/sign-up/starter", wait_until="networkidle", timeout=30000)
        except Exception as e:
            print(f"Load warning: {e}")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("01_step1_loaded"))

        body = await page.inner_text("body")
        print(f"Step 1 page loaded. Has 'Customize': {'Customize' in body}")

        # Fill App Name using native fill
        app_name_el = await page.query_selector("#appName")
        if not app_name_el:
            app_name_el = await page.query_selector("input[placeholder*='App Name'], input[name='appName']")
        if app_name_el:
            await app_name_el.click()
            await app_name_el.fill("BibleHabit")
            print("App name filled: BibleHabit")
        else:
            print("WARNING: appName input not found")

        await page.wait_for_timeout(500)

        # Click "No, there will be no..." radio using label click
        no_revenue_labels = await page.query_selector_all("label")
        for label in no_revenue_labels:
            txt = await label.inner_text()
            if "no, there will be no" in txt.lower():
                await label.click()
                print(f"Clicked no-revenue label: {txt[:60]}")
                break

        await page.wait_for_timeout(500)

        # Click "0-1K" radio label
        for label in no_revenue_labels:
            txt = await label.inner_text()
            if txt.strip() == "0-1K":
                await label.click()
                print("Clicked 0-1K label")
                break

        await page.wait_for_timeout(500)
        await page.screenshot(path=ss("02_step1_filled"))

        # Dump current radio states to verify
        radio_state = await page.evaluate("""() => {
            return Array.from(document.querySelectorAll('input[type=radio]')).map(r => ({
                name: r.name, value: r.value, checked: r.checked
            }));
        }""")
        print(f"Radio state: {radio_state}")

        # Click Continue button
        continue_btn = await page.query_selector("button:has-text('Continue')")
        if continue_btn:
            await continue_btn.click()
            print("Clicked Continue")
        else:
            print("Continue button not found!")
            # Try by text
            btns = await page.query_selector_all("button")
            for btn in btns:
                t = await btn.inner_text()
                if t.strip() == "Continue":
                    await btn.click()
                    print(f"Found and clicked Continue via loop")
                    break

        await page.wait_for_timeout(3000)

        # Dismiss "Are you sure?" if present
        for btn in await page.query_selector_all("button"):
            t = (await btn.inner_text()).strip()
            if t in ["Yes, continue", "Yes"]:
                await btn.click()
                print(f"Dismissed dialog: {t}")
                await page.wait_for_timeout(2000)
                break

        await page.screenshot(path=ss("03_after_continue"))
        body = await page.inner_text("body")
        print(f"After Continue — body start: {body[:200]}")

        # ── STEP 2 ───────────────────────────────────────────────────────────
        if "Step 2" not in body:
            print("Still on Step 1 or unexpected state. Checking page...")
            # Maybe we need to wait longer
            await page.wait_for_timeout(3000)
            body = await page.inner_text("body")
            print(f"Body after extra wait: {body[:200]}")

        if "Step 2" in body:
            print("On Step 2!")

            # Fill First Name
            fn = await page.query_selector("#firstName, input[name='firstName']")
            if fn:
                await fn.click()
                await fn.fill("BibleHabit")
                print("firstName: BibleHabit")

            # Fill Last Name
            ln = await page.query_selector("#lastName, input[name='lastName']")
            if ln:
                await ln.click()
                await ln.fill("App")
                print("lastName: App")

            # Org Type dropdown
            print("Opening org type dropdown...")
            org_type_btns = await page.query_selector_all("button")
            org_btn = None
            for btn in org_type_btns:
                t = await btn.inner_text()
                if "organization type" in t.lower() or "select your org" in t.lower():
                    org_btn = btn
                    break
            if org_btn:
                await org_btn.click()
                print("Org type dropdown opened")
                await page.wait_for_timeout(1500)
                await page.screenshot(path=ss("04_org_type_open"))

                # Find Individual option
                opts = await page.query_selector_all('[role="option"], [role="menuitem"]')
                for opt in opts:
                    t = await opt.inner_text()
                    if t.strip() == "Individual":
                        await opt.click()
                        print("Selected: Individual")
                        break
            else:
                print("Org type button not found - trying JS fallback")
                await page.evaluate("""() => {
                    for(const b of document.querySelectorAll('button')) {
                        if(b.textContent.toLowerCase().includes('organization type')) { b.click(); return; }
                    }
                }""")
                await page.wait_for_timeout(1500)
                await page.evaluate("""() => {
                    for(const el of document.querySelectorAll('[role="option"], li')) {
                        if(el.textContent.trim() === 'Individual' && el.offsetParent !== null) { el.click(); return; }
                    }
                }""")

            await page.wait_for_timeout(1000)
            await page.screenshot(path=ss("05_org_type_selected"))

            # Org Name
            org_name = await page.query_selector("#organizationName, input[name='organizationName']")
            if org_name:
                await org_name.click()
                await org_name.fill("BibleHabit")
                print("organizationName: BibleHabit")

            # Location dropdown
            print("Opening location dropdown...")
            loc_btns = await page.query_selector_all("button")
            loc_btn = None
            for btn in loc_btns:
                t = await btn.inner_text()
                if "location" in t.lower() or "country" in t.lower():
                    loc_btn = btn
                    break
            if loc_btn:
                await loc_btn.click()
                print("Location dropdown opened")
                await page.wait_for_timeout(1500)
                await page.screenshot(path=ss("06_location_open"))

                opts = await page.query_selector_all('[role="option"], [role="menuitem"]')
                for opt in opts:
                    t = await opt.inner_text()
                    if "United States" in t:
                        await opt.click()
                        print("Selected: United States")
                        break
            else:
                print("Location button not found - JS fallback")
                await page.evaluate("""() => {
                    for(const b of document.querySelectorAll('button')) {
                        if(b.textContent.toLowerCase().includes('location')) { b.click(); return; }
                    }
                }""")
                await page.wait_for_timeout(1500)
                await page.evaluate("""() => {
                    for(const el of document.querySelectorAll('[role="option"], li')) {
                        if(el.textContent.includes('United States') && el.offsetParent !== null) { el.click(); return; }
                    }
                }""")

            await page.wait_for_timeout(1000)

            # Email
            em = await page.query_selector("#email, input[name='email'], input[type='email']")
            if em:
                await em.click()
                await em.fill("hello@biblehabit.co")
                print("email: hello@biblehabit.co")

            # Passwords
            pw_inputs = await page.query_selector_all("input[type='password']")
            for pw in pw_inputs:
                await pw.click()
                await pw.fill("BibleHabit2026!")
                print("password field filled")

            await page.wait_for_timeout(800)
            await page.screenshot(path=ss("07_step2_filled"))

            # Show form state
            form_state = await page.evaluate("""() => {
                const state = {};
                document.querySelectorAll('input:not([type=hidden])').forEach(inp => {
                    const key = inp.id || inp.name || inp.placeholder || '?';
                    state[key] = inp.type === 'password' ? (inp.value ? 'FILLED' : '') : inp.value;
                });
                document.querySelectorAll('[role="combobox"]').forEach(el => {
                    state['combo_' + el.id] = el.textContent.trim();
                });
                return state;
            }""")
            print(f"Step 2 form state: {form_state}")

        else:
            print(f"NOT on Step 2. URL: {page.url}")
            print(f"Body: {body[:500]}")

        # ── WAIT FOR MANUAL reCAPTCHA ────────────────────────────────────────
        print("\n" + "=" * 70)
        print("  *** ACTION REQUIRED: SOLVE reCAPTCHA ***")
        print("")
        print("  The Chromium window is open. Please:")
        print("  1. Verify all fields are filled")
        print("  2. Click 'I'm not a robot' reCAPTCHA")
        print("  3. Complete image challenge if shown")
        print("  4. Click 'Create Account'")
        print("")
        print("  Waiting 10 minutes...")
        print("=" * 70)

        api_key = None
        for i in range(120):
            await asyncio.sleep(5)
            try:
                cur_url = page.url
                cur_body = await page.inner_text("body")
            except Exception:
                break

            if i % 6 == 0:
                await page.screenshot(path=ss(f"08_wait_{i:03d}"))
                print(f"  {i*5}s — {cur_url[:80]}")

            # Detect advancement
            if (
                "Step 3" in cur_body or
                "Step 4" in cur_body or
                "sign-up/starter" not in cur_url or
                any(k in cur_body.lower() for k in [
                    "api key", "your key", "dashboard", "congratulations",
                    "application created", "get started"
                ])
            ):
                print(f"Advanced! URL: {cur_url}")
                break

        await page.screenshot(path=ss("09_post_captcha"))

        # ── AUTO-ADVANCE REMAINING STEPS ────────────────────────────────────
        for attempt in range(8):
            await page.wait_for_timeout(2000)
            try:
                cur_url = page.url
                cur_body = await page.inner_text("body")
            except Exception:
                break

            print(f"Attempt {attempt}: {cur_url[:80]}")

            # Extract API key candidates
            hex_keys = re.findall(r'\b([a-f0-9]{32,})\b', cur_body)
            long_keys = re.findall(r'\b([A-Za-z0-9_-]{32,})\b', cur_body)
            for k in hex_keys + long_keys:
                if not k.startswith("http") and not k[0].isdigit():
                    api_key = k
                    print(f"*** API KEY CANDIDATE: {k} ***")
                    break

            # Click any advance button
            advance_btns = await page.query_selector_all("button")
            for btn in advance_btns:
                t = (await btn.inner_text()).strip()
                if t in ["Continue", "Next", "Finish", "Done", "Get API Key", "View Dashboard", "Go to Dashboard"]:
                    is_vis = await btn.is_visible()
                    if is_vis:
                        await btn.click()
                        print(f"  Clicked: {t}")
                        await page.wait_for_timeout(3000)
                        break

            if "sign-up/starter" not in page.url:
                print(f"Left signup: {page.url}")
                break

        # ── FINAL ────────────────────────────────────────────────────────────
        await page.screenshot(path=ss("10_final"))
        try:
            final_body = await page.inner_text("body")
        except Exception:
            final_body = ""
        print(f"\n=== FINAL ===")
        print(f"URL: {page.url}")
        print(f"Body:\n{final_body[:2000]}")

        # Extract API key one more time
        if not api_key:
            for pat in [r'\b([a-f0-9]{32,})\b', r'\b([A-Za-z0-9_-]{32,})\b']:
                matches = re.findall(pat, final_body)
                for m in matches:
                    if not m[0].isdigit() and "http" not in m:
                        api_key = m
                        break
                if api_key:
                    break

        # ── BIBLE IDs ────────────────────────────────────────────────────────
        if api_key:
            print(f"\n=== API KEY: {api_key} ===")
            print("Querying /v1/bibles...")
            niv_esv, all_bibles = get_bibles(api_key)
            if "error" in niv_esv:
                print(f"Query error: {niv_esv['error']}")
            else:
                print(f"\nTotal bibles: {len(all_bibles)}")
                print("\n--- NIV ---")
                for b in niv_esv.get("NIV", []):
                    print(f"  ID: {b['id']}  |  {b['name']}  |  {b['abbr']}")
                print("\n--- ESV ---")
                for b in niv_esv.get("ESV", []):
                    print(f"  ID: {b['id']}  |  {b['name']}  |  {b['abbr']}")

            out = {
                "api_key": api_key,
                "niv": niv_esv.get("NIV", []),
                "esv": niv_esv.get("ESV", []),
            }
            out_path = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/api_bible_results.json"
            with open(out_path, "w") as f:
                json.dump(out, f, indent=2)
            print(f"\nSaved to: {out_path}")
        else:
            print("\nNo API key extracted. Check screenshots and complete signup manually.")
            print(f"Screenshots: {SCREENSHOT_DIR}/")

        await browser.close()
        print("\n=== DONE ===")


asyncio.run(main())
