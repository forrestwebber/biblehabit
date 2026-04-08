#!/usr/bin/env python3
"""
Task 2: Get api.bible API key and Bible IDs for NIV and ESV
"""

import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/appstore"

async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--no-sandbox"]
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()

        print("=== TASK 2: api.bible signup ===")

        # Navigate to api.bible
        await page.goto("https://scripture.api.bible/", wait_until="networkidle")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/task2_01_homepage.png")
        print("Loaded api.bible homepage")

        # Look for sign up / get started button
        await page.wait_for_timeout(2000)

        # Try to find signup link
        signup_selectors = [
            'a:has-text("Get a Free API Key")',
            'a:has-text("Sign Up")',
            'a:has-text("Get Started")',
            'button:has-text("Sign Up")',
            'a[href*="signup"]',
            'a[href*="register"]',
        ]

        clicked = False
        for sel in signup_selectors:
            try:
                el = await page.query_selector(sel)
                if el:
                    await el.click()
                    clicked = True
                    print(f"Clicked: {sel}")
                    break
            except:
                pass

        if not clicked:
            # Try navigating directly
            await page.goto("https://scripture.api.bible/register", wait_until="networkidle")

        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/task2_02_signup_page.png")
        print(f"Current URL: {page.url}")

        # Fill signup form
        # Look for email field
        email_selectors = ['input[type="email"]', 'input[name="email"]', '#email']
        for sel in email_selectors:
            try:
                el = await page.query_selector(sel)
                if el:
                    await el.fill("hello@biblehabit.co")
                    print(f"Filled email using: {sel}")
                    break
            except:
                pass

        # Look for password field
        pass_selectors = ['input[type="password"]', 'input[name="password"]', '#password']
        for sel in pass_selectors:
            try:
                el = await page.query_selector(sel)
                if el:
                    await el.fill("BibleHabit2026!")
                    print(f"Filled password using: {sel}")
                    break
            except:
                pass

        # Look for name/org fields
        name_selectors = [
            'input[name="name"]', 'input[name="firstName"]',
            'input[placeholder*="name" i]', 'input[id*="name" i]'
        ]
        for sel in name_selectors:
            try:
                el = await page.query_selector(sel)
                if el:
                    await el.fill("BibleHabit")
                    print(f"Filled name using: {sel}")
                    break
            except:
                pass

        await page.screenshot(path=f"{SCREENSHOT_DIR}/task2_03_form_filled.png")

        # Submit the form
        submit_selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Sign Up")',
            'button:has-text("Register")',
            'button:has-text("Create")',
        ]

        for sel in submit_selectors:
            try:
                el = await page.query_selector(sel)
                if el:
                    await el.click()
                    print(f"Clicked submit: {sel}")
                    break
            except:
                pass

        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/task2_04_after_submit.png")
        print(f"After submit URL: {page.url}")

        # Wait for redirect or dashboard
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/task2_05_dashboard.png")

        # Look for API key on the page
        page_content = await page.content()
        print(f"Page title: {await page.title()}")

        # Try to find API key section
        api_key_selectors = [
            '[class*="api-key"]', '[id*="api-key"]',
            '[class*="apikey"]', 'code', 'pre',
            '.token', '#token'
        ]

        for sel in api_key_selectors:
            try:
                els = await page.query_selector_all(sel)
                for el in els:
                    text = await el.inner_text()
                    if len(text) > 20:  # API keys are long
                        print(f"Potential API key found ({sel}): {text[:50]}...")
            except:
                pass

        # Now look up Bible IDs for NIV and ESV via the API
        print("\n=== Looking up Bible IDs ===")

        # First check if we can access the API directly
        api_page = await context.new_page()
        await api_page.goto("https://api.scripture.api.bible/v1/bibles", wait_until="networkidle")
        await api_page.screenshot(path=f"{SCREENSHOT_DIR}/task2_06_api_bibles.png")

        await browser.close()

asyncio.run(main())
