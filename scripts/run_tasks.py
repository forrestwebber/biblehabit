#!/usr/bin/env python3
"""
Two-task automation:
Task 1: App Store Connect - create Daily Games + PlayToMaster apps
Task 2: api.bible - sign up and get API key + Bible IDs for NIV/ESV
"""

import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/appstore"

def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    path = f"{SCREENSHOT_DIR}/{name}.png"
    return path


async def task2_api_bible(browser):
    print("\n" + "="*60)
    print("TASK 2: api.bible - Get API Key")
    print("="*60)

    ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
    page = await ctx.new_page()

    # Go to sign-up page
    await page.goto("https://api.bible/sign-up", wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(2000)
    await page.screenshot(path=ss("t2_01_signup"))
    print(f"Sign-up URL: {page.url}")

    # Dump inputs
    inputs = await page.query_selector_all("input")
    print("Inputs found:")
    for inp in inputs:
        t = await inp.get_attribute("type")
        n = await inp.get_attribute("name")
        pid = await inp.get_attribute("id")
        ph = await inp.get_attribute("placeholder")
        print(f"  type={t} name={n} id={pid} placeholder={ph}")

    # Fill form - try common field selectors
    async def fill_if_exists(sel, val):
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.fill(val)
                print(f"  Filled [{sel}] = {val}")
                return True
        except Exception as e:
            pass
        return False

    # Email
    for sel in ['input[type="email"]', 'input[name="email"]', 'input[id="email"]', 'input[placeholder*="email" i]']:
        if await fill_if_exists(sel, "hello@biblehabit.co"):
            break

    # Password
    for sel in ['input[type="password"]', 'input[name="password"]']:
        if await fill_if_exists(sel, "BibleHabit2026!"):
            break

    # First name / full name
    for sel in ['input[name="firstName"]', 'input[name="first_name"]', 'input[name="name"]',
                'input[id="firstName"]', 'input[id="name"]', 'input[placeholder*="first" i]',
                'input[placeholder*="name" i]']:
        if await fill_if_exists(sel, "BibleHabit"):
            break

    # Last name
    for sel in ['input[name="lastName"]', 'input[name="last_name"]', 'input[id="lastName"]',
                'input[placeholder*="last" i]']:
        if await fill_if_exists(sel, "App"):
            break

    # Organization
    for sel in ['input[name="organization"]', 'input[name="org"]', 'input[id="organization"]',
                'input[placeholder*="org" i]', 'input[placeholder*="company" i]']:
        if await fill_if_exists(sel, "BibleHabit"):
            break

    await page.screenshot(path=ss("t2_02_form_filled"))

    # Submit
    submitted = False
    for sel in ['button[type="submit"]', 'input[type="submit"]',
                'button:has-text("Sign Up")', 'button:has-text("Create")',
                'button:has-text("Register")', 'button:has-text("Get Started")']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                print(f"Clicked submit: {sel}")
                submitted = True
                break
        except:
            pass

    await page.wait_for_timeout(5000)
    await page.screenshot(path=ss("t2_03_after_submit"))
    print(f"After submit URL: {page.url}")

    body_text = await page.inner_text("body")
    print("Page content after submit:\n" + body_text[:2000])

    # If we end up on the app creation page or dashboard, look for API key
    await page.wait_for_timeout(2000)

    # Check for API key on the page
    for sel in ['[class*="api-key"]', '[data-testid*="key"]', 'code', '.apiKey', '#apiKey']:
        try:
            el = await page.query_selector(sel)
            if el:
                text = await el.inner_text()
                if len(text) > 10:
                    print(f"Potential API key ({sel}): {text}")
        except:
            pass

    # Navigate to apps/applications page to see keys
    for url in ["https://api.bible/admin/applications", "https://scripture.api.bible/admin/applications"]:
        try:
            await page.goto(url, wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(2000)
            await page.screenshot(path=ss("t2_04_apps_page"))
            body_text = await page.inner_text("body")
            print(f"\nApps page ({url}):\n" + body_text[:2000])
            break
        except:
            pass

    # Try the public Bible list API to get IDs
    print("\n--- Fetching Bible list from api.bible ---")
    api_page = await ctx.new_page()
    # Use fetch in the browser context to call the API
    # First check if we can get a token from cookies
    cookies = await ctx.cookies()
    print("Cookies:", [c['name'] for c in cookies])

    await api_page.goto("https://api.bible/admin/applications", wait_until="networkidle", timeout=15000)
    await api_page.wait_for_timeout(2000)
    await api_page.screenshot(path=ss("t2_05_api_key_page"))
    body = await api_page.inner_text("body")
    print("API key page body:\n" + body[:3000])

    await ctx.close()


async def task1_appstore(browser):
    print("\n" + "="*60)
    print("TASK 1: App Store Connect - Create Apps")
    print("="*60)

    ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
    page = await ctx.new_page()

    await page.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss("t1_01_initial"))
    print(f"Initial URL: {page.url}")

    # Login flow
    if "appstoreconnect.apple.com/apps" not in page.url:
        print("Need to log in...")
        await page.screenshot(path=ss("t1_02_login"))

        # Fill Apple ID
        for sel in ['input[name="accountName"]', '#account_name_text_field', 'input[type="email"]',
                    'input[placeholder*="Email" i]', 'input[placeholder*="Apple ID" i]']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.fill("solomonweb26@gmail.com")
                    print(f"Filled Apple ID: {sel}")
                    break
            except:
                pass

        # Press Enter or click Continue
        for sel in ['button[type="submit"]', '#sign-in', '.submit-button', 'button:has-text("Continue")',
                    'button:has-text("Next")', '[data-signin-type="appleid-signin"]']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    print(f"Clicked: {sel}")
                    break
            except:
                pass

        # Also try pressing enter on the input
        try:
            inp = await page.query_selector('input[type="email"], input[name="accountName"]')
            if inp:
                await inp.press("Enter")
        except:
            pass

        await page.wait_for_timeout(4000)
        await page.screenshot(path=ss("t1_03_after_appleid"))
        print(f"After Apple ID: {page.url}")

        # Fill password
        for sel in ['input[type="password"]', '#password_text_field', 'input[name="password"]']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.fill("Hdsignals1987")
                    print(f"Filled password: {sel}")
                    break
            except:
                pass

        # Submit
        for sel in ['button[type="submit"]', '#sign-in', 'button:has-text("Sign In")',
                    'button:has-text("Continue")', '.submit-button']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    print(f"Clicked sign in: {sel}")
                    break
            except:
                pass

        # Also try enter
        try:
            inp = await page.query_selector('input[type="password"]')
            if inp:
                await inp.press("Enter")
        except:
            pass

        await page.wait_for_timeout(6000)
        await page.screenshot(path=ss("t1_04_after_password"))
        print(f"After password: {page.url}")

    # Check for 2FA
    body = await page.inner_text("body")
    url = page.url
    print(f"Current URL: {url}")
    print(f"Page body (500 chars): {body[:500]}")

    is_2fa = (
        "verify" in url.lower() or
        "2fa" in url.lower() or
        "two-factor" in url.lower() or
        "verification code" in body.lower() or
        "trusted device" in body.lower() or
        "enter the code" in body.lower() or
        "6-digit" in body.lower()
    )

    if is_2fa:
        print("\n*** 2FA REQUIRED ***")
        print("Check your trusted device for a 6-digit code")
        await page.screenshot(path=ss("t1_05_2fa_page"))

        # Check for SMS option
        sms_options = await page.query_selector_all('button, a, [role="button"]')
        print("Available buttons/links:")
        for opt in sms_options:
            text = (await opt.inner_text()).strip()
            if text:
                print(f"  [{text}]")

        print("\nWaiting up to 2 minutes for 2FA to complete...")
        print("Please enter the code on your trusted device / in the browser window...")

        # Keep taking screenshots while waiting
        for i in range(24):  # 24 * 5s = 120s
            await asyncio.sleep(5)
            current_url = page.url
            await page.screenshot(path=ss(f"t1_05_2fa_wait_{i:02d}"))
            if "appstoreconnect.apple.com/apps" in current_url:
                print(f"2FA completed! Now at: {current_url}")
                break
            body_check = await page.inner_text("body")
            if "my apps" in body_check.lower() or "app store connect" in body_check.lower() and "sign in" not in body_check.lower():
                print("Looks like we're logged in!")
                break
            if i % 6 == 0:
                print(f"Still waiting... ({i*5}s elapsed) URL: {current_url}")

    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss("t1_06_logged_in"))
    print(f"Post-2FA URL: {page.url}")

    # Navigate to apps
    if "appstoreconnect" in page.url:
        await page.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("t1_07_apps_page"))
        print(f"Apps page: {page.url}")
        body = await page.inner_text("body")
        print("Apps page body (first 1500 chars):\n" + body[:1500])

        # Create first app - Daily Games
        if "sign in" not in body.lower() and ("my apps" in body.lower() or "+" in body or "new app" in body.lower()):
            await create_app(page, {
                "name": "Daily Games",
                "bundle_id": "cc.dailygames.app",
                "sku": "dailygames001",
            })
            # Create second app - PlayToMaster
            await page.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)
            await create_app(page, {
                "name": "PlayToMaster",
                "bundle_id": "com.playtomaster.app",
                "sku": "playtomaster001",
            })

    await ctx.close()


async def create_app(page, app_info):
    """Create a new app in App Store Connect"""
    print(f"\n--- Creating app: {app_info['name']} ---")

    # Click the "+" or "New App" button
    for sel in ['button:has-text("New App")', 'a:has-text("New App")',
                '[aria-label="Add"]', 'button[aria-label="+"]',
                '.new-app-button', '#add-new-app']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                print(f"Clicked new app button: {sel}")
                break
        except:
            pass

    # Also try clicking the + button
    try:
        els = await page.query_selector_all('button')
        for el in els:
            text = (await el.inner_text()).strip()
            if text in ["+", "New App", "Add New App"]:
                await el.click()
                print(f"Clicked button: {text}")
                break
    except:
        pass

    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss(f"t1_create_{app_info['sku']}_01"))

    # Fill the "New App" form
    # Platform: iOS checkbox/radio
    for sel in ['input[value="ios"]', 'input[value="IOS"]', 'label:has-text("iOS") input',
                '#ios', '[name="platform"][value="ios"]']:
        try:
            el = await page.query_selector(sel)
            if el:
                await el.check()
                print("Checked iOS platform")
                break
        except:
            pass

    # App Name
    for sel in ['input[name="appName"]', 'input[id="app-name"]', 'input[placeholder*="name" i]',
                '#appName', 'input[name="name"]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.fill(app_info['name'])
                print(f"Filled app name: {app_info['name']}")
                break
        except:
            pass

    # Primary Language - select English (U.S.)
    for sel in ['select[name="primaryLocale"]', '#primaryLocale', 'select[id*="locale" i]',
                'select[id*="language" i]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.select_option(label="English (U.S.)")
                print("Selected English (U.S.)")
                break
        except:
            pass

    # Bundle ID - select from dropdown
    for sel in ['select[name="bundleId"]', '#bundleId', 'select[id*="bundle" i]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.select_option(value=app_info['bundle_id'])
                print(f"Selected bundle ID: {app_info['bundle_id']}")
                break
        except:
            pass

    # SKU
    for sel in ['input[name="sku"]', '#sku', 'input[id*="sku" i]']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.fill(app_info['sku'])
                print(f"Filled SKU: {app_info['sku']}")
                break
        except:
            pass

    # User Access - Full Access
    for sel in ['input[value="FULL_ACCESS"]', 'label:has-text("Full Access") input',
                'select[name="userAccess"]']:
        try:
            el = await page.query_selector(sel)
            if el:
                if await el.get_attribute("type") == "radio":
                    await el.check()
                else:
                    await el.select_option(value="FULL_ACCESS")
                print("Set Full Access")
                break
        except:
            pass

    await page.screenshot(path=ss(f"t1_create_{app_info['sku']}_02_filled"))

    # Submit / Create
    for sel in ['button:has-text("Create")', 'button[type="submit"]',
                'input[type="submit"]', '#create-button']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                print(f"Clicked create: {sel}")
                break
        except:
            pass

    await page.wait_for_timeout(5000)
    await page.screenshot(path=ss(f"t1_create_{app_info['sku']}_03_result"))
    print(f"After create URL: {page.url}")
    body = await page.inner_text("body")
    print(f"Result body (500 chars): {body[:500]}")


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    print(f"Screenshots: {SCREENSHOT_DIR}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--no-sandbox"],
            slow_mo=50
        )

        # Run Task 2 first (no 2FA needed)
        await task2_api_bible(browser)

        # Run Task 1 (requires 2FA interaction)
        await task1_appstore(browser)

        print("\n=== DONE ===")
        await browser.close()

asyncio.run(main())
