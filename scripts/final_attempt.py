#!/usr/bin/env python3
"""
Final attempt - Apple 2FA with "Can't get to my Mac?" alternative + api.bible full flow
"""

import asyncio
import os
import re
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/final"

def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    print(f"Screenshots: {SCREENSHOT_DIR}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=200,
            args=["--no-sandbox"]
        )
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})

        # ============================================================
        # TASK 2: api.bible
        # ============================================================
        print("\n" + "="*60)
        print("TASK 2: api.bible")
        print("="*60)

        page = await ctx.new_page()
        try:
            await page.goto("https://api.bible/sign-up/starter", wait_until="domcontentloaded", timeout=15000)
        except:
            pass
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("apibible_01_start"))
        print(f"Step 1 URL: {page.url}")

        body = await page.inner_text("body")
        if "Step 1" not in body and "Customize" not in body:
            print("Not on expected step 1 page, content:", body[:200])
        else:
            print("On Step 1: Customize Your App")

        # Fill Step 1
        await page.evaluate("""() => {
            const el = document.getElementById('appName');
            if(el) { el.value = 'BibleHabit'; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); }
        }""")

        await page.evaluate("""() => {
            document.querySelectorAll('label').forEach(l => {
                if(l.textContent.toLowerCase().includes('no, there will be no')) l.click();
            });
        }""")

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
        await page.wait_for_timeout(2000)

        # Dismiss dialog
        await page.evaluate("""() => {
            document.querySelectorAll('button').forEach(b => {
                if(['Yes, continue', 'Yes'].includes(b.textContent.trim())) b.click();
            });
        }""")
        await page.wait_for_timeout(3000)

        body = await page.inner_text("body")
        on_step2 = "Step 2" in body and "Create Your Account" in body
        print(f"On Step 2: {on_step2}")
        await page.screenshot(path=ss("apibible_02_step2"))

        if on_step2:
            # Fill Step 2
            await page.evaluate("""() => {
                const map = {firstName: 'BibleHabit', lastName: 'App', organizationName: 'BibleHabit', email: 'hello@biblehabit.co'};
                Object.entries(map).forEach(([id, val]) => {
                    const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
                    if(el && !el.value) { el.value = val; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); }
                });
            }""")

            # Org Type dropdown
            await page.evaluate("""() => {
                document.querySelectorAll('button').forEach(b => { if(b.textContent.includes('organization type')) b.click(); });
            }""")
            await page.wait_for_timeout(1500)
            await page.evaluate("""() => {
                document.querySelectorAll('[role="option"], li, [data-value]').forEach(opt => {
                    if(opt.textContent.trim() === 'Individual' && opt.offsetParent !== null) opt.click();
                });
            }""")
            await page.wait_for_timeout(1000)

            # Location dropdown
            await page.evaluate("""() => {
                document.querySelectorAll('button').forEach(b => { if(b.textContent.includes('organization location')) b.click(); });
            }""")
            await page.wait_for_timeout(1500)
            await page.evaluate("""() => {
                document.querySelectorAll('[role="option"], li').forEach(opt => {
                    if(opt.textContent.trim() === 'United States' && opt.offsetParent !== null) opt.click();
                });
            }""")
            await page.wait_for_timeout(1000)

            # Re-fill fields after dropdown interactions
            await page.evaluate("""() => {
                const map = {firstName: 'BibleHabit', lastName: 'App', organizationName: 'BibleHabit', email: 'hello@biblehabit.co'};
                Object.entries(map).forEach(([id, val]) => {
                    const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
                    if(el && !el.value) { el.value = val; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); }
                });
                // Passwords
                document.querySelectorAll('input[type=password]').forEach(inp => {
                    if(!inp.value) { inp.value = 'BibleHabit2026!'; inp.dispatchEvent(new Event('input', {bubbles:true})); inp.dispatchEvent(new Event('change', {bubbles:true})); }
                });
            }""")

            await page.wait_for_timeout(1000)
            await page.screenshot(path=ss("apibible_03_step2_filled"))

            print("\n*** MANUAL ACTION: Please solve the reCAPTCHA in the Chromium window ***")
            print("Click 'I'm not a robot' then click 'Create Account'")
            print("Waiting up to 5 minutes...")

            # Watch for progression
            for i in range(60):
                await asyncio.sleep(5)
                body = await page.inner_text("body")
                url = page.url

                if "Step 3" in body or "Step 4" in body:
                    print(f"Advanced! Step content detected")
                    break
                if "dashboard" in url or "applications" in url:
                    print(f"Reached success: {url}")
                    break
                if i % 12 == 0 and i > 0:
                    print(f"  {i*5}s - waiting for reCAPTCHA and form submit...")

            await page.screenshot(path=ss("apibible_04_after_submit"))
            body = await page.inner_text("body")
            print(f"After reCAPTCHA wait URL: {page.url}")
            print(f"Body: {body[:400]}")

            # Continue through remaining steps
            for step in range(3, 8):
                await page.wait_for_timeout(2000)
                body = await page.inner_text("body")
                url = page.url

                step_match = re.search(r'Step (\d+) of', body)
                current = int(step_match.group(1)) if step_match else 0
                print(f"Step {step}: on step {current}")

                if current <= 2:
                    break  # Stuck or failed

                await page.evaluate("""() => {
                    document.querySelectorAll('button').forEach(b => {
                        if(['Continue', 'Next', 'Finish', 'Done'].includes(b.textContent.trim())) b.click();
                    });
                }""")
                await page.wait_for_timeout(3000)
                await page.screenshot(path=ss(f"apibible_step{step}"))

                if any(kw in url for kw in ["dashboard", "success", "applications"]):
                    print("SUCCESS!")
                    break

        # Final api.bible state
        await page.screenshot(path=ss("apibible_final"))
        body = await page.inner_text("body")
        print(f"\nFINAL api.bible: {page.url}")
        print(f"Body:\n{body[:2000]}")

        keys = re.findall(r'[a-f0-9-]{32,}', body)
        if keys:
            print(f"\n*** POTENTIAL API KEYS: {keys} ***")

        await page.close()

        # ============================================================
        # TASK 1: App Store Connect
        # ============================================================
        print("\n\n" + "="*60)
        print("TASK 1: App Store Connect")
        print("="*60)

        page2 = await ctx.new_page()
        try:
            await page2.goto("https://appstoreconnect.apple.com", wait_until="domcontentloaded", timeout=15000)
        except:
            pass
        await page2.wait_for_timeout(5000)
        await page2.screenshot(path=ss("asc_01"))
        print(f"URL: {page2.url}")

        # Login via iframe
        auth_frame = next((f for f in page2.frames if "idmsa.apple.com" in f.url), None)
        if not auth_frame:
            print("No Apple auth frame found, frames:", [f.url[:50] for f in page2.frames])
        else:
            # Fill email
            try:
                email_el = await auth_frame.wait_for_selector("#account_name_text_field", timeout=10000)
                await email_el.click()
                await email_el.fill("")
                await email_el.type("solomonweb26@gmail.com", delay=80)
                print("Apple ID typed")
                await email_el.press("Enter")
                await page2.wait_for_timeout(4000)
                await page2.screenshot(path=ss("asc_02"))
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
                        sign_btn = await auth_frame.query_selector("#sign-in")
                        if sign_btn:
                            await sign_btn.click()
                        else:
                            await pass_el.press("Enter")
                        print("Login submitted")
                except Exception as e:
                    print(f"Password error: {e}")

        await page2.wait_for_timeout(5000)
        await page2.screenshot(path=ss("asc_03_after_login"))
        print(f"After login: {page2.url}")

        # Check 2FA
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

        if needs_2fa:
            print("\n" + "="*60)
            print("*** APPLE 2FA CODE REQUIRED ***")
            print("")
            print("A 6-digit code was sent to your Mac.")
            print("The Chromium browser window shows 6 empty boxes.")
            print("")
            print("ALSO checking if 'Can't get to my Mac?' offers SMS option...")
            print("="*60)

            # Try clicking "Can't get to my Mac?"
            for frame in page2.frames:
                try:
                    cant_link = await frame.query_selector("a:has-text(\"Can't get\"), a:has-text(\"Can't reach\")")
                    if cant_link:
                        await cant_link.click()
                        print("Clicked 'Can't get to my Mac?'")
                        await page2.wait_for_timeout(3000)
                        await page2.screenshot(path=ss("asc_2fa_alt"))
                        alt_text = ""
                        for f in page2.frames:
                            try:
                                alt_text += await f.inner_text("body")
                            except:
                                pass
                        print(f"Alternative options:\n{alt_text[:500]}")
                        break
                except:
                    pass

            print("\nWaiting 10 minutes for 2FA code entry in Chromium window...")
            for i in range(120):
                await asyncio.sleep(5)
                cur = page2.url
                await page2.screenshot(path=ss(f"asc_2fa_{i:03d}"))

                if "appstoreconnect.apple.com" in cur and "login" not in cur:
                    print(f"2FA Complete! URL: {cur}")
                    break

                if i % 12 == 0 and i > 0:
                    print(f"  {i*5}s - waiting for 2FA code...")

        # Check final auth
        final_url = page2.url
        print(f"\nFinal URL: {final_url}")

        if "appstoreconnect.apple.com" in final_url and "login" not in final_url:
            print("Authenticated!")
            try:
                await page2.goto("https://appstoreconnect.apple.com/apps", wait_until="domcontentloaded", timeout=15000)
            except:
                pass
            await page2.wait_for_timeout(4000)
            await page2.screenshot(path=ss("asc_04_apps"))
            body = await page2.inner_text("body")
            print(f"Apps page:\n{body[:2000]}")

            if "sign in" not in body.lower():
                apps = [
                    ("Daily Games", "cc.dailygames.app", "dailygames001", "dailygames"),
                    ("PlayToMaster", "com.playtomaster.app", "playtomaster001", "playtomaster"),
                ]
                for app_name, bundle_id, sku, tag in apps:
                    await create_app(page2, app_name, bundle_id, sku, tag)
                    try:
                        await page2.goto("https://appstoreconnect.apple.com/apps", wait_until="domcontentloaded", timeout=15000)
                    except:
                        pass
                    await page2.wait_for_timeout(3000)
        else:
            print("Not authenticated - 2FA timed out")

        print("\n=== COMPLETE ===")
        await browser.close()


async def create_app(page, name, bundle_id, sku, tag):
    print(f"\n--- Creating: {name} ---")

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
    print(f"New App: {clicked}")

    if not clicked:
        return

    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss(f"asc_{tag}_01"))

    filled = await page.evaluate(f"""() => {{
        const r = [];
        // iOS
        document.querySelectorAll('input[value="IOS"], input[value="iOS"]').forEach(el => {{
            el.checked = true; el.dispatchEvent(new Event('change', {{bubbles:true}})); r.push('ios');
        }});
        // Name
        for(const n of ['appName']) {{
            const el = document.getElementById(n) || document.querySelector(`input[name="${{n}}"]`);
            if(el) {{ el.value = '{name}'; el.dispatchEvent(new Event('input', {{bubbles:true}})); r.push('name'); }}
        }}
        // Language
        document.querySelectorAll('select').forEach(sel => {{
            if(sel.name === 'primaryLocale' || sel.id === 'primaryLocale') {{
                const eng = Array.from(sel.options).find(o => o.text.includes('English (U.S.)'));
                if(eng) {{ sel.value = eng.value; sel.dispatchEvent(new Event('change', {{bubbles:true}})); r.push('lang'); }}
            }}
        }});
        // Bundle ID
        document.querySelectorAll('select').forEach(sel => {{
            const match = Array.from(sel.options).find(o => o.value.includes('{bundle_id}') || o.text.includes('{bundle_id}'));
            if(match) {{ sel.value = match.value; sel.dispatchEvent(new Event('change', {{bubbles:true}})); r.push('bundle=' + match.value); }}
        }});
        // SKU
        for(const n of ['vendorId', 'sku']) {{
            const el = document.getElementById(n) || document.querySelector(`input[name="${{n}}"]`);
            if(el) {{ el.value = '{sku}'; el.dispatchEvent(new Event('input', {{bubbles:true}})); r.push('sku'); }}
        }}
        // Full Access
        document.querySelectorAll('input[value="FULL_ACCESS"]').forEach(el => {{
            el.checked = true; el.dispatchEvent(new Event('change', {{bubbles:true}})); r.push('fullAccess');
        }});
        return r;
    }}""")
    print(f"Filled: {filled}")

    await page.wait_for_timeout(1000)
    await page.screenshot(path=ss(f"asc_{tag}_02"))

    create_res = await page.evaluate("""() => {
        const btns = document.querySelectorAll('button');
        for(const btn of btns) {
            if(btn.textContent.trim() === 'Create') { btn.click(); return 'clicked'; }
        }
        return null;
    }""")
    print(f"Create: {create_res}")

    await page.wait_for_timeout(5000)
    await page.screenshot(path=ss(f"asc_{tag}_03"))
    body = await page.inner_text("body")
    print(f"Result: {page.url}\n{body[:400]}")


asyncio.run(main())
