#!/usr/bin/env python3
"""
Task Runner - Final Version
Handles reCAPTCHA and 2FA via user interaction in the browser window.

IMPORTANT: Keep the Chromium window visible and interact when prompted!
"""

import asyncio
import os
import re
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/appstore"

def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=200,
            args=["--no-sandbox"]
        )
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})

        # ==============================
        # TASK 2: api.bible
        # ==============================
        print("="*60)
        print("TASK 2: api.bible signup")
        print("="*60)
        page = await ctx.new_page()

        # Navigate, catching timeout
        try:
            await page.goto("https://api.bible/sign-up/starter", wait_until="domcontentloaded", timeout=20000)
        except:
            pass
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("task2_01"))
        print(f"Step 1 URL: {page.url}")

        # === STEP 1: App customization ===
        # App name
        await page.evaluate("""() => {
            const el = document.getElementById('appName');
            if(el) { el.value = 'BibleHabit'; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); }
        }""")

        # "No revenue" radio
        await page.evaluate("""() => {
            document.querySelectorAll('label').forEach(l => {
                if(l.textContent.toLowerCase().includes('no, there will be no')) l.click();
            });
        }""")

        # "0-1K" radio
        await page.evaluate("""() => {
            document.querySelectorAll('label').forEach(l => {
                if(l.textContent.trim() === '0-1K') l.click();
            });
        }""")
        await page.wait_for_timeout(500)

        # Continue button
        await page.evaluate("""() => {
            document.querySelectorAll('button').forEach(b => {
                if(b.textContent.trim() === 'Continue') b.click();
            });
        }""")
        await page.wait_for_timeout(2000)

        # Dismiss "Are you sure?" dialog
        dismissed = await page.evaluate("""() => {
            const btns = document.querySelectorAll('button');
            for(const b of btns) {
                if(['Yes, continue', 'Yes'].includes(b.textContent.trim())) {
                    b.click();
                    return b.textContent.trim();
                }
            }
            return null;
        }""")
        print(f"Dialog dismissed: {dismissed}")
        await page.wait_for_timeout(3000)

        # Check if we're on step 2
        body = await page.inner_text("body")
        if "Step 2" in body:
            print("On Step 2!")
        else:
            print("Not on Step 2, current content starts with:", body[:100])

        await page.screenshot(path=ss("task2_02_step2"))

        # === STEP 2: Account creation ===
        # Fill all text inputs
        await page.evaluate("""() => {
            const fieldMap = {
                'firstName': 'BibleHabit',
                'lastName': 'App',
                'organizationName': 'BibleHabit',
                'email': 'hello@biblehabit.co'
            };
            Object.entries(fieldMap).forEach(([id, val]) => {
                const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
                if(el && !el.value) {
                    el.value = val;
                    el.dispatchEvent(new Event('input', {bubbles:true}));
                    el.dispatchEvent(new Event('change', {bubbles:true}));
                }
            });
        }""")

        # Org Type dropdown - click and select Individual
        print("Opening org type dropdown...")
        await page.evaluate("""() => {
            document.querySelectorAll('button').forEach(b => {
                if(b.textContent.includes('organization type') || b.textContent.includes('Select your org')) b.click();
            });
        }""")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=ss("task2_03_org_type_open"))

        # Check what appeared in DOM after click
        open_opts = await page.evaluate("""() => {
            const opts = Array.from(document.querySelectorAll('[role="option"], [role="menuitem"], li'));
            return opts.map(o => ({text: o.textContent.trim(), visible: o.offsetParent !== null})).slice(0, 20);
        }""")
        print(f"Visible options: {[o for o in open_opts if o['visible']][:10]}")

        # Click Individual
        await page.evaluate("""() => {
            const opts = document.querySelectorAll('[role="option"], li');
            for(const opt of opts) {
                if(opt.textContent.trim() === 'Individual' && opt.offsetParent !== null) {
                    opt.click();
                    return;
                }
            }
            // Fallback - click any visible option with Individual text
            document.querySelectorAll('*').forEach(el => {
                if(el.textContent.trim() === 'Individual' && el.offsetParent !== null &&
                   ['LI', 'DIV', 'SPAN', 'BUTTON'].includes(el.tagName)) {
                    el.click();
                }
            });
        }""")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=ss("task2_04_org_type_selected"))

        # Check if org type was selected
        org_val = await page.evaluate("""() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('role') === 'combobox' || b.textContent.includes('organization type'));
            return btn ? btn.textContent.trim() : null;
        }""")
        print(f"Org type button text: {org_val}")

        # Location dropdown - click and select United States
        print("Opening location dropdown...")
        await page.evaluate("""() => {
            document.querySelectorAll('button').forEach(b => {
                if(b.textContent.includes('organization location') || b.textContent.includes('Select your org')) b.click();
            });
        }""")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=ss("task2_05_location_open"))

        await page.evaluate("""() => {
            const opts = document.querySelectorAll('[role="option"], li');
            for(const opt of opts) {
                if(opt.textContent.trim() === 'United States' && opt.offsetParent !== null) {
                    opt.click();
                    return;
                }
            }
        }""")
        await page.wait_for_timeout(1000)

        # Fill passwords and re-fill all fields (after org type selection, fields may reset)
        await page.evaluate("""() => {
            const fieldMap = {
                'firstName': 'BibleHabit',
                'lastName': 'App',
                'organizationName': 'BibleHabit',
                'email': 'hello@biblehabit.co'
            };
            Object.entries(fieldMap).forEach(([id, val]) => {
                const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
                if(el && !el.value) {
                    el.value = val;
                    el.dispatchEvent(new Event('input', {bubbles:true}));
                    el.dispatchEvent(new Event('change', {bubbles:true}));
                }
            });
            // Passwords
            document.querySelectorAll('input[type=password]').forEach(inp => {
                if(!inp.value) {
                    inp.value = 'BibleHabit2026!';
                    inp.dispatchEvent(new Event('input', {bubbles:true}));
                    inp.dispatchEvent(new Event('change', {bubbles:true}));
                }
            });
        }""")

        await page.wait_for_timeout(1000)
        await page.screenshot(path=ss("task2_06_step2_all_filled"))

        # Print current form state
        form_state = await page.evaluate("""() => {
            const state = {};
            document.querySelectorAll('input:not([type=hidden])').forEach(inp => {
                state[inp.id || inp.name || inp.placeholder] = inp.value;
            });
            // Combobox values
            document.querySelectorAll('[role="combobox"]').forEach(el => {
                state['combobox_' + el.id] = el.textContent.trim();
            });
            return state;
        }""")
        print(f"Form state before reCAPTCHA: {form_state}")

        print("\n" + "="*60)
        print("MANUAL ACTION REQUIRED!")
        print("The Chromium window needs you to:")
        print("1. Solve the reCAPTCHA (click 'I'm not a robot')")
        print("2. Click 'Create Account' button")
        print("")
        print("Check the Chromium window NOW and solve the CAPTCHA")
        print("You have 3 minutes...")
        print("="*60)

        # Wait and monitor for step 3 URL or "Step 3" text
        for i in range(36):
            await asyncio.sleep(5)
            url = page.url
            body = await page.inner_text("body")
            await page.screenshot(path=ss(f"task2_wait_{i:02d}"))

            if "Step 3" in body or "Step 4" in body:
                print(f"Advanced to next step! Body starts: {body[:100]}")
                break
            if any(kw in body.lower() for kw in ["api key", "your key", "dashboard", "application created"]):
                print("API key page reached!")
                break
            if "sign-up/starter" not in url:
                print(f"URL changed: {url}")
                break
            if i % 6 == 0 and i > 0:
                print(f"  {i*5}s - waiting for manual reCAPTCHA solve...")

        await page.screenshot(path=ss("task2_07_after_captcha"))
        body = await page.inner_text("body")
        print(f"After captcha wait: {page.url}")
        print(f"Body: {body[:500]}")

        # Continue through remaining steps
        for step in range(3, 8):
            await page.wait_for_timeout(2000)
            body = await page.inner_text("body")
            url = page.url

            if "sign-up/starter" not in url:
                print(f"Left signup flow: {url}")
                break

            step_match = re.search(r'Step (\d+) of', body)
            if not step_match:
                print("No step indicator found")
                break

            current_step = int(step_match.group(1))
            print(f"On Step {current_step}")

            if current_step == 2:
                print("Still on step 2 - form validation failed")
                break

            # Click continue/next
            await page.evaluate("""() => {
                document.querySelectorAll('button').forEach(b => {
                    if(['Continue', 'Next', 'Finish', 'Done'].includes(b.textContent.trim())) b.click();
                });
            }""")
            await page.wait_for_timeout(3000)
            await page.screenshot(path=ss(f"task2_step{current_step}_{step}"))

        # Final
        await page.screenshot(path=ss("task2_final"))
        body = await page.inner_text("body")
        print(f"\n=== api.bible FINAL ===")
        print(f"URL: {page.url}")
        print(f"Body:\n{body[:3000]}")

        keys = re.findall(r'[a-zA-Z0-9_-]{30,}', body)
        potential_keys = [k for k in keys if not k.startswith('http') and not k[0].isdigit()]
        if potential_keys:
            print(f"\nPotential API keys: {potential_keys[:5]}")

        await page.close()

        # ==============================
        # TASK 1: App Store Connect
        # ==============================
        print("\n\n" + "="*60)
        print("TASK 1: App Store Connect - Login + Create Apps")
        print("="*60)

        page2 = await ctx.new_page()
        try:
            await page2.goto("https://appstoreconnect.apple.com", wait_until="domcontentloaded", timeout=20000)
        except:
            pass
        await page2.wait_for_timeout(5000)
        await page2.screenshot(path=ss("asc_01"))
        print(f"ASC URL: {page2.url}")

        # Find Apple auth iframe
        auth_frame = next((f for f in page2.frames if "idmsa.apple.com" in f.url), None)

        if auth_frame:
            print("Found Apple auth iframe")
            try:
                email_el = await auth_frame.wait_for_selector("#account_name_text_field", timeout=10000)
                await email_el.click()
                await email_el.fill("")
                await email_el.type("solomonweb26@gmail.com", delay=80)
                print("Apple ID typed: solomonweb26@gmail.com")
                await page2.screenshot(path=ss("asc_02_email"))
                await email_el.press("Enter")
                await page2.wait_for_timeout(4000)
            except Exception as e:
                print(f"Email error: {e}")

            # Refresh frame
            auth_frame = next((f for f in page2.frames if "idmsa.apple.com" in f.url), None)

            if auth_frame:
                try:
                    pass_el = await auth_frame.wait_for_selector("#password_text_field", timeout=8000)
                    if pass_el and await pass_el.is_visible():
                        await pass_el.click()
                        await pass_el.type("Hdsignals1987", delay=80)
                        print("Password typed")
                        await page2.screenshot(path=ss("asc_03_password"))
                        sign_btn = await auth_frame.query_selector("#sign-in")
                        if sign_btn:
                            await sign_btn.click()
                            print("Clicked Sign In")
                        else:
                            await pass_el.press("Enter")
                            print("Pressed Enter to sign in")
                except Exception as e:
                    print(f"Password error: {e}")
        else:
            print("Apple auth iframe NOT found")
            print("Frames:", [f.url[:60] for f in page2.frames])

        await page2.wait_for_timeout(6000)
        await page2.screenshot(path=ss("asc_04_after_signin"))
        print(f"After sign in: {page2.url}")

        # Check for 2FA
        all_text = ""
        for frame in page2.frames:
            try:
                all_text += await frame.inner_text("body") + " "
            except:
                pass

        needs_2fa = any(kw in all_text.lower() for kw in [
            "verification code", "two-factor", "sent to your mac",
            "sent to your iphone", "6-digit", "trusted device"
        ])

        if needs_2fa or "login" in page2.url:
            print("\n" + "="*60)
            print("*** APPLE 2FA CODE REQUIRED ***")
            print("")
            print("Apple sent a 6-digit verification code to your Mac.")
            print("Look for a dialog/notification on your Mac NOW.")
            print("")
            print("The Chromium window shows 6 empty boxes for the code.")
            print("Click on the first box and type the 6-digit code.")
            print("")
            print("Waiting 10 minutes for code entry...")
            print("="*60)

            for i in range(120):  # 120 * 5s = 10 min
                await asyncio.sleep(5)
                cur = page2.url
                await page2.screenshot(path=ss(f"asc_2fa_{i:02d}"))

                if "appstoreconnect.apple.com" in cur and "login" not in cur:
                    print(f"\n2FA Complete! URL: {cur}")
                    break

                if i % 12 == 0 and i > 0:
                    print(f"  {i*5}s - still waiting for 2FA code entry...")
                    print(f"  Current URL: {cur}")

        final_url = page2.url
        print(f"\nFinal URL: {final_url}")

        if "appstoreconnect.apple.com" in final_url and "login" not in final_url:
            print("Authenticated! Navigating to apps...")
            try:
                await page2.goto("https://appstoreconnect.apple.com/apps", wait_until="domcontentloaded", timeout=20000)
            except:
                pass
            await page2.wait_for_timeout(4000)
            await page2.screenshot(path=ss("asc_05_apps"))
            body = await page2.inner_text("body")
            print(f"Apps page:\n{body[:2000]}")

            if "sign in" not in body.lower():
                apps_to_create = [
                    ("Daily Games", "cc.dailygames.app", "dailygames001", "dailygames"),
                    ("PlayToMaster", "com.playtomaster.app", "playtomaster001", "playtomaster"),
                ]
                for app_name, bundle_id, sku, tag in apps_to_create:
                    await create_app(page2, app_name, bundle_id, sku, tag)
                    try:
                        await page2.goto("https://appstoreconnect.apple.com/apps", wait_until="domcontentloaded", timeout=20000)
                    except:
                        pass
                    await page2.wait_for_timeout(3000)
        else:
            print("Authentication failed")

        await browser.close()
        print("\n=== ALL TASKS COMPLETE ===")


async def create_app(page, name, bundle_id, sku, tag):
    print(f"\n--- Creating: {name} ---")

    # Find new app button
    btns = await page.evaluate("""() => {
        return Array.from(document.querySelectorAll('button, [role="button"]')).map(b => ({
            text: b.textContent.trim().slice(0, 50),
            aria: b.getAttribute('aria-label') || ''
        }));
    }""")
    print(f"Available buttons: {btns[:15]}")

    clicked = await page.evaluate("""() => {
        const els = document.querySelectorAll('button, [role="button"]');
        for(const el of els) {
            const txt = el.textContent.trim();
            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            if(txt === '+' || txt.toLowerCase() === 'new app' || aria.includes('new app')) {
                el.click();
                return txt || aria;
            }
        }
        return null;
    }""")
    print(f"New App clicked: {clicked}")

    if not clicked:
        print("New App button not found, skipping")
        return

    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss(f"asc_{tag}_01"))

    body = await page.inner_text("body")
    print(f"Modal body:\n{body[:400]}")

    # Fill form
    filled = await page.evaluate(f"""() => {{
        const results = [];

        // iOS checkbox/radio
        document.querySelectorAll('input[value="IOS"], input[value="iOS"]').forEach(el => {{
            el.checked = true;
            el.dispatchEvent(new Event('change', {{bubbles:true}}));
            results.push('iOS');
        }});
        document.querySelectorAll('label').forEach(l => {{
            if(l.textContent.trim() === 'iOS') {{
                const inp = l.querySelector('input');
                if(inp) {{ inp.checked = true; inp.dispatchEvent(new Event('change', {{bubbles:true}})); results.push('iOS-label'); }}
            }}
        }});

        // App Name
        for(const n of ['appName', 'name']) {{
            const el = document.getElementById(n) || document.querySelector(`input[name="${{n}}"]`);
            if(el) {{ el.value = '{name}'; el.dispatchEvent(new Event('input', {{bubbles:true}})); results.push('name'); break; }}
        }}

        // Language
        document.querySelectorAll('select').forEach(sel => {{
            const eng = Array.from(sel.options).find(o => o.text.includes('English (U.S.)') || o.value === 'en-US');
            if(eng && sel.name === 'primaryLocale') {{ sel.value = eng.value; sel.dispatchEvent(new Event('change', {{bubbles:true}})); results.push('lang'); }}
        }});

        // Bundle ID
        document.querySelectorAll('select').forEach(sel => {{
            const match = Array.from(sel.options).find(o => o.value.includes('{bundle_id}') || o.text.includes('{bundle_id}'));
            if(match) {{ sel.value = match.value; sel.dispatchEvent(new Event('change', {{bubbles:true}})); results.push('bundle=' + match.value); }}
        }});

        // SKU
        for(const n of ['vendorId', 'sku']) {{
            const el = document.getElementById(n) || document.querySelector(`input[name="${{n}}"]`);
            if(el) {{ el.value = '{sku}'; el.dispatchEvent(new Event('input', {{bubbles:true}})); results.push('sku'); break; }}
        }}

        // Full Access
        document.querySelectorAll('input[value="FULL_ACCESS"]').forEach(el => {{
            el.checked = true; el.dispatchEvent(new Event('change', {{bubbles:true}})); results.push('fullAccess');
        }});

        return results;
    }}""")
    print(f"Filled: {filled}")

    await page.wait_for_timeout(1000)
    await page.screenshot(path=ss(f"asc_{tag}_02"))

    # Click Create
    create_res = await page.evaluate("""() => {
        const btns = document.querySelectorAll('button');
        for(const btn of btns) {
            if(btn.textContent.trim() === 'Create') {
                btn.click();
                return 'clicked';
            }
        }
        return null;
    }""")
    print(f"Create: {create_res}")

    await page.wait_for_timeout(5000)
    await page.screenshot(path=ss(f"asc_{tag}_03"))
    body = await page.inner_text("body")
    url = page.url
    print(f"Result URL: {url}")
    print(f"Result:\n{body[:500]}")

    if "sign in" not in body.lower() and "apps" != url.rstrip("/").split("/")[-1]:
        print(f"App '{name}' may have been created! URL: {url}")
    else:
        print(f"App creation may have failed - URL: {url}")


asyncio.run(main())
