#!/usr/bin/env python3
"""
Interactive automation - pauses for human interaction at reCAPTCHA and 2FA points
Run this script, then interact with the Chromium window when prompted
"""

import asyncio
import os
import re
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/appstore"

def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"


async def goto_safe(page, url, timeout=30000):
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=timeout)
    except Exception as e:
        print(f"  goto warning: {e}")
    await page.wait_for_timeout(2000)


async def wait_for_user(message, seconds=120):
    """Wait for user to perform manual action"""
    print(f"\n{'='*50}")
    print(f"ACTION NEEDED: {message}")
    print(f"Waiting {seconds} seconds...")
    print(f"{'='*50}")
    await asyncio.sleep(seconds)


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    print(f"Screenshots: {SCREENSHOT_DIR}")
    print("\nThis script requires manual interaction for:")
    print("  1. reCAPTCHA on api.bible")
    print("  2. 2FA code on App Store Connect")
    print("\nKeep the Chromium window visible throughout!\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=150,
            args=["--no-sandbox"]
        )
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()

        # ==============================
        # TASK 2: api.bible
        # ==============================
        print("="*60)
        print("TASK 2: api.bible signup")
        print("="*60)

        await goto_safe(page, "https://api.bible/sign-up/starter")
        await page.screenshot(path=ss("i_01_step1"))

        # Step 1: App info
        print("Filling Step 1...")

        # App name
        await page.evaluate("""() => {
            const el = document.getElementById('appName');
            if(el) { el.value = 'BibleHabit'; el.dispatchEvent(new Event('input', {bubbles: true})); }
        }""")

        # No revenue radio
        await page.evaluate("""() => {
            document.querySelectorAll('label').forEach(l => {
                if(l.textContent.toLowerCase().includes('no, there will be no')) l.click();
            });
        }""")

        # 0-1K users
        await page.evaluate("""() => {
            document.querySelectorAll('label').forEach(l => {
                if(l.textContent.trim() === '0-1K') l.click();
            });
        }""")

        await page.wait_for_timeout(800)

        # Click Continue
        await page.evaluate("""() => {
            document.querySelectorAll('button').forEach(b => {
                if(b.textContent.trim() === 'Continue') b.click();
            });
        }""")
        await page.wait_for_timeout(2000)

        # Dismiss "Are you sure?" dialog
        await page.evaluate("""() => {
            document.querySelectorAll('button').forEach(b => {
                if(['Yes, continue', 'Yes'].includes(b.textContent.trim())) b.click();
            });
        }""")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("i_02_step2"))
        print(f"Step 2: {page.url}")

        # Step 2: Account creation
        print("Filling Step 2 account form...")

        # Standard text inputs
        await page.evaluate("""() => {
            const map = {
                firstName: 'BibleHabit',
                lastName: 'App',
                organizationName: 'BibleHabit',
                email: 'hello@biblehabit.co',
            };
            Object.entries(map).forEach(([id, val]) => {
                const el = document.getElementById(id) || document.querySelector(`input[name="${id}"]`);
                if(el && !el.value) {
                    el.value = val;
                    el.dispatchEvent(new Event('input', {bubbles: true}));
                    el.dispatchEvent(new Event('change', {bubbles: true}));
                }
            });
        }""")

        # Organization Type - click the button combobox
        await page.evaluate("""() => {
            document.querySelectorAll('button').forEach(b => {
                if(b.textContent.includes('organization type')) b.click();
            });
        }""")
        await page.wait_for_timeout(1000)

        # Select Individual from dropdown
        result = await page.evaluate("""() => {
            const opts = document.querySelectorAll('[role="option"], li');
            for(const opt of opts) {
                if(opt.textContent.trim() === 'Individual') { opt.click(); return 'ok'; }
            }
            return Array.from(document.querySelectorAll('[role="option"]')).map(o => o.textContent.trim()).join(', ');
        }""")
        print(f"  Org type: {result}")
        await page.wait_for_timeout(1000)

        # After selecting Individual, the org name field changes to "Individual's Name"
        # Fill it again
        await page.evaluate("""() => {
            const inputs = document.querySelectorAll('input[type=text]');
            inputs.forEach(inp => {
                const ph = (inp.placeholder || '').toLowerCase();
                const label = inp.closest('div') ? inp.closest('div').textContent : '';
                if(ph.includes('name') || ph.includes('individual') || label.includes("Individual's Name")) {
                    if(!inp.value) {
                        inp.value = 'BibleHabit';
                        inp.dispatchEvent(new Event('input', {bubbles: true}));
                        inp.dispatchEvent(new Event('change', {bubbles: true}));
                    }
                }
            });
        }""")

        # Organization Location - click combobox
        await page.evaluate("""() => {
            document.querySelectorAll('button').forEach(b => {
                if(b.textContent.includes('organization location') || b.textContent.includes('Select your org')) {
                    b.click();
                }
            });
        }""")
        await page.wait_for_timeout(1000)

        # Select United States
        result2 = await page.evaluate("""() => {
            const opts = document.querySelectorAll('[role="option"], li');
            for(const opt of opts) {
                if(opt.textContent.trim() === 'United States') { opt.click(); return 'ok'; }
            }
            return 'not found';
        }""")
        print(f"  Location: {result2}")
        await page.wait_for_timeout(1000)

        # Password fields
        await page.evaluate("""() => {
            document.querySelectorAll('input[type=password]').forEach(inp => {
                if(!inp.value) {
                    inp.value = 'BibleHabit2026!';
                    inp.dispatchEvent(new Event('input', {bubbles: true}));
                    inp.dispatchEvent(new Event('change', {bubbles: true}));
                }
            });
        }""")

        # Refill any empty text fields
        await page.evaluate("""() => {
            const map = {
                firstName: 'BibleHabit',
                lastName: 'App',
                organizationName: 'BibleHabit',
                email: 'hello@biblehabit.co',
            };
            Object.entries(map).forEach(([id, val]) => {
                const el = document.getElementById(id) || document.querySelector(`input[name="${id}"]`);
                if(el && !el.value) {
                    el.value = val;
                    el.dispatchEvent(new Event('input', {bubbles: true}));
                    el.dispatchEvent(new Event('change', {bubbles: true}));
                }
            });
        }""")

        await page.wait_for_timeout(1000)
        await page.screenshot(path=ss("i_03_step2_filled"))
        print("Step 2 form filled")

        # Wait for reCAPTCHA
        print("\n" + "="*60)
        print("ACTION NEEDED: Please solve the reCAPTCHA in the Chromium window")
        print("Click the 'I'm not a robot' checkbox")
        print("Waiting 90 seconds...")
        print("="*60)

        for i in range(18):  # 18 * 5s = 90s
            await asyncio.sleep(5)
            # Check if reCAPTCHA solved
            solved = await page.evaluate("""() => {
                const r = document.querySelector('#g-recaptcha-response, textarea[name="g-recaptcha-response"]');
                return r ? r.value.length > 100 : false;
            }""")
            if solved:
                print("reCAPTCHA solved!")
                break
            if i % 6 == 0:
                print(f"  Still waiting for reCAPTCHA... {(i+1)*5}s elapsed")

        await page.screenshot(path=ss("i_04_after_captcha"))

        # Submit
        await page.evaluate("""() => {
            document.querySelectorAll('button').forEach(b => {
                if(b.textContent.trim() === 'Create Account') b.click();
            });
        }""")
        print("Create Account clicked")
        await page.wait_for_timeout(5000)
        await page.screenshot(path=ss("i_05_after_create"))
        print(f"After create: {page.url}")
        body = await page.inner_text("body")
        print(f"Content (first 500):\n{body[:500]}")

        # Continue through steps 3+
        for step in range(3, 7):
            await page.wait_for_timeout(2000)
            url = page.url
            body = await page.inner_text("body")

            if "sign-up/starter" not in url:
                print(f"Left signup: {url}")
                break

            step_match = re.search(r'Step (\d+) of', body)
            current_step = int(step_match.group(1)) if step_match else 0
            print(f"Current step: {current_step}")

            if current_step == 2:
                print("Still on step 2 - validation issue, checking form state...")
                # Check what's empty
                form_state = await page.evaluate("""() => {
                    const inputs = document.querySelectorAll('input:not([type=hidden])');
                    const state = {};
                    inputs.forEach(inp => {
                        state[inp.id || inp.name || inp.placeholder] = inp.value;
                    });
                    return state;
                }""")
                print(f"Form state: {form_state}")
                break

            await page.evaluate("""() => {
                document.querySelectorAll('button').forEach(b => {
                    const txt = b.textContent.trim();
                    if(['Continue', 'Next', 'Finish', 'Done'].includes(txt)) b.click();
                });
            }""")
            await page.wait_for_timeout(3000)
            await page.screenshot(path=ss(f"i_step{step}"))
            new_url = page.url
            new_body = await page.inner_text("body")
            print(f"Step {step}: {new_url}")

            if any(kw in new_url for kw in ["dashboard", "admin", "success", "applications"]):
                print("SUCCESS!")
                break
            if any(kw in new_body.lower() for kw in ["your api key", "api key:"]):
                print("API key mention found!")
                break

        # Final state
        await page.screenshot(path=ss("i_final_apibible"))
        body = await page.inner_text("body")
        print(f"\nFINAL api.bible URL: {page.url}")
        print(f"Body:\n{body[:4000]}")

        keys = re.findall(r'[a-f0-9-]{32,}', body)
        if keys:
            print(f"\n*** POTENTIAL API KEYS: {keys} ***")

        # ==============================
        # TASK 1: App Store Connect
        # ==============================
        print("\n\n" + "="*60)
        print("TASK 1: App Store Connect")
        print("="*60)

        page2 = await ctx.new_page()
        await goto_safe(page2, "https://appstoreconnect.apple.com")
        await page2.wait_for_timeout(4000)
        await page2.screenshot(path=ss("a_01_initial"))
        print(f"ASC URL: {page2.url}")

        # Auth iframe
        auth_frame = next((f for f in page2.frames if "idmsa.apple.com" in f.url), None)

        if auth_frame:
            print("Auth iframe found, logging in...")
            email_el = await auth_frame.wait_for_selector("#account_name_text_field", timeout=10000)
            await email_el.click()
            await email_el.fill("")
            await email_el.type("solomonweb26@gmail.com", delay=50)
            print("Apple ID typed")
            await email_el.press("Enter")
            await page2.wait_for_timeout(4000)
            await page2.screenshot(path=ss("a_02_after_email"))

            # Refresh frame
            auth_frame = next((f for f in page2.frames if "idmsa.apple.com" in f.url), None)

            if auth_frame:
                try:
                    pass_el = await auth_frame.wait_for_selector("#password_text_field", timeout=8000)
                    if pass_el and await pass_el.is_visible():
                        await pass_el.click()
                        await pass_el.type("Hdsignals1987", delay=50)
                        print("Password typed")
                        sign_btn = await auth_frame.query_selector("#sign-in")
                        if sign_btn:
                            await sign_btn.click()
                        else:
                            await pass_el.press("Enter")
                        print("Submitted login")
                except Exception as e:
                    print(f"Password error: {e}")
        else:
            print("No auth iframe found")
            print("Frames:", [f.url for f in page2.frames])

        await page2.wait_for_timeout(5000)
        await page2.screenshot(path=ss("a_03_after_login"))
        print(f"After login: {page2.url}")

        # Check for 2FA
        all_frame_text = ""
        for frame in page2.frames:
            try:
                all_frame_text += await frame.inner_text("body") + " "
            except:
                pass

        needs_2fa = any(kw in all_frame_text.lower() for kw in [
            "verification code", "two-factor", "sent to your mac",
            "sent to your iphone", "6-digit", "trusted device"
        ])

        if needs_2fa or "login" in page2.url.lower():
            print("\n" + "="*60)
            print("ACTION NEEDED: 2FA CODE REQUIRED")
            print("Apple sent a 6-digit code to your Mac or iPhone")
            print("Look for a notification on your Mac (top right corner)")
            print("OR check your iPhone for an Apple ID notification")
            print("Enter the 6-digit code in the Chromium browser window")
            print("Waiting 5 minutes...")
            print("="*60)

            for i in range(60):  # 60 * 5s = 5 min
                await asyncio.sleep(5)
                cur = page2.url
                await page2.screenshot(path=ss(f"a_2fa_{i:02d}"))

                if "appstoreconnect.apple.com" in cur and "login" not in cur:
                    print(f"2FA complete! URL: {cur}")
                    break

                if i % 12 == 0 and i > 0:
                    print(f"  {i*5}s - waiting for 2FA code...")

        # Final auth check
        final_url = page2.url
        print(f"\nFinal URL: {final_url}")

        if "appstoreconnect.apple.com" in final_url and "login" not in final_url:
            print("Authenticated! Creating apps...")
            await goto_safe(page2, "https://appstoreconnect.apple.com/apps")
            await page2.wait_for_timeout(4000)
            await page2.screenshot(path=ss("a_04_apps"))
            body = await page2.inner_text("body")
            print(f"Apps page:\n{body[:2000]}")

            if "sign in" not in body.lower():
                apps = [
                    ("Daily Games", "cc.dailygames.app", "dailygames001", "dailygames"),
                    ("PlayToMaster", "com.playtomaster.app", "playtomaster001", "playtomaster"),
                ]
                for app_name, bundle_id, sku, tag in apps:
                    success = await create_app_smart(page2, app_name, bundle_id, sku, tag)
                    if success:
                        print(f"App '{app_name}' created!")
                    await goto_safe(page2, "https://appstoreconnect.apple.com/apps")
                    await page2.wait_for_timeout(2000)
        else:
            print("Authentication failed or timed out")

        print("\n=== COMPLETE ===")
        await browser.close()


async def create_app_smart(page, name, bundle_id, sku, tag):
    print(f"\n--- Creating: {name} ---")

    # Dump all buttons to find New App
    btn_texts = await page.evaluate("""() => {
        return Array.from(document.querySelectorAll('button, [role="button"]'))
            .map(b => b.textContent.trim().slice(0, 50))
            .filter(t => t);
    }""")
    print(f"Buttons: {btn_texts[:15]}")

    # Click new app
    clicked = await page.evaluate("""() => {
        const els = document.querySelectorAll('button, [role="button"]');
        for(const el of els) {
            const txt = el.textContent.trim();
            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            if(txt === '+' || txt.toLowerCase().includes('new app') || aria.includes('new app')) {
                el.click();
                return txt;
            }
        }
        return null;
    }""")
    print(f"Clicked: {clicked}")

    if not clicked:
        print("Could not find New App button")
        return False

    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss(f"a_{tag}_01"))
    body = await page.inner_text("body")
    print(f"Modal content:\n{body[:400]}")

    # Check for form fields
    form_info = await page.evaluate("""() => {
        return {
            inputs: Array.from(document.querySelectorAll('input')).map(i => ({
                type: i.type, name: i.name, id: i.id, value: i.value
            })),
            selects: Array.from(document.querySelectorAll('select')).map(s => ({
                name: s.name, id: s.id,
                options: Array.from(s.options).map(o => o.text).slice(0, 10)
            })),
            buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t=>t).slice(0,10)
        };
    }""")
    print(f"Form inputs: {form_info['inputs']}")
    print(f"Form selects: {form_info['selects']}")
    print(f"Buttons: {form_info['buttons']}")

    # Fill form via JS
    filled = await page.evaluate(f"""() => {{
        const results = [];

        // iOS
        document.querySelectorAll('input[value="IOS"], input[value="iOS"]').forEach(el => {{
            el.checked = true;
            el.dispatchEvent(new Event('change', {{bubbles:true}}));
            results.push('ios');
        }});
        // Also try labels
        document.querySelectorAll('label').forEach(l => {{
            if(l.textContent.includes('iOS')) {{
                const inp = l.querySelector('input');
                if(inp) {{ inp.checked = true; inp.dispatchEvent(new Event('change', {{bubbles:true}})); results.push('ios-label'); }}
                else l.click();
            }}
        }});

        // App Name
        ['appName', 'name'].forEach(n => {{
            const el = document.getElementById(n) || document.querySelector(`input[name="${{n}}"]`);
            if(el) {{ el.value = '{name}'; el.dispatchEvent(new Event('input', {{bubbles:true}})); results.push('name'); }}
        }});

        // SKU
        ['vendorId', 'sku'].forEach(n => {{
            const el = document.getElementById(n) || document.querySelector(`input[name="${{n}}"]`);
            if(el) {{ el.value = '{sku}'; el.dispatchEvent(new Event('input', {{bubbles:true}})); results.push('sku'); }}
        }});

        // Language select
        document.querySelectorAll('select').forEach(sel => {{
            const eng = Array.from(sel.options).find(o => o.text.includes('English (U.S.)') || o.value === 'en-US');
            if(eng) {{ sel.value = eng.value; sel.dispatchEvent(new Event('change', {{bubbles:true}})); results.push('lang'); }}
        }});

        // Bundle ID select
        document.querySelectorAll('select').forEach(sel => {{
            const match = Array.from(sel.options).find(o => o.value.includes('{bundle_id}') || o.text.includes('{bundle_id}'));
            if(match) {{ sel.value = match.value; sel.dispatchEvent(new Event('change', {{bubbles:true}})); results.push('bundle=' + match.value); }}
        }});

        // Full access
        document.querySelectorAll('input[value="FULL_ACCESS"]').forEach(el => {{
            el.checked = true; el.dispatchEvent(new Event('change', {{bubbles:true}})); results.push('fullAccess');
        }});

        return results;
    }}""")
    print(f"Filled: {filled}")

    await page.wait_for_timeout(1000)
    await page.screenshot(path=ss(f"a_{tag}_02"))

    # Click Create
    create_clicked = await page.evaluate("""() => {
        const btns = document.querySelectorAll('button');
        for(const btn of btns) {
            if(btn.textContent.trim() === 'Create') {
                btn.click();
                return 'clicked';
            }
        }
        return null;
    }""")
    print(f"Create: {create_clicked}")

    await page.wait_for_timeout(5000)
    await page.screenshot(path=ss(f"a_{tag}_03"))
    body = await page.inner_text("body")
    print(f"Result URL: {page.url}")
    print(f"Result:\n{body[:400]}")

    return "sign in" not in body.lower() and page.url != "https://appstoreconnect.apple.com/apps"


asyncio.run(main())
