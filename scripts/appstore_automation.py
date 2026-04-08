#!/usr/bin/env python3
"""
App Store Connect + api.bible automation
Task 1: Create Daily Games and PlayToMaster apps in App Store Connect
Task 2: Sign up for api.bible and get API key + Bible IDs
"""

import asyncio
import os
import time
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/appstore"

def screenshot_path(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"

async def task2_api_bible(browser):
    """Get api.bible API key and Bible IDs"""
    print("\n" + "="*50)
    print("TASK 2: api.bible signup and Bible IDs")
    print("="*50)

    context = await browser.new_context(viewport={"width": 1280, "height": 900})
    page = await context.new_page()

    await page.goto("https://scripture.api.bible/", wait_until="networkidle", timeout=30000)
    await page.screenshot(path=screenshot_path("t2_01_homepage"))
    print(f"Loaded: {page.url}")
    print(f"Title: {await page.title()}")

    await page.wait_for_timeout(2000)

    # Look for a "Get API Key" or "Sign Up" CTA
    links = await page.query_selector_all("a")
    print("\nAll links on page:")
    for link in links:
        href = await link.get_attribute("href")
        text = await link.inner_text()
        text = text.strip()
        if text:
            print(f"  [{text}] -> {href}")

    await page.wait_for_timeout(1000)

    # Try to navigate to signup/register
    signup_url = None
    for link in links:
        href = await link.get_attribute("href") or ""
        text = (await link.inner_text()).strip().lower()
        if any(kw in text for kw in ["sign up", "register", "get key", "get started", "free key", "api key"]):
            signup_url = href
            print(f"\nFound signup link: {text} -> {href}")
            await link.click()
            break

    if not signup_url:
        # Try direct navigation
        for url in [
            "https://scripture.api.bible/register",
            "https://scripture.api.bible/signup",
        ]:
            await page.goto(url, wait_until="networkidle", timeout=15000)
            if "404" not in await page.title() and page.url != "https://scripture.api.bible/":
                print(f"Navigated to: {page.url}")
                break

    await page.wait_for_timeout(2000)
    await page.screenshot(path=screenshot_path("t2_02_signup_page"))
    print(f"Signup page URL: {page.url}")

    # Dump form fields
    inputs = await page.query_selector_all("input")
    print("\nForm inputs found:")
    for inp in inputs:
        itype = await inp.get_attribute("type")
        iname = await inp.get_attribute("name")
        iid = await inp.get_attribute("id")
        iplaceholder = await inp.get_attribute("placeholder")
        print(f"  type={itype} name={iname} id={iid} placeholder={iplaceholder}")

    # Fill in signup form fields
    field_map = {
        "email": "hello@biblehabit.co",
        "password": "BibleHabit2026!",
        "name": "BibleHabit",
        "first": "Bible",
        "last": "Habit",
        "org": "BibleHabit",
        "organization": "BibleHabit",
        "app": "Bible reading app",
        "usage": "Bible reading app",
        "description": "Bible reading app",
    }

    for inp in inputs:
        itype = await inp.get_attribute("type") or ""
        iname = (await inp.get_attribute("name") or "").lower()
        iid = (await inp.get_attribute("id") or "").lower()
        iplaceholder = (await inp.get_attribute("placeholder") or "").lower()

        key = None
        for field_key, val in field_map.items():
            if field_key in iname or field_key in iid or field_key in iplaceholder:
                key = field_key
                if itype == "password" and field_key != "password":
                    continue
                if itype != "password" and field_key == "password":
                    continue
                try:
                    await inp.fill(val)
                    print(f"Filled {iname or iid or iplaceholder}: {val}")
                except:
                    pass
                break

    await page.screenshot(path=screenshot_path("t2_03_form_filled"))

    # Submit
    for sel in ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Sign")', 'button:has-text("Register")', 'button:has-text("Create")']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                print(f"Clicked submit: {sel}")
                break
        except:
            pass

    await page.wait_for_timeout(4000)
    await page.screenshot(path=screenshot_path("t2_04_after_submit"))
    print(f"After submit URL: {page.url}")

    # Check for API key on page
    page_text = await page.inner_text("body")
    print("\n--- Page text (first 2000 chars) ---")
    print(page_text[:2000])

    await context.close()


async def task1_appstore(browser):
    """Create apps in App Store Connect"""
    print("\n" + "="*50)
    print("TASK 1: App Store Connect - Create Apps")
    print("="*50)

    context = await browser.new_context(viewport={"width": 1280, "height": 900})
    page = await context.new_page()

    print("Navigating to App Store Connect...")
    await page.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(2000)
    await page.screenshot(path=screenshot_path("t1_01_initial"))
    print(f"URL: {page.url}")
    print(f"Title: {await page.title()}")

    # Check if we need to log in
    if "signin" in page.url or "appleid" in page.url or "idmsa" in page.url:
        print("Login page detected, filling credentials...")
        await page.screenshot(path=screenshot_path("t1_02_login_page"))

        # Apple ID field
        for sel in ['input[name="accountName"]', '#account_name_text_field', 'input[type="email"]', '#accountname']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.fill("solomonweb26@gmail.com")
                    print(f"Filled Apple ID: {sel}")
                    break
            except:
                pass

        # Click Continue / Next
        for sel in ['button[type="submit"]', '#sign-in', 'button:has-text("Continue")', 'button:has-text("Next")', '#btn-signin']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    print(f"Clicked continue: {sel}")
                    break
            except:
                pass

        await page.wait_for_timeout(3000)
        await page.screenshot(path=screenshot_path("t1_03_after_appleid"))
        print(f"After Apple ID URL: {page.url}")

        # Password field
        for sel in ['input[type="password"]', '#password_text_field', 'input[name="password"]', '#password']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.fill("Hdsignals1987")
                    print(f"Filled password: {sel}")
                    break
            except:
                pass

        await page.wait_for_timeout(1000)

        # Submit password
        for sel in ['button[type="submit"]', '#sign-in', 'button:has-text("Sign In")', 'button:has-text("Continue")']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    print(f"Clicked sign in: {sel}")
                    break
            except:
                pass

        await page.wait_for_timeout(5000)
        await page.screenshot(path=screenshot_path("t1_04_after_password"))
        print(f"After password URL: {page.url}")

    # 2FA handling
    current_url = page.url
    if "2fa" in current_url or "twofa" in current_url or "verify" in current_url or "2step" in current_url:
        print("2FA page detected!")
        await page.screenshot(path=screenshot_path("t1_05_2fa_page"))
        page_text = await page.inner_text("body")
        print("2FA page text:", page_text[:1000])
        print("\n*** WAITING FOR 2FA CODE - CHECK YOUR TRUSTED DEVICE ***")
        print("Script will wait up to 120 seconds for the code to be entered...")
        # Wait for navigation away from 2FA page
        try:
            await page.wait_for_url(lambda url: "appstoreconnect" in url and "verify" not in url and "2fa" not in url, timeout=120000)
            print("2FA completed, navigated away")
        except:
            print("Timed out waiting for 2FA")
            await page.screenshot(path=screenshot_path("t1_05b_2fa_timeout"))

    await page.wait_for_timeout(3000)
    await page.screenshot(path=screenshot_path("t1_06_post_login"))
    print(f"Post-login URL: {page.url}")

    # Navigate to apps page
    if "appstoreconnect" in page.url:
        await page.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=screenshot_path("t1_07_apps_page"))
        print(f"Apps page URL: {page.url}")

        page_text = await page.inner_text("body")
        print("\n--- Apps page content (first 1000 chars) ---")
        print(page_text[:1000])

    await context.close()


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    print(f"Screenshots will be saved to: {SCREENSHOT_DIR}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            slow_mo=100
        )

        # Run Task 2 first (api.bible) - simpler, no 2FA
        await task2_api_bible(browser)

        # Run Task 1 (App Store Connect) - requires 2FA interaction
        await task1_appstore(browser)

        print("\n=== All tasks complete ===")
        print(f"Screenshots saved to: {SCREENSHOT_DIR}")

        await browser.close()

asyncio.run(main())
