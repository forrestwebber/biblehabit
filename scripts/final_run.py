#!/usr/bin/env python3
"""
Final run - api.bible + App Store Connect
Handles: custom dropdowns, reCAPTCHA (manual), Apple 2FA (manual)
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
    except:
        pass
    await page.wait_for_timeout(3000)


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=100,
            args=["--no-sandbox"]
        )
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()

        print("=== TASK 2: api.bible signup ===")

        await goto_safe(page, "https://api.bible/sign-up/starter")
        await page.screenshot(path=ss("r_01_step1"))

        # Step 1 - App info
        app_name_el = await page.query_selector("#appName")
        if app_name_el:
            await app_name_el.fill("BibleHabit")
            print("App name: BibleHabit")

        # Click "No revenue" radio using JS evaluate
        clicked_no = await page.evaluate("""() => {
            const labels = document.querySelectorAll('label');
            for(const label of labels) {
                if(label.textContent.toLowerCase().includes('no, there will be no')) {
                    label.click();
                    return true;
                }
            }
            return false;
        }""")
        print(f"No revenue clicked: {clicked_no}")

        # Click "0-1K" using JS
        clicked_01k = await page.evaluate("""() => {
            const labels = document.querySelectorAll('label');
            for(const label of labels) {
                if(label.textContent.trim() === '0-1K') {
                    label.click();
                    return true;
                }
            }
            return false;
        }""")
        print(f"0-1K clicked: {clicked_01k}")

        await page.wait_for_timeout(500)

        # Click Continue
        await page.evaluate("""() => {
            const btns = document.querySelectorAll('button');
            for(const btn of btns) {
                if(btn.textContent.trim() === 'Continue') {
                    btn.click();
                    return;
                }
            }
        }""")
        await page.wait_for_timeout(2000)

        # Handle "Are you sure?" dialog
        await page.evaluate("""() => {
            const btns = document.querySelectorAll('button');
            for(const btn of btns) {
                const txt = btn.textContent.trim();
                if(txt === 'Yes, continue' || txt === 'Yes') {
                    btn.click();
                    return;
                }
            }
        }""")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("r_02_step2"))
        print(f"Step 2 URL: {page.url}")

        # Debug: get all interactive elements on step 2
        elements_info = await page.evaluate("""() => {
            const result = [];
            // Get all inputs
            document.querySelectorAll('input:not([type=hidden])').forEach(el => {
                result.push({type: 'input', tag: 'INPUT', inputType: el.type, id: el.id, name: el.name, placeholder: el.placeholder, value: el.value});
            });
            // Get all selects
            document.querySelectorAll('select').forEach(el => {
                result.push({type: 'select', tag: 'SELECT', id: el.id, name: el.name, value: el.value, options: Array.from(el.options).map(o=>o.text).slice(0,5)});
            });
            // Get buttons
            document.querySelectorAll('button').forEach(el => {
                result.push({type: 'button', tag: 'BUTTON', text: el.textContent.trim().slice(0,60), ariaLabel: el.getAttribute('aria-label')});
            });
            // Get comboboxes
            document.querySelectorAll('[role=combobox]').forEach(el => {
                result.push({type: 'combobox', tag: el.tagName, text: el.textContent.trim().slice(0,60), id: el.id});
            });
            return result;
        }""")

        print("Step 2 elements:")
        for el in elements_info:
            print(f"  {el}")

        # Fill standard inputs
        fill_result = await page.evaluate("""() => {
            const filled = [];
            const inputs = document.querySelectorAll('input:not([type=hidden]):not([type=radio]):not([type=checkbox])');
            inputs.forEach(inp => {
                const id = inp.id.toLowerCase();
                const name = inp.name.toLowerCase();
                const ph = (inp.placeholder || '').toLowerCase();
                const combined = id + name + ph;
                if(!inp.value) {
                    if(combined.includes('first')) { inp.value = 'BibleHabit'; filled.push('firstName=BibleHabit'); }
                    else if(combined.includes('last')) { inp.value = 'App'; filled.push('lastName=App'); }
                    else if(combined.includes('org') || combined.includes('company')) { inp.value = 'BibleHabit'; filled.push('org=BibleHabit'); }
                    else if(combined.includes('email')) { inp.value = 'hello@biblehabit.co'; filled.push('email'); }
                }
                // Dispatch events for React
                inp.dispatchEvent(new Event('input', {bubbles: true}));
                inp.dispatchEvent(new Event('change', {bubbles: true}));
            });
            return filled;
        }""")
        print(f"JS filled: {fill_result}")

        # Now handle custom dropdowns via DOM inspection
        # First, find the Organization Type dropdown trigger
        print("\n--- Org Type Dropdown ---")

        # Inspect what renders as the org type selector
        org_type_html = await page.evaluate("""() => {
            // Find anything mentioning organization type
            const all = document.querySelectorAll('*');
            for(const el of all) {
                const text = el.textContent || '';
                if(text.includes('Select your organization type') && el.children.length < 5) {
                    return el.outerHTML.slice(0, 500);
                }
            }
            return 'not found';
        }""")
        print(f"Org type dropdown HTML: {org_type_html[:300]}")

        # Click the org type dropdown trigger
        await page.evaluate("""() => {
            const all = document.querySelectorAll('button, [role="combobox"], [tabindex]');
            for(const el of all) {
                const text = el.textContent.trim();
                if(text.includes('Select your organization type') || text.includes('organization type')) {
                    el.click();
                    console.log('Clicked org type:', text);
                    return;
                }
            }
        }""")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=ss("r_03_org_type_open"))

        # Select Individual from dropdown
        selected_org = await page.evaluate("""() => {
            const opts = document.querySelectorAll('[role="option"], li[data-value], li');
            for(const opt of opts) {
                if(opt.textContent.trim() === 'Individual') {
                    opt.click();
                    return 'Individual clicked';
                }
            }
            // Also try all visible items
            const visible = [];
            document.querySelectorAll('[role="option"]').forEach(el => {
                visible.push(el.textContent.trim());
            });
            return 'No Individual found, options: ' + visible.slice(0, 5).join(', ');
        }""")
        print(f"Org type selection: {selected_org}")
        await page.wait_for_timeout(1000)

        # Organization Location dropdown
        print("\n--- Org Location Dropdown ---")
        await page.evaluate("""() => {
            const all = document.querySelectorAll('button, [role="combobox"], [tabindex]');
            for(const el of all) {
                const text = el.textContent.trim();
                if(text.includes('Select your organization location') || text.includes('organization location')) {
                    el.click();
                    return;
                }
            }
        }""")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=ss("r_04_location_open"))

        # Select United States
        selected_loc = await page.evaluate("""() => {
            const opts = document.querySelectorAll('[role="option"], li');
            for(const opt of opts) {
                const text = opt.textContent.trim();
                if(text === 'United States') {
                    opt.click();
                    return 'United States clicked';
                }
            }
            const visible = [];
            document.querySelectorAll('[role="option"]').forEach(el => visible.push(el.textContent.trim()));
            return 'Not found, options: ' + visible.slice(0, 10).join(', ');
        }""")
        print(f"Location selection: {selected_loc}")
        await page.wait_for_timeout(1000)

        # Fill email and passwords
        await page.evaluate("""() => {
            const inputs = document.querySelectorAll('input');
            inputs.forEach(inp => {
                const t = inp.type;
                const id = inp.id.toLowerCase();
                if(t === 'email' || id.includes('email')) {
                    inp.value = 'hello@biblehabit.co';
                    inp.dispatchEvent(new Event('input', {bubbles: true}));
                    inp.dispatchEvent(new Event('change', {bubbles: true}));
                } else if(t === 'password') {
                    inp.value = 'BibleHabit2026!';
                    inp.dispatchEvent(new Event('input', {bubbles: true}));
                    inp.dispatchEvent(new Event('change', {bubbles: true}));
                }
            });
        }""")

        await page.wait_for_timeout(1000)
        await page.screenshot(path=ss("r_05_step2_filled"))
        print("Step 2 filled")

        # Check for reCAPTCHA
        recaptcha_present = await page.evaluate("""() => {
            return !!document.querySelector('iframe[src*="recaptcha"], .g-recaptcha, #g-recaptcha-response');
        }""")

        if recaptcha_present:
            print("\n*** reCAPTCHA PRESENT - MANUAL ACTION NEEDED ***")
            print("Please click the 'I'm not a robot' checkbox in the Chromium window")
            print("Waiting up to 2 minutes for reCAPTCHA completion...")

            for i in range(24):
                await asyncio.sleep(5)
                solved = await page.evaluate("""() => {
                    const el = document.querySelector('#g-recaptcha-response, textarea[name="g-recaptcha-response"]');
                    return el ? el.value.length > 10 : false;
                }""")
                if solved:
                    print("reCAPTCHA solved!")
                    break
                if i % 6 == 0:
                    print(f"  Waiting for reCAPTCHA... {(i+1)*5}s")

        # Submit Create Account
        await page.evaluate("""() => {
            const btns = document.querySelectorAll('button');
            for(const btn of btns) {
                const txt = btn.textContent.trim();
                if(txt === 'Create Account' || txt === 'Submit') {
                    btn.click();
                    return txt;
                }
            }
        }""")
        print("Clicked Create Account")
        await page.wait_for_timeout(5000)
        await page.screenshot(path=ss("r_06_after_create"))
        print(f"After create: {page.url}")
        body = await page.inner_text("body")
        print(f"Content:\n{body[:800]}")

        # Continue through steps 3-4
        for step in range(3, 7):
            url = page.url
            body_text = await page.inner_text("body")

            if "sign-up/starter" not in url:
                print(f"Step {step}: Left signup - {url}")
                break

            if "step 2" in body_text.lower():
                print(f"Step {step}: Still on step 2 - form validation issue")
                break

            await page.evaluate("""() => {
                const btns = document.querySelectorAll('button');
                for(const btn of btns) {
                    const txt = btn.textContent.trim();
                    if(['Continue', 'Next', 'Finish', 'Done'].includes(txt)) {
                        btn.click();
                        return;
                    }
                }
            }""")
            await page.wait_for_timeout(3000)
            await page.screenshot(path=ss(f"r_step{step}"))
            new_url = page.url
            new_body = await page.inner_text("body")
            print(f"Step {step}: {new_url}")

            if any(kw in new_url for kw in ["dashboard", "admin", "success", "applications"]):
                print("SUCCESS!")
                break
            if any(kw in new_body.lower() for kw in ["your api key", "api key:"]):
                print("API key found!")
                break

        # Final
        await page.screenshot(path=ss("r_final_api"))
        body = await page.inner_text("body")
        print(f"\nFINAL api.bible URL: {page.url}")
        print(f"Content:\n{body[:3000]}")

        keys = re.findall(r'[a-f0-9-]{32,}', body)
        if keys:
            print(f"\nAPI keys found: {keys}")

        # ==============================
        # TASK 1: App Store Connect
        # ==============================
        print("\n\n=== TASK 1: App Store Connect ===")

        page2 = await ctx.new_page()
        await goto_safe(page2, "https://appstoreconnect.apple.com")
        await page2.wait_for_timeout(4000)
        await page2.screenshot(path=ss("asc_01"))
        print(f"ASC URL: {page2.url}")

        # Find auth iframe
        auth_frame = None
        for frame in page2.frames:
            if "idmsa.apple.com" in frame.url:
                auth_frame = frame
                break

        if not auth_frame:
            print("No auth frame found. Frames:")
            for f in page2.frames:
                print(f"  {f.url}")
        else:
            # Type email
            email_el = await auth_frame.wait_for_selector("#account_name_text_field", timeout=10000)
            await email_el.click()
            await email_el.fill("")
            await email_el.type("solomonweb26@gmail.com", delay=50)
            print("Typed Apple ID")
            await email_el.press("Enter")
            await page2.wait_for_timeout(4000)
            await page2.screenshot(path=ss("asc_02"))
            print(f"After email: {page2.url}")

            # Refresh auth frame
            auth_frame = next((f for f in page2.frames if "idmsa.apple.com" in f.url), None)

            if auth_frame:
                try:
                    pass_el = await auth_frame.wait_for_selector("#password_text_field", timeout=8000)
                    if pass_el and await pass_el.is_visible():
                        await pass_el.click()
                        await pass_el.type("Hdsignals1987", delay=50)
                        print("Typed password")
                        sign_btn = await auth_frame.query_selector("#sign-in")
                        if sign_btn:
                            await sign_btn.click()
                        else:
                            await pass_el.press("Enter")
                        print("Sign in submitted")
                except Exception as e:
                    print(f"Password step: {e}")

            await page2.wait_for_timeout(5000)
            await page2.screenshot(path=ss("asc_03_after_signin"))
            print(f"After sign in: {page2.url}")

            # Check 2FA
            all_text = " ".join([await f.inner_text("body") async for f in [page2] if True])
            for frame in page2.frames:
                try:
                    all_text += await frame.inner_text("body")
                except:
                    pass

            needs_2fa = any(kw in all_text.lower() for kw in [
                "verification code", "two-factor", "sent to your mac",
                "sent to your iphone", "6-digit"
            ])

            if needs_2fa:
                print("\n*** 2FA CODE NEEDED ***")
                print("Check your Mac/iPhone for a notification from Apple")
                print("The 6-digit code should appear in a dialog on your Mac")
                print("Enter it in the 6 boxes shown in the Chromium browser window")
                print("Waiting 5 minutes for code entry...")

                for i in range(60):
                    await asyncio.sleep(5)
                    cur = page2.url
                    await page2.screenshot(path=ss(f"asc_2fa_{i:02d}"))
                    if "appstoreconnect.apple.com" in cur and "login" not in cur:
                        print(f"2FA complete! {cur}")
                        break
                    if i % 12 == 0 and i > 0:
                        print(f"  {i*5}s - still waiting for 2FA...")
            else:
                print("No 2FA detected")

        # Check auth status
        final_url = page2.url
        print(f"\nFinal URL: {final_url}")

        if "appstoreconnect.apple.com" in final_url and "login" not in final_url:
            print("Authenticated! Creating apps...")
            await goto_safe(page2, "https://appstoreconnect.apple.com/apps")
            await page2.wait_for_timeout(3000)
            await page2.screenshot(path=ss("asc_04_apps"))
            body = await page2.inner_text("body")
            print(f"Apps page:\n{body[:2000]}")

            if "sign in" not in body.lower():
                for app in [
                    ("Daily Games", "cc.dailygames.app", "dailygames001", "dailygames"),
                    ("PlayToMaster", "com.playtomaster.app", "playtomaster001", "playtomaster"),
                ]:
                    await create_app_final(page2, *app)
                    await goto_safe(page2, "https://appstoreconnect.apple.com/apps")
                    await page2.wait_for_timeout(2000)
        else:
            print("Not authenticated")

        await browser.close()
        print("\n=== ALL DONE ===")


async def create_app_final(page, name, bundle_id, sku, tag):
    print(f"\n--- Creating: {name} ---")

    # Find and click the new app button
    btns_info = await page.evaluate("""() => {
        return Array.from(document.querySelectorAll('button, [role=button], a[href]')).slice(0, 30).map(el => ({
            text: el.textContent.trim().slice(0, 50),
            aria: el.getAttribute('aria-label'),
            href: el.getAttribute('href'),
        }));
    }""")
    print("Page buttons:")
    for b in btns_info:
        print(f"  {b}")

    clicked = await page.evaluate("""() => {
        const els = document.querySelectorAll('button, [role=button]');
        for(const el of els) {
            const txt = el.textContent.trim();
            const aria = el.getAttribute('aria-label') || '';
            if(txt === '+' || txt.toLowerCase() === 'new app' || aria.toLowerCase().includes('new app')) {
                el.click();
                return txt || aria;
            }
        }
        return null;
    }""")
    print(f"Clicked new app: {clicked}")

    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss(f"asc_{tag}_01"))
    body = await page.inner_text("body")
    print(f"After new app:\n{body[:300]}")

    # Fill form
    filled = await page.evaluate(f"""() => {{
        const results = [];

        // iOS checkbox
        const iosInputs = document.querySelectorAll('input[value="IOS"], input[value="iOS"]');
        iosInputs.forEach(el => {{ el.checked = true; el.dispatchEvent(new Event('change', {{bubbles: true}})); results.push('iOS'); }});

        // App Name
        const nameInputs = document.querySelectorAll('input[name="appName"], #appName');
        nameInputs.forEach(el => {{
            el.value = '{name}';
            el.dispatchEvent(new Event('input', {{bubbles: true}}));
            el.dispatchEvent(new Event('change', {{bubbles: true}}));
            results.push('name');
        }});

        // SKU
        ['vendorId', 'sku'].forEach(fname => {{
            const el = document.querySelector(`input[name="${{fname}}"], #${{fname}}`);
            if(el) {{
                el.value = '{sku}';
                el.dispatchEvent(new Event('input', {{bubbles: true}}));
                el.dispatchEvent(new Event('change', {{bubbles: true}}));
                results.push('sku');
            }}
        }});

        return results;
    }}""")
    print(f"JS filled: {filled}")

    # Language select
    await page.evaluate("""() => {
        const selects = document.querySelectorAll('select');
        selects.forEach(sel => {
            const opts = Array.from(sel.options);
            const eng = opts.find(o => o.text.includes('English (U.S.)') || o.value === 'en-US');
            if(eng) {
                sel.value = eng.value;
                sel.dispatchEvent(new Event('change', {bubbles: true}));
            }
        });
    }""")

    # Bundle ID select
    bundle_selected = await page.evaluate(f"""() => {{
        const selects = document.querySelectorAll('select');
        for(const sel of selects) {{
            const opts = Array.from(sel.options);
            const match = opts.find(o => o.value.includes('{bundle_id}') || o.text.includes('{bundle_id}'));
            if(match) {{
                sel.value = match.value;
                sel.dispatchEvent(new Event('change', {{bubbles: true}}));
                return match.value;
            }}
        }}
        return null;
    }}""")
    print(f"Bundle ID selected: {bundle_selected}")

    # Full Access
    await page.evaluate("""() => {
        const inputs = document.querySelectorAll('input[value="FULL_ACCESS"]');
        inputs.forEach(el => {
            el.checked = true;
            el.dispatchEvent(new Event('change', {bubbles: true}));
        });
    }""")

    await page.wait_for_timeout(1000)
    await page.screenshot(path=ss(f"asc_{tag}_02"))

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
    print(f"Create clicked: {create_clicked}")

    await page.wait_for_timeout(5000)
    await page.screenshot(path=ss(f"asc_{tag}_03"))
    body = await page.inner_text("body")
    print(f"Result: {page.url}")
    print(f"Content: {body[:400]}")


asyncio.run(main())
