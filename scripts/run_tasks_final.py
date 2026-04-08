#!/usr/bin/env python3
"""
Final automation script:
Task 1: App Store Connect - login via iframe + create Daily Games + PlayToMaster
Task 2: api.bible - complete signup form + get API key + Bible IDs
"""

import asyncio
import os
import re
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/appstore"

def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"


async def get_auth_frame(page):
    """Get the Apple auth iframe frame"""
    for frame in page.frames:
        if "idmsa.apple.com" in frame.url:
            return frame
    return None


async def task1_appstore(browser):
    print("\n" + "="*60)
    print("TASK 1: App Store Connect - Login + Create Apps")
    print("="*60)

    ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
    page = await ctx.new_page()

    print("Loading App Store Connect...")
    await page.goto("https://appstoreconnect.apple.com", wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss("t1_01_initial"))
    print(f"URL: {page.url}")

    # Get auth iframe
    auth_frame = await get_auth_frame(page)
    if not auth_frame:
        print("Auth iframe not found!")
        for f in page.frames:
            print(f"  Frame: {f.url}")
    else:
        print(f"Found auth frame: {auth_frame.url[:60]}")

        # Fill email in iframe
        email_input = await auth_frame.query_selector("#account_name_text_field")
        if email_input:
            await email_input.click()
            await email_input.fill("")
            await email_input.type("solomonweb26@gmail.com", delay=50)
            print("Typed Apple ID email")
        else:
            print("Email input not found in iframe")

        await page.screenshot(path=ss("t1_02_email_typed"))

        # Click the arrow/continue button
        # It's a button with the arrow icon in the iframe
        arrow_btn = await auth_frame.query_selector("#sign-in, button[type='submit'], .button-primary, [data-index='0']")
        if arrow_btn:
            await arrow_btn.click()
            print("Clicked continue/arrow")
        else:
            # Press Enter
            if email_input:
                await email_input.press("Enter")
                print("Pressed Enter on email")

        await page.wait_for_timeout(4000)
        await page.screenshot(path=ss("t1_03_after_email"))
        print(f"After email: {page.url}")

        # Refresh frame reference
        auth_frame = await get_auth_frame(page)

        # Now look for password
        if auth_frame:
            pass_input = await auth_frame.query_selector("#password_text_field")
            if pass_input and await pass_input.is_visible():
                await pass_input.click()
                await pass_input.type("Hdsignals1987", delay=50)
                print("Typed password")
                await page.wait_for_timeout(500)
                await page.screenshot(path=ss("t1_04_password_typed"))

                # Submit
                sign_in_btn = await auth_frame.query_selector("#sign-in")
                if sign_in_btn:
                    await sign_in_btn.click()
                    print("Clicked sign in")
                else:
                    await pass_input.press("Enter")
                    print("Pressed Enter on password")
            else:
                print("Password input not visible yet")
                # Maybe email and password are on same page
                inputs = await auth_frame.query_selector_all("input:not([type='hidden'])")
                print(f"All visible inputs: {len(inputs)}")
                for inp in inputs:
                    t = await inp.get_attribute("type")
                    pid = await inp.get_attribute("id")
                    vis = await inp.is_visible()
                    print(f"  {t} {pid} visible={vis}")

        await page.wait_for_timeout(5000)
        await page.screenshot(path=ss("t1_05_after_signin"))
        print(f"After sign in: {page.url}")

    # 2FA handling
    body = await page.inner_text("body")
    url = page.url

    # Check all frames for 2FA content
    all_body = body
    for frame in page.frames:
        try:
            fb = await frame.inner_text("body")
            all_body += " " + fb
        except:
            pass

    is_2fa = any(kw in all_body.lower() for kw in [
        "verification code", "trusted device", "enter the code",
        "two-factor", "6-digit", "verify your identity", "security code"
    ])

    if is_2fa or "verify" in url.lower():
        print("\n*** 2FA REQUIRED - CHECK TRUSTED DEVICE ***")
        await page.screenshot(path=ss("t1_06_2fa"))

        # Print 2FA page content from all frames
        for i, frame in enumerate(page.frames):
            try:
                fb = await frame.inner_text("body")
                if "verification" in fb.lower() or "code" in fb.lower() or "trust" in fb.lower():
                    print(f"2FA frame {i} content:\n{fb[:500]}")
            except:
                pass

        print("\nWaiting up to 3 minutes for 2FA completion...")
        for i in range(36):
            await asyncio.sleep(5)
            current_url = page.url
            await page.screenshot(path=ss(f"t1_2fa_{i:02d}"))

            if "appstoreconnect.apple.com/apps" in current_url or (
                "appstoreconnect.apple.com" in current_url and
                "login" not in current_url
            ):
                print(f"Authenticated! URL: {current_url}")
                break

            if i % 6 == 0:
                print(f"Waiting... {i*5}s | URL: {current_url}")

    # Navigate to apps
    final_url = page.url
    print(f"\nFinal URL: {final_url}")

    if "appstoreconnect.apple.com" in final_url and "login" not in final_url:
        await page.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("t1_07_apps_page"))
        body = await page.inner_text("body")
        print(f"Apps page URL: {page.url}")
        print(f"Apps page (first 1500):\n{body[:1500]}")

        if "sign in" not in body.lower():
            # Create Daily Games
            await create_app(page, {
                "name": "Daily Games",
                "bundle_id": "cc.dailygames.app",
                "sku": "dailygames001",
                "tag": "dailygames"
            })

            # Go back and create PlayToMaster
            await page.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            await create_app(page, {
                "name": "PlayToMaster",
                "bundle_id": "com.playtomaster.app",
                "sku": "playtomaster001",
                "tag": "playtomaster"
            })
    else:
        print("Authentication failed - still on login page")

    await ctx.close()


async def create_app(page, app_info):
    """Create a new app in App Store Connect"""
    tag = app_info["tag"]
    print(f"\n--- Creating: {app_info['name']} ---")

    # Click "+" or "New App" button
    # App Store Connect uses React - buttons may have various attributes
    clicked = False

    # Try finding the new app button
    all_btns = await page.query_selector_all("button, a[role='button']")
    for btn in all_btns:
        try:
            text = (await btn.inner_text()).strip()
            aria = await btn.get_attribute("aria-label") or ""
            if text == "+" or "new app" in text.lower() or "new app" in aria.lower():
                await btn.click()
                clicked = True
                print(f"Clicked: '{text or aria}'")
                break
        except:
            pass

    if not clicked:
        # Try data-label or other attributes
        for sel in [
            '[data-test-id="add-app"]',
            '[aria-label*="New"]',
            '.add-app-button',
            'a[href*="new"]',
        ]:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    clicked = True
                    print(f"Clicked: {sel}")
                    break
            except:
                pass

    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss(f"t1_{tag}_01_clicked_new"))

    body = await page.inner_text("body")
    print(f"After new app click:\n{body[:500]}")

    # Fill form in modal
    # Platform iOS
    for sel in [
        'input[value="IOS"]', 'input[value="iOS"]', 'input[value="ios"]',
        'label:has-text("iOS") input[type="checkbox"]',
        'label:has-text("iOS") input[type="radio"]',
    ]:
        try:
            el = await page.query_selector(sel)
            if el:
                checked = await el.is_checked()
                if not checked:
                    await el.check()
                print(f"iOS selected via {sel}")
                break
        except:
            pass

    # App Name
    for sel in [
        'input[name="appName"]', 'input[id="appName"]',
        'input[aria-label*="App Name"]', 'input[placeholder*="App Name"]',
        'input[data-test-id*="name"]',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.triple_click()
                await el.fill(app_info['name'])
                print(f"Filled name: {app_info['name']}")
                break
        except:
            pass

    # Primary Language
    for sel in [
        'select[name="primaryLocale"]', '#primaryLocale',
        'select[aria-label*="anguage"]', 'select[aria-label*="rimary"]',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                try:
                    await el.select_option(label="English (U.S.)")
                except:
                    await el.select_option(value="en-US")
                print("Selected English U.S.")
                break
        except:
            pass

    # Bundle ID
    for sel in [
        'select[name="bundleId"]', '#bundleId',
        'select[aria-label*="undle"]',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                try:
                    await el.select_option(value=app_info['bundle_id'])
                except:
                    # Find option by text
                    await el.select_option(label=app_info['bundle_id'])
                print(f"Bundle ID selected: {app_info['bundle_id']}")
                break
        except:
            pass

    # SKU
    for sel in [
        'input[name="vendorId"]', 'input[name="sku"]',
        '#vendorId', '#sku',
        'input[aria-label*="SKU"]', 'input[placeholder*="SKU"]',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.triple_click()
                await el.fill(app_info['sku'])
                print(f"Filled SKU: {app_info['sku']}")
                break
        except:
            pass

    # User Access - Full Access
    for sel in [
        'input[value="FULL_ACCESS"]', 'input[value="fullAccess"]',
        'label:has-text("Full Access") input',
    ]:
        try:
            el = await page.query_selector(sel)
            if el:
                await el.check()
                print("Selected Full Access")
                break
        except:
            pass

    await page.screenshot(path=ss(f"t1_{tag}_02_form_filled"))
    body = await page.inner_text("body")
    print(f"Form state:\n{body[:800]}")

    # Click Create
    for sel in [
        'button:has-text("Create")',
        'button[type="submit"]',
        'input[type="submit"]',
        '[data-test-id="create-app"]',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                print(f"Clicked Create: {sel}")
                break
        except:
            pass

    await page.wait_for_timeout(5000)
    await page.screenshot(path=ss(f"t1_{tag}_03_result"))
    print(f"After create: {page.url}")
    body = await page.inner_text("body")
    print(f"Result:\n{body[:500]}")


async def task2_api_bible(browser):
    print("\n" + "="*60)
    print("TASK 2: api.bible - Sign Up + Get API Key + Bible IDs")
    print("="*60)

    ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
    page = await ctx.new_page()

    # Step 1: Navigate to starter plan
    await page.goto("https://api.bible/sign-up/starter", wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(2000)
    await page.screenshot(path=ss("t2_01_step1"))
    print(f"Step 1 URL: {page.url}")

    body = await page.inner_text("body")
    print(f"Step 1:\n{body[:500]}")

    # Fill App Name
    app_name = await page.query_selector("#appName")
    if app_name:
        await app_name.fill("BibleHabit")
        print("Filled app name: BibleHabit")

    # Select "No revenue" radio - find by looking at all radios
    radios = await page.query_selector_all('input[type="radio"]')
    print(f"Radio buttons: {len(radios)}")
    for i, radio in enumerate(radios):
        # Get label text
        pid = await radio.get_attribute("id") or ""
        val = await radio.get_attribute("value") or ""
        print(f"  Radio {i}: id={pid} value={val}")

    # Try to check the "No" radio (no revenue)
    # Usually the last radio in the revenue section
    # Let's look at labels
    labels = await page.query_selector_all("label")
    print("\nLabels:")
    for label in labels:
        text = (await label.inner_text()).strip()
        if text:
            print(f"  [{text[:60]}]")

    # Select "No revenue" by clicking the label
    for label in labels:
        text = (await label.inner_text()).strip().lower()
        if "no, there will be no" in text or ("no" in text and "revenue" in text and "ads" in text):
            await label.click()
            print(f"Clicked no-revenue label")
            break

    # Select end user count - 0-1K
    for label in labels:
        text = (await label.inner_text()).strip()
        if text == "0-1K":
            await label.click()
            print("Selected 0-1K users")
            break

    await page.wait_for_timeout(1000)
    await page.screenshot(path=ss("t2_02_step1_filled"))

    # Click Continue
    continue_btn = await page.query_selector('button:has-text("Continue")')
    if continue_btn and await continue_btn.is_visible():
        await continue_btn.click()
        print("Clicked Continue")
    else:
        print("Continue button not found!")
        # Check if button is disabled
        all_btns = await page.query_selector_all("button")
        for btn in all_btns:
            text = (await btn.inner_text()).strip()
            disabled = await btn.get_attribute("disabled")
            print(f"  Button: [{text}] disabled={disabled}")

    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss("t2_03_after_step1"))
    print(f"After step 1: {page.url}")
    body = await page.inner_text("body")
    print(f"Step 2 content:\n{body[:1000]}")

    # Step 2: Organization info
    await page.wait_for_timeout(2000)
    inputs = await page.query_selector_all("input:not([type='hidden']):not([type='radio'])")
    print(f"\nStep 2 inputs: {len(inputs)}")
    for inp in inputs:
        t = await inp.get_attribute("type")
        n = await inp.get_attribute("name") or ""
        pid = await inp.get_attribute("id") or ""
        ph = await inp.get_attribute("placeholder") or ""
        print(f"  type={t} name={n} id={pid} placeholder={ph}")

    for inp in inputs:
        n = (await inp.get_attribute("name") or "").lower()
        pid = (await inp.get_attribute("id") or "").lower()
        ph = (await inp.get_attribute("placeholder") or "").lower()
        t = (await inp.get_attribute("type") or "").lower()

        combined = n + pid + ph
        if "email" in combined or t == "email":
            await inp.fill("hello@biblehabit.co")
            print("Filled email")
        elif "password" in combined or t == "password":
            await inp.fill("BibleHabit2026!")
            print("Filled password")
        elif "first" in combined:
            await inp.fill("BibleHabit")
            print("Filled first name")
        elif "last" in combined:
            await inp.fill("App")
            print("Filled last name")
        elif "org" in combined or "company" in combined:
            await inp.fill("BibleHabit")
            print("Filled org")
        elif "name" in combined:
            await inp.fill("BibleHabit App")
            print("Filled name")

    await page.screenshot(path=ss("t2_04_step2_filled"))

    # Click Continue for each remaining step
    for step in range(2, 8):
        continue_btn = await page.query_selector('button:has-text("Continue"), button:has-text("Finish"), button:has-text("Create Account")')
        if continue_btn and await continue_btn.is_visible():
            await continue_btn.click()
            print(f"Clicked continue on step {step}")
        else:
            # Check for submit button
            submit_btn = await page.query_selector('button[type="submit"]')
            if submit_btn and await submit_btn.is_visible():
                await submit_btn.click()
                print(f"Clicked submit on step {step}")
            else:
                print(f"No continue button found on step {step}, stopping")
                break

        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss(f"t2_step{step+1}"))
        new_url = page.url
        body = await page.inner_text("body")
        print(f"Step {step} result: {new_url}")
        print(f"Content:\n{body[:500]}")

        # Fill any new inputs
        inputs = await page.query_selector_all("input:not([type='hidden']):not([type='radio']):not([type='checkbox'])")
        for inp in inputs:
            n = (await inp.get_attribute("name") or "").lower()
            pid = (await inp.get_attribute("id") or "").lower()
            ph = (await inp.get_attribute("placeholder") or "").lower()
            t = (await inp.get_attribute("type") or "").lower()
            combined = n + pid + ph
            vis = await inp.is_visible()
            if not vis:
                continue
            val = await inp.input_value()
            if val:  # already filled
                continue

            if "email" in combined or t == "email":
                await inp.fill("hello@biblehabit.co")
                print("  Filled email")
            elif "password" in combined or t == "password":
                await inp.fill("BibleHabit2026!")
                print("  Filled password")
            elif "first" in combined:
                await inp.fill("BibleHabit")
                print("  Filled first name")
            elif "last" in combined:
                await inp.fill("App")
                print("  Filled last name")
            elif "org" in combined or "company" in combined:
                await inp.fill("BibleHabit")
                print("  Filled org")
            elif "name" in combined:
                await inp.fill("BibleHabit")
                print("  Filled name")

        # Check if we reached dashboard/API key page
        if any(kw in new_url for kw in ["dashboard", "applications", "api-key", "success"]):
            print("Reached dashboard!")
            break
        if any(kw in body.lower() for kw in ["api key", "your key", "application created"]):
            print("Found API key mention!")
            break

    # Look for API key on final page
    await page.screenshot(path=ss("t2_final"))
    body = await page.inner_text("body")
    print(f"\nFinal page ({page.url}):\n{body[:3000]}")

    # Extract potential API keys
    keys = re.findall(r'[a-f0-9-]{32,}', body)
    if keys:
        print(f"\nPotential API keys: {keys}")

    # Also check for any key-like elements
    for sel in ['code', 'pre', '[class*="key"]', '[class*="token"]', '.api-key', '#api-key']:
        try:
            els = await page.query_selector_all(sel)
            for el in els:
                text = (await el.inner_text()).strip()
                if len(text) > 10:
                    print(f"Key element ({sel}): {text[:100]}")
        except:
            pass

    # Now use the API to look up Bible IDs for NIV and ESV
    print("\n=== Looking up Bible IDs for NIV and ESV ===")

    # Try the public endpoint (some bibles are freely queryable)
    api_page = await ctx.new_page()

    # Check if we have any API key from the page
    # Try fetching bibles list - this requires an API key
    # But we can look at the scripture.api.bible documentation
    await api_page.goto("https://scripture.api.bible/livedocs", wait_until="networkidle", timeout=20000)
    await api_page.wait_for_timeout(2000)
    await api_page.screenshot(path=ss("t2_livedocs"))
    print(f"Live docs URL: {api_page.url}")

    # Also check the documentation for Bible IDs
    await api_page.goto("https://docs.api.bible/docs/getting-started", wait_until="networkidle", timeout=20000)
    await api_page.wait_for_timeout(2000)
    await api_page.screenshot(path=ss("t2_docs"))
    body = await api_page.inner_text("body")
    print(f"Docs content:\n{body[:1000]}")

    await ctx.close()


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    print(f"Screenshots: {SCREENSHOT_DIR}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=100,
            args=["--no-sandbox"]
        )

        # Task 2 first (no 2FA)
        await task2_api_bible(browser)

        # Task 1 (requires 2FA)
        await task1_appstore(browser)

        print("\n=== ALL DONE ===")
        await browser.close()

asyncio.run(main())
