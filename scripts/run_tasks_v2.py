#!/usr/bin/env python3
"""
Two-task automation v2 - more robust input handling
"""

import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/appstore"

def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"


async def task2_api_bible(browser):
    print("\n" + "="*60)
    print("TASK 2: api.bible - Complete Signup + Get API Key")
    print("="*60)

    ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
    page = await ctx.new_page()

    # The signup flow goes to /sign-up which shows plans, then /sign-up/starter
    # Let's go directly to starter plan since we want free tier
    await page.goto("https://api.bible/sign-up/starter", wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(2000)
    await page.screenshot(path=ss("t2_01_starter_plan"))
    print(f"URL: {page.url}")

    body = await page.inner_text("body")
    print("Page content:\n" + body[:3000])

    # Dump all inputs
    inputs = await page.query_selector_all("input, select, textarea")
    print("\nForm elements:")
    for el in inputs:
        tag = await el.evaluate("el => el.tagName.toLowerCase()")
        t = await el.get_attribute("type") or ""
        n = await el.get_attribute("name") or ""
        pid = await el.get_attribute("id") or ""
        ph = await el.get_attribute("placeholder") or ""
        print(f"  <{tag}> type={t} name={n} id={pid} placeholder={ph}")

    # Fill App Name field
    app_name_filled = False
    for sel in ['input[name="appName"]', 'input[id="appName"]', 'input[placeholder*="app" i]',
                'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                await el.fill("BibleHabit")
                print(f"Filled app name: {sel}")
                app_name_filled = True
                break
        except:
            pass

    await page.wait_for_timeout(1000)

    # Select revenue model - No revenue (free app)
    for sel in ['input[value="NO"]', 'input[value="no"]', 'label:has-text("No") input',
                'label:has-text("No, there will be no") input']:
        try:
            el = await page.query_selector(sel)
            if el:
                await el.check()
                print("Selected no revenue")
                break
        except:
            pass

    # Select user count - 0-1K
    for sel in ['input[value="0-1K"]', 'input[value="0_1K"]', 'select[name*="user" i]']:
        try:
            el = await page.query_selector(sel)
            if el:
                t = await el.get_attribute("type")
                if t == "radio":
                    await el.check()
                else:
                    await el.select_option(index=0)
                print("Selected 0-1K users")
                break
        except:
            pass

    await page.screenshot(path=ss("t2_02_step1_filled"))

    # Click Continue
    for sel in ['button:has-text("Continue")', 'a:has-text("Continue")', 'button[type="submit"]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                print(f"Clicked continue: {sel}")
                break
        except:
            pass

    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss("t2_03_step2"))
    print(f"Step 2 URL: {page.url}")
    body = await page.inner_text("body")
    print("Step 2 content:\n" + body[:2000])

    # Continue through remaining steps
    for step in range(3, 8):
        inputs_on_page = await page.query_selector_all("input[type='text'], input[type='email'], input[type='password'], textarea")
        for inp in inputs_on_page:
            n = (await inp.get_attribute("name") or "").lower()
            pid = (await inp.get_attribute("id") or "").lower()
            ph = (await inp.get_attribute("placeholder") or "").lower()
            t = (await inp.get_attribute("type") or "").lower()

            if "email" in n + pid + ph or t == "email":
                await inp.fill("hello@biblehabit.co")
                print("Filled email")
            elif "password" in n + pid + ph or t == "password":
                await inp.fill("BibleHabit2026!")
                print("Filled password")
            elif "first" in n + pid + ph:
                await inp.fill("BibleHabit")
                print("Filled first name")
            elif "last" in n + pid + ph:
                await inp.fill("App")
                print("Filled last name")
            elif "name" in n + pid + ph:
                await inp.fill("BibleHabit")
                print("Filled name")
            elif "org" in n + pid + ph or "company" in n + pid + ph:
                await inp.fill("BibleHabit")
                print("Filled org")

        await page.wait_for_timeout(500)
        await page.screenshot(path=ss(f"t2_step{step}_before_continue"))

        # Click Continue/Next/Submit
        clicked = False
        for sel in ['button:has-text("Continue")', 'button:has-text("Next")',
                    'button:has-text("Finish")', 'button:has-text("Create")',
                    'button[type="submit"]', 'a:has-text("Continue")']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    clicked = True
                    print(f"Step {step}: clicked {sel}")
                    break
            except:
                pass

        if not clicked:
            print(f"Step {step}: no continue button found, stopping")
            break

        await page.wait_for_timeout(3000)
        new_url = page.url
        await page.screenshot(path=ss(f"t2_step{step}_after"))
        body = await page.inner_text("body")
        print(f"Step {step} result URL: {new_url}")
        print(f"Content: {body[:500]}")

        # Check if we reached the API key page
        if "api-key" in new_url or "key" in new_url or "applications" in new_url or "dashboard" in new_url:
            print("Reached API key page!")
            break

        # Check if we hit an account creation page
        if "sign-up" not in new_url and "starter" not in new_url:
            print(f"URL changed to: {new_url}")

    # Final screenshot and look for API key
    await page.screenshot(path=ss("t2_final"))
    body = await page.inner_text("body")
    print("\nFinal page content:\n" + body[:3000])

    # Look for API key patterns in page content
    import re
    # API keys are often alphanumeric strings 32+ chars
    potential_keys = re.findall(r'[a-f0-9]{32,}', body)
    if potential_keys:
        print(f"\nPotential API keys found: {potential_keys}")

    # Also check for structured key display
    for sel in ['[class*="key"]', '[id*="key"]', 'code', 'pre', '.token', '.api-key']:
        try:
            els = await page.query_selector_all(sel)
            for el in els:
                text = (await el.inner_text()).strip()
                if len(text) > 15:
                    print(f"Key element ({sel}): {text}")
        except:
            pass

    await ctx.close()


async def task1_appstore_login(browser):
    """Handle App Store Connect login with proper input interaction"""
    print("\n" + "="*60)
    print("TASK 1: App Store Connect Login + Create Apps")
    print("="*60)

    ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
    page = await ctx.new_page()

    # Navigate to login page
    await page.goto("https://appstoreconnect.apple.com", wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss("t1_01_initial"))
    print(f"Initial URL: {page.url}")

    # The login page is actually served in an iframe or as a redirect
    # Let's check what we see
    body = await page.inner_text("body")
    print(f"Initial body: {body[:500]}")

    # Try clicking sign in if present
    for sel in ['a:has-text("Sign In")', 'button:has-text("Sign In")', '#sign-in']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                print(f"Clicked sign in: {sel}")
                await page.wait_for_timeout(3000)
                break
        except:
            pass

    await page.screenshot(path=ss("t1_02_login_page"))
    print(f"Login URL: {page.url}")

    # The Apple login has a special input that may need click + type approach
    # Try finding the input by querying all inputs
    all_inputs = await page.query_selector_all("input")
    print(f"Inputs found: {len(all_inputs)}")
    for inp in all_inputs:
        t = await inp.get_attribute("type")
        n = await inp.get_attribute("name")
        pid = await inp.get_attribute("id")
        ph = await inp.get_attribute("placeholder")
        vis = await inp.is_visible()
        print(f"  type={t} name={n} id={pid} placeholder={ph} visible={vis}")

    # Try clicking directly on email input and typing
    email_input = None
    for sel in ['input[name="accountName"]', '#accountName', '#account_name_text_field',
                'input[type="email"]', 'input[placeholder*="Email" i]',
                'input[placeholder*="Apple" i]', 'input[autocomplete="username"]',
                'input:not([type="hidden"])']:
        try:
            el = await page.query_selector(sel)
            if el:
                vis = await el.is_visible()
                print(f"Found input: {sel}, visible={vis}")
                if vis:
                    email_input = el
                    break
        except:
            pass

    if email_input:
        # Click, clear, type
        await email_input.click()
        await page.wait_for_timeout(500)
        await email_input.press("Control+a")
        await email_input.type("solomonweb26@gmail.com", delay=50)
        print("Typed email address")
        await page.wait_for_timeout(500)
        await page.screenshot(path=ss("t1_03_email_typed"))

        # Submit with Enter or click the arrow button
        await email_input.press("Enter")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("t1_04_after_email_submit"))
        print(f"After email submit: {page.url}")
    else:
        print("Could not find email input!")
        # Try using keyboard to navigate
        await page.keyboard.press("Tab")
        await page.wait_for_timeout(500)
        await page.keyboard.type("solomonweb26@gmail.com", delay=50)
        await page.wait_for_timeout(500)
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("t1_03_keyboard_fallback"))

    # Now look for password field
    await page.wait_for_timeout(2000)
    all_inputs = await page.query_selector_all("input")
    print(f"\nInputs after email submit: {len(all_inputs)}")
    for inp in all_inputs:
        t = await inp.get_attribute("type")
        n = await inp.get_attribute("name")
        pid = await inp.get_attribute("id")
        vis = await inp.is_visible()
        print(f"  type={t} name={n} id={pid} visible={vis}")

    for sel in ['input[type="password"]', 'input[name="password"]', '#password',
                'input[autocomplete="current-password"]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                await el.type("Hdsignals1987", delay=50)
                print(f"Typed password: {sel}")
                await page.wait_for_timeout(500)
                await el.press("Enter")
                break
        except:
            pass

    await page.wait_for_timeout(5000)
    await page.screenshot(path=ss("t1_05_after_password"))
    print(f"After password: {page.url}")

    # Check for 2FA
    body = await page.inner_text("body")
    url = page.url
    print(f"URL: {url}")

    # Look for 2FA indicators
    is_2fa = any(kw in body.lower() for kw in [
        "verification code", "trusted device", "enter the code",
        "two-factor", "2fa", "6-digit", "verify your identity"
    ]) or "verify" in url.lower() or "two" in url.lower()

    if is_2fa:
        print("\n*** 2FA PAGE DETECTED ***")
        print("Content:", body[:500])
        await page.screenshot(path=ss("t1_06_2fa"))

        # Check for any code input
        all_inputs = await page.query_selector_all("input")
        print("Inputs on 2FA page:")
        for inp in all_inputs:
            t = await inp.get_attribute("type")
            n = await inp.get_attribute("name")
            pid = await inp.get_attribute("id")
            vis = await inp.is_visible()
            print(f"  type={t} name={n} id={pid} visible={vis}")

        print("\n*** MANUAL INTERVENTION NEEDED ***")
        print("The browser is open with the 2FA page.")
        print("Waiting 3 minutes for you to enter the 2FA code...")

        for i in range(36):  # 36 * 5s = 3 min
            await asyncio.sleep(5)
            current_url = page.url
            await page.screenshot(path=ss(f"t1_2fa_wait_{i:02d}"))

            if "appstoreconnect.apple.com/apps" in current_url or (
                "appstoreconnect" in current_url and
                "login" not in current_url and
                "verify" not in current_url
            ):
                print(f"Authenticated! URL: {current_url}")
                break

            body_check = await page.inner_text("body")
            if "my apps" in body_check.lower():
                print("On apps page!")
                break

            if i % 6 == 0:
                print(f"Waiting... ({i*5}s) URL: {current_url}")
    else:
        print("No 2FA detected")

    # Now proceed to create apps
    current_url = page.url
    print(f"\nCurrent URL: {current_url}")

    if "appstoreconnect" in current_url and "login" not in current_url:
        await page.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("t1_07_apps_page"))
        print(f"Apps page: {page.url}")
        body = await page.inner_text("body")
        print("Apps page:\n" + body[:2000])

        # Try to create apps
        if "sign in" not in body.lower():
            await create_app_v2(page, ctx, {
                "name": "Daily Games",
                "bundle_id": "cc.dailygames.app",
                "sku": "dailygames001",
                "tag": "dailygames"
            })

            # Go back to apps page for second app
            await page.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            await create_app_v2(page, ctx, {
                "name": "PlayToMaster",
                "bundle_id": "com.playtomaster.app",
                "sku": "playtomaster001",
                "tag": "playtomaster"
            })
    else:
        print("Still on login page - authentication failed")

    await ctx.close()


async def create_app_v2(page, ctx, app_info):
    """Create a new app in App Store Connect v2"""
    tag = app_info["tag"]
    print(f"\n--- Creating: {app_info['name']} ---")

    body = await page.inner_text("body")
    print(f"Apps page has 'New App': {'new app' in body.lower()}")

    # Click "+" or "New App" button
    clicked = False
    # Try various button selectors
    buttons = await page.query_selector_all("button, a")
    for btn in buttons:
        text = (await btn.inner_text()).strip()
        if text in ["+", "New App", "New app"]:
            await btn.click()
            clicked = True
            print(f"Clicked button: '{text}'")
            break

    if not clicked:
        # Try by aria-label
        for sel in ['[aria-label="Add an app"]', '[aria-label="New App"]', '.add-button', '#add-app']:
            try:
                el = await page.query_selector(sel)
                if el:
                    await el.click()
                    clicked = True
                    print(f"Clicked: {sel}")
                    break
            except:
                pass

    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss(f"t1_{tag}_01_modal"))
    body = await page.inner_text("body")
    print("After clicking new app:", body[:500])

    # Fill the new app form (usually a modal/dialog)
    # Platform selection
    for sel in ['input[value="iOS"]', 'input[value="ios"]', 'label:has-text("iOS") input']:
        try:
            el = await page.query_selector(sel)
            if el:
                await el.check()
                print("Checked iOS")
                break
        except:
            pass

    # App Name
    for sel in ['input[name="appName"]', 'input[name="name"]', 'input[id="appName"]',
                'input[placeholder*="name" i]', 'input[aria-label*="Name" i]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                await el.fill("")
                await el.type(app_info['name'], delay=30)
                print(f"Filled name: {app_info['name']}")
                break
        except:
            pass

    # Primary Language
    for sel in ['select[name="primaryLocale"]', 'select[id="primaryLocale"]',
                'select[aria-label*="language" i]', 'select[aria-label*="locale" i]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                # Try to select English US
                try:
                    await el.select_option(label="English (U.S.)")
                except:
                    try:
                        await el.select_option(value="en-US")
                    except:
                        pass
                print("Selected language")
                break
        except:
            pass

    # Bundle ID dropdown
    for sel in ['select[name="bundleId"]', 'select[id="bundleId"]',
                'select[aria-label*="bundle" i]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                try:
                    await el.select_option(value=app_info['bundle_id'])
                except:
                    # Try to select by text
                    await el.select_option(label=app_info['bundle_id'])
                print(f"Selected bundle ID: {app_info['bundle_id']}")
                break
        except:
            pass

    # SKU
    for sel in ['input[name="vendorId"]', 'input[name="sku"]', 'input[id="vendorId"]',
                'input[id="sku"]', 'input[placeholder*="SKU" i]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                await el.fill(app_info['sku'])
                print(f"Filled SKU: {app_info['sku']}")
                break
        except:
            pass

    # User Access - Full Access
    for sel in ['input[value="FULL_ACCESS"]', 'input[value="fullAccess"]',
                'label:has-text("Full Access") input']:
        try:
            el = await page.query_selector(sel)
            if el:
                await el.check()
                print("Selected Full Access")
                break
        except:
            pass

    await page.screenshot(path=ss(f"t1_{tag}_02_form_filled"))

    # Submit / Create
    for sel in ['button:has-text("Create")', 'button[type="submit"]', 'input[type="submit"]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                print(f"Clicked create")
                break
        except:
            pass

    await page.wait_for_timeout(5000)
    await page.screenshot(path=ss(f"t1_{tag}_03_result"))
    body = await page.inner_text("body")
    print(f"Create result URL: {page.url}")
    print(f"Result content: {body[:500]}")


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    print(f"Screenshots: {SCREENSHOT_DIR}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--no-sandbox"],
            slow_mo=100
        )

        # Task 2: api.bible (no 2FA needed)
        await task2_api_bible(browser)

        # Task 1: App Store Connect (requires 2FA)
        await task1_appstore_login(browser)

        print("\n=== DONE ===")
        await browser.close()

asyncio.run(main())
