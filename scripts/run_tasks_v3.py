#!/usr/bin/env python3
"""
v3 - Handle api.bible "Are you sure?" dialog + Apple iframe login
"""

import asyncio
import os
import re
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/appstore"

def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"


async def dismiss_dialog_if_present(page):
    """Dismiss any 'Are you sure?' or overlay dialog"""
    for sel in [
        'button:has-text("Yes, continue")',
        'button:has-text("Yes")',
        'button:has-text("Continue")',
        'button:has-text("OK")',
        'button:has-text("Confirm")',
        '[role="dialog"] button:has-text("Yes")',
        '[role="alertdialog"] button',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                print(f"Dismissed dialog: {sel}")
                await page.wait_for_timeout(1000)
                return True
        except:
            pass
    return False


async def task2_api_bible(browser):
    print("\n" + "="*60)
    print("TASK 2: api.bible")
    print("="*60)

    ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
    page = await ctx.new_page()

    await page.goto("https://api.bible/sign-up/starter", wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(2000)
    await page.screenshot(path=ss("t2_01_step1"))

    # Fill App Name
    app_name = await page.query_selector("#appName")
    if app_name:
        await app_name.fill("BibleHabit")
        print("Filled app name: BibleHabit")

    # Select "No revenue" radio
    labels = await page.query_selector_all("label")
    for label in labels:
        text = (await label.inner_text()).strip().lower()
        if "no, there will be no" in text:
            await label.click()
            print("Clicked no-revenue label")
            await page.wait_for_timeout(500)
            break

    # Select 0-1K users
    for label in labels:
        text = (await label.inner_text()).strip()
        if text == "0-1K":
            await label.click()
            print("Selected 0-1K users")
            await page.wait_for_timeout(500)
            break

    await page.screenshot(path=ss("t2_02_step1_filled"))

    # Click Continue
    continue_btn = await page.query_selector('button:has-text("Continue")')
    if continue_btn and await continue_btn.is_visible():
        await continue_btn.click(force=True)  # Force click past any overlay
        print("Clicked Continue (forced)")
    await page.wait_for_timeout(2000)

    # Handle "Are you sure?" dialog
    await dismiss_dialog_if_present(page)
    await page.wait_for_timeout(2000)
    await page.screenshot(path=ss("t2_03_after_dialog"))
    print(f"After dialog: {page.url}")

    body = await page.inner_text("body")
    print(f"Content:\n{body[:500]}")

    # Continue through remaining steps (account creation)
    for step in range(2, 8):
        await page.wait_for_timeout(1000)

        # Fill any inputs on this step
        inputs = await page.query_selector_all("input:not([type='hidden']):not([type='radio']):not([type='checkbox'])")
        for inp in inputs:
            n = (await inp.get_attribute("name") or "").lower()
            pid = (await inp.get_attribute("id") or "").lower()
            ph = (await inp.get_attribute("placeholder") or "").lower()
            t = (await inp.get_attribute("type") or "").lower()
            combined = n + pid + ph
            if not await inp.is_visible():
                continue
            val = await inp.input_value()
            if val:
                continue

            if "email" in combined or t == "email":
                await inp.fill("hello@biblehabit.co")
                print(f"  Step {step}: filled email")
            elif "password" in combined or t == "password":
                await inp.fill("BibleHabit2026!")
                print(f"  Step {step}: filled password")
            elif "first" in combined:
                await inp.fill("BibleHabit")
                print(f"  Step {step}: filled first name")
            elif "last" in combined:
                await inp.fill("App")
                print(f"  Step {step}: filled last name")
            elif "org" in combined or "company" in combined:
                await inp.fill("BibleHabit")
                print(f"  Step {step}: filled org")
            elif "name" in combined:
                await inp.fill("BibleHabit")
                print(f"  Step {step}: filled name")

        await page.screenshot(path=ss(f"t2_step{step}_filled"))

        # Click Continue/Finish/Submit
        clicked = False
        for sel in [
            'button:has-text("Continue")',
            'button:has-text("Finish")',
            'button:has-text("Create Account")',
            'button:has-text("Sign Up")',
            'button[type="submit"]',
        ]:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click(force=True)
                    clicked = True
                    print(f"  Step {step}: clicked {sel}")
                    break
            except:
                pass

        if not clicked:
            print(f"  Step {step}: no continue button, done")
            break

        await page.wait_for_timeout(3000)

        # Handle any dialogs
        dismissed = await dismiss_dialog_if_present(page)
        if dismissed:
            await page.wait_for_timeout(2000)

        await page.screenshot(path=ss(f"t2_step{step}_result"))
        new_url = page.url
        body = await page.inner_text("body")
        print(f"  Step {step} -> {new_url}")
        print(f"  Content: {body[:300]}")

        # Success conditions
        if any(kw in new_url for kw in ["dashboard", "applications", "api-key", "success", "admin"]):
            print("  Reached success page!")
            break
        if any(kw in body.lower() for kw in ["your api key", "application created", "api key:"]):
            print("  Found API key mention!")
            break

    # Final state
    await page.screenshot(path=ss("t2_final"))
    body = await page.inner_text("body")
    print(f"\nFINAL URL: {page.url}")
    print(f"FINAL BODY:\n{body[:4000]}")

    # Extract API keys
    keys = re.findall(r'[a-f0-9-]{32,}', body)
    if keys:
        print(f"\nPotential API keys: {keys}")

    # Check visual elements for keys
    for sel in ['code', 'pre', '[class*="key"]', '[class*="token"]']:
        try:
            els = await page.query_selector_all(sel)
            for el in els:
                text = (await el.inner_text()).strip()
                if text and len(text) > 10:
                    print(f"Key element: {text[:200]}")
        except:
            pass

    # Now get Bible IDs for NIV and ESV
    print("\n=== Bible ID Lookup ===")

    # Check if we can get any API key from cookies/localStorage
    api_key = None
    local_storage = await page.evaluate("() => { const r = {}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); r[k]=localStorage.getItem(k); } return r; }")
    print(f"LocalStorage: {local_storage}")

    cookies = await ctx.cookies()
    print(f"Cookies: {[(c['name'], c['value'][:30]) for c in cookies]}")

    # Try fetching bibles via fetch in browser context
    # The API requires an API-KEY header
    # If we have a key, use it; otherwise try common demo keys from docs
    for demo_key in [api_key] if api_key else []:
        result = await page.evaluate(f"""async () => {{
            const r = await fetch('https://api.scripture.api.bible/v1/bibles', {{
                headers: {{ 'api-key': '{demo_key}' }}
            }});
            const data = await r.json();
            return data;
        }}""")
        print(f"Bibles API result: {str(result)[:500]}")

    await ctx.close()


async def task1_appstore(browser):
    print("\n" + "="*60)
    print("TASK 1: App Store Connect")
    print("="*60)

    ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
    page = await ctx.new_page()

    print("Loading App Store Connect...")
    await page.goto("https://appstoreconnect.apple.com", wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(4000)
    await page.screenshot(path=ss("t1_01_initial"))
    print(f"URL: {page.url}")

    # Find the Apple auth iframe
    auth_frame = None
    for frame in page.frames:
        if "idmsa.apple.com" in frame.url:
            auth_frame = frame
            print(f"Found auth frame: {frame.url[:80]}")
            break

    if not auth_frame:
        print("Auth iframe not found. Available frames:")
        for f in page.frames:
            print(f"  {f.url}")
        await ctx.close()
        return

    # Fill Apple ID in the iframe
    email_input = await auth_frame.wait_for_selector("#account_name_text_field", timeout=10000)
    if email_input:
        await email_input.click()
        await email_input.fill("")
        await email_input.type("solomonweb26@gmail.com", delay=50)
        print("Typed Apple ID")
        await page.wait_for_timeout(500)
        await page.screenshot(path=ss("t1_02_email_typed"))

        # Press Enter to proceed
        await email_input.press("Enter")
        await page.wait_for_timeout(4000)
        await page.screenshot(path=ss("t1_03_after_email"))
        print(f"After email: {page.url}")

    # Refresh frame reference after navigation
    auth_frame = None
    for frame in page.frames:
        if "idmsa.apple.com" in frame.url:
            auth_frame = frame
            break

    if auth_frame:
        # Wait for password field
        try:
            pass_input = await auth_frame.wait_for_selector("#password_text_field", timeout=10000)
            if pass_input and await pass_input.is_visible():
                await pass_input.click()
                await pass_input.type("Hdsignals1987", delay=50)
                print("Typed password")
                await page.wait_for_timeout(500)
                await page.screenshot(path=ss("t1_04_password"))

                # Click Sign In
                sign_in = await auth_frame.query_selector("#sign-in")
                if sign_in:
                    await sign_in.click()
                    print("Clicked Sign In")
                else:
                    await pass_input.press("Enter")
                    print("Pressed Enter")

        except Exception as e:
            print(f"Password field error: {e}")
            # Maybe email and password are on same step
            # Check all inputs
            inputs = await auth_frame.query_selector_all("input")
            for inp in inputs:
                pid = await inp.get_attribute("id")
                t = await inp.get_attribute("type")
                vis = await inp.is_visible()
                print(f"  Input: id={pid} type={t} vis={vis}")

    await page.wait_for_timeout(6000)
    await page.screenshot(path=ss("t1_05_after_signin"))
    print(f"After sign in: {page.url}")

    # Check for 2FA
    all_text = ""
    for frame in page.frames:
        try:
            ft = await frame.inner_text("body")
            all_text += ft + " "
        except:
            pass

    is_2fa = any(kw in all_text.lower() for kw in [
        "verification code", "trusted device", "enter the code",
        "two-factor", "6-digit", "verify your identity", "security code",
        "we sent", "check your"
    ])

    if is_2fa or "verify" in page.url.lower():
        print("\n*** 2FA REQUIRED ***")
        print("Content found:", all_text[:300])
        await page.screenshot(path=ss("t1_06_2fa"))

        print("\n*** WAITING UP TO 3 MINUTES FOR 2FA ***")
        print("Check your trusted Apple device for the 6-digit code")
        print("Enter it in the browser window...")

        for i in range(36):
            await asyncio.sleep(5)
            cur_url = page.url
            await page.screenshot(path=ss(f"t1_2fa_{i:02d}"))

            # Check all frames for 2FA code input
            for frame in page.frames:
                try:
                    inputs = await frame.query_selector_all("input")
                    for inp in inputs:
                        t = await inp.get_attribute("type")
                        pid = await inp.get_attribute("id") or ""
                        if t == "number" or "code" in pid.lower() or "digit" in pid.lower():
                            print(f"Found code input: id={pid}")
                except:
                    pass

            if "appstoreconnect.apple.com/apps" in cur_url or (
                "appstoreconnect.apple.com" in cur_url and "login" not in cur_url
            ):
                print(f"Authenticated! URL: {cur_url}")
                break

            if i % 6 == 0:
                print(f"Waiting... {i*5}s | {cur_url}")

    # Final URL check
    final_url = page.url
    print(f"\nFinal URL: {final_url}")

    if "appstoreconnect.apple.com" in final_url and "login" not in final_url:
        await page.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(4000)
        await page.screenshot(path=ss("t1_07_apps_page"))
        body = await page.inner_text("body")
        print(f"Apps page:\n{body[:2000]}")

        if "sign in" not in body.lower():
            await create_app(page, "Daily Games", "cc.dailygames.app", "dailygames001", "dailygames")
            await page.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)
            await create_app(page, "PlayToMaster", "com.playtomaster.app", "playtomaster001", "playtomaster")
        else:
            print("Still showing login - auth failed")
    else:
        print("Not on App Store Connect - auth failed")

    await ctx.close()


async def create_app(page, name, bundle_id, sku, tag):
    print(f"\n--- Creating: {name} ---")

    # Click the new app button
    clicked = False
    all_els = await page.query_selector_all("button, a[role='button'], [role='button']")
    for el in all_els:
        try:
            text = (await el.inner_text()).strip()
            aria = (await el.get_attribute("aria-label") or "").lower()
            if text == "+" or text.lower() == "new app" or "new app" in aria:
                await el.click()
                clicked = True
                print(f"Clicked: '{text or aria}'")
                break
        except:
            pass

    if not clicked:
        print("Could not find new app button, dumping page buttons:")
        for el in all_els:
            try:
                text = (await el.inner_text()).strip()
                aria = await el.get_attribute("aria-label")
                print(f"  [{text[:40]}] aria={aria}")
            except:
                pass

    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss(f"t1_{tag}_01"))

    body = await page.inner_text("body")
    print(f"After new app:\n{body[:400]}")

    # Fill iOS platform
    for sel in ['input[value="IOS"]', 'input[value="iOS"]', 'label:has-text("iOS") input']:
        try:
            el = await page.query_selector(sel)
            if el:
                await el.check()
                print("Checked iOS")
                break
        except:
            pass

    # App Name
    for sel in ['input[name="appName"]', '#appName', 'input[aria-label*="App Name"]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.fill(name)
                print(f"Filled name: {name}")
                break
        except:
            pass

    # Language
    for sel in ['select[name="primaryLocale"]', '#primaryLocale', 'select']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.select_option(label="English (U.S.)")
                print("Set language")
                break
        except:
            pass

    # Bundle ID
    selects = await page.query_selector_all("select")
    for sel_el in selects:
        options = await sel_el.query_selector_all("option")
        for opt in options:
            opt_val = await opt.get_attribute("value") or ""
            opt_text = (await opt.inner_text()).strip()
            if bundle_id in opt_val or bundle_id in opt_text:
                await sel_el.select_option(value=opt_val)
                print(f"Selected bundle: {opt_val}")
                break

    # SKU
    for sel in ['input[name="vendorId"]', 'input[name="sku"]', '#vendorId', '#sku']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.fill(sku)
                print(f"Filled SKU: {sku}")
                break
        except:
            pass

    # Full Access
    for sel in ['input[value="FULL_ACCESS"]', 'label:has-text("Full Access") input']:
        try:
            el = await page.query_selector(sel)
            if el:
                await el.check()
                print("Set Full Access")
                break
        except:
            pass

    await page.screenshot(path=ss(f"t1_{tag}_02_filled"))

    # Create
    for sel in ['button:has-text("Create")', 'button[type="submit"]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                print("Clicked Create")
                break
        except:
            pass

    await page.wait_for_timeout(5000)
    await page.screenshot(path=ss(f"t1_{tag}_03_result"))
    body = await page.inner_text("body")
    print(f"Result URL: {page.url}")
    print(f"Result:\n{body[:400]}")


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    print(f"Screenshots: {SCREENSHOT_DIR}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=100,
            args=["--no-sandbox"]
        )

        await task2_api_bible(browser)
        await task1_appstore(browser)

        print("\n=== DONE ===")
        await browser.close()

asyncio.run(main())
