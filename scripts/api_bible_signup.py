#!/usr/bin/env python3
"""
api.bible signup - with proper select handling and manual captcha + Apple 2FA
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
    print(f"Screenshots: {SCREENSHOT_DIR}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=150,
            args=["--no-sandbox"]
        )
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()

        # ==============================
        # TASK 2: api.bible signup
        # ==============================
        print("\n=== TASK 2: api.bible signup ===")

        await page.goto("https://api.bible/sign-up/starter", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        # Step 1: App info
        print("Step 1: Filling app info...")
        app_name = await page.query_selector("#appName")
        if app_name:
            await app_name.fill("BibleHabit")
            print("  App name: BibleHabit")

        # Click "No" for revenue
        labels = await page.query_selector_all("label")
        for label in labels:
            text = (await label.inner_text()).strip().lower()
            if "no, there will be no" in text:
                await label.click()
                print("  No revenue selected")
                break

        # Click 0-1K
        for label in labels:
            if (await label.inner_text()).strip() == "0-1K":
                await label.click()
                print("  0-1K users selected")
                break

        await page.wait_for_timeout(1000)
        await page.screenshot(path=ss("api_01_step1_filled"))

        # Click Continue
        btn = await page.query_selector('button:has-text("Continue")')
        if btn:
            await btn.click(force=True)
            await page.wait_for_timeout(2000)

        # Handle "Are you sure?" dialog
        for sel in ['button:has-text("Yes, continue")', 'button:has-text("Yes")']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    print("  Dismissed 'Are you sure?' dialog")
                    break
            except:
                pass

        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("api_02_step2"))
        print(f"Step 2 URL: {page.url}")

        # Step 2: Account creation
        print("Step 2: Filling account info...")

        # First Name
        for sel in ['#firstName', 'input[name="firstName"]', 'input[placeholder*="First" i]']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.fill("BibleHabit")
                    print("  First name: BibleHabit")
                    break
            except:
                pass

        # Last Name
        for sel in ['#lastName', 'input[name="lastName"]', 'input[placeholder*="Last" i]']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.fill("App")
                    print("  Last name: App")
                    break
            except:
                pass

        # Organization Type - select dropdown
        # It uses a custom select component, let's try different approaches
        org_type_sel = await page.query_selector('select[name*="org" i], select[id*="org" i], select[id*="type" i]')
        if org_type_sel:
            await org_type_sel.select_option(label="Individual")
            print("  Org type: Individual (native select)")
        else:
            # It might be a custom dropdown - click and select
            # Find the "Select your organization type" element
            org_type_div = await page.query_selector('[class*="select"]:has-text("Select your organization type")')
            if org_type_div:
                await org_type_div.click()
                await page.wait_for_timeout(1000)
                # Look for Individual option
                individual_opt = await page.query_selector('li:has-text("Individual"), [role="option"]:has-text("Individual")')
                if individual_opt:
                    await individual_opt.click()
                    print("  Org type: Individual (custom dropdown)")

        await page.wait_for_timeout(500)

        # Organization Name
        for sel in ['#orgName', 'input[name="orgName"]', 'input[name*="org" i]',
                    'input[placeholder*="org" i]']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.fill("BibleHabit")
                    print("  Org name: BibleHabit")
                    break
            except:
                pass

        # Organization Location - select USA
        org_loc_sel = await page.query_selector('select[name*="location" i], select[id*="location" i], select[name*="country" i]')
        if org_loc_sel:
            try:
                await org_loc_sel.select_option(label="United States")
                print("  Location: United States (native select)")
            except:
                await org_loc_sel.select_option(value="US")
                print("  Location: US (value)")
        else:
            # Custom dropdown
            loc_div = await page.query_selector('[class*="select"]:has-text("Select your organization location")')
            if loc_div:
                await loc_div.click()
                await page.wait_for_timeout(1000)
                # Type to search
                await page.keyboard.type("United States")
                await page.wait_for_timeout(500)
                us_opt = await page.query_selector('li:has-text("United States"), [role="option"]:has-text("United States")')
                if us_opt:
                    await us_opt.click()
                    print("  Location: United States (custom dropdown)")

        # Email
        for sel in ['#email', 'input[type="email"]', 'input[name="email"]']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    val = await el.input_value()
                    if not val:
                        await el.fill("hello@biblehabit.co")
                        print("  Email: hello@biblehabit.co")
                    break
            except:
                pass

        # Password (there may be two password fields - password + confirm)
        pass_fields = await page.query_selector_all('input[type="password"]')
        for pf in pass_fields:
            if await pf.is_visible():
                val = await pf.input_value()
                if not val:
                    await pf.fill("BibleHabit2026!")
                    print("  Password filled")

        await page.wait_for_timeout(1000)
        await page.screenshot(path=ss("api_03_step2_filled"))
        print("Step 2 form filled. Checking for reCAPTCHA...")

        # Check for reCAPTCHA
        recaptcha = await page.query_selector('.g-recaptcha, iframe[src*="recaptcha"]')
        if recaptcha:
            print("\n*** reCAPTCHA DETECTED ***")
            print("Please solve the reCAPTCHA in the browser window")
            print("Waiting 60 seconds for manual solve...")

            for i in range(12):
                await asyncio.sleep(5)
                # Check if recaptcha is solved (checkbox checked)
                recaptcha_response = await page.query_selector('#g-recaptcha-response')
                if recaptcha_response:
                    val = await recaptcha_response.input_value()
                    if val:
                        print("reCAPTCHA solved!")
                        break
                print(f"  Waiting for reCAPTCHA... {(i+1)*5}s")
        else:
            print("No reCAPTCHA found or already solved")

        # Click Create Account
        for sel in ['button:has-text("Create Account")', 'button[type="submit"]']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click(force=True)
                    print("Clicked Create Account")
                    break
            except:
                pass

        await page.wait_for_timeout(5000)
        await page.screenshot(path=ss("api_04_after_create"))
        print(f"After create: {page.url}")
        body = await page.inner_text("body")
        print(f"Content:\n{body[:1000]}")

        # Continue through remaining steps
        for step in range(3, 6):
            await page.wait_for_timeout(2000)
            body = await page.inner_text("body")
            url = page.url
            print(f"\nStep {step}: URL={url}")

            if any(kw in url for kw in ["dashboard", "applications", "success"]):
                print("Reached success!")
                break
            if any(kw in body.lower() for kw in ["your api key", "api key:"]):
                print("Found API key!")
                break

            # Try clicking continue
            for sel in ['button:has-text("Continue")', 'button:has-text("Next")',
                        'button:has-text("Finish")', 'button[type="submit"]']:
                try:
                    el = await page.query_selector(sel)
                    if el and await el.is_visible():
                        await el.click(force=True)
                        print(f"  Clicked: {sel}")
                        break
                except:
                    pass

            await page.wait_for_timeout(3000)
            await page.screenshot(path=ss(f"api_step{step}"))

        # Final state
        await page.screenshot(path=ss("api_final"))
        body = await page.inner_text("body")
        url = page.url
        print(f"\n=== FINAL STATE ===")
        print(f"URL: {url}")
        print(f"Content:\n{body[:3000]}")

        # Extract API key
        keys = re.findall(r'[a-f0-9-]{32,}', body)
        if keys:
            print(f"\nPotential API keys: {keys}")

        # ==============================
        # TASK 1: App Store Connect
        # ==============================
        print("\n=== TASK 1: App Store Connect ===")

        page2 = await ctx.new_page()
        await page2.goto("https://appstoreconnect.apple.com", wait_until="networkidle", timeout=30000)
        await page2.wait_for_timeout(4000)
        await page2.screenshot(path=ss("asc_01_initial"))

        # Get auth iframe
        auth_frame = None
        for frame in page2.frames:
            if "idmsa.apple.com" in frame.url:
                auth_frame = frame
                print(f"Auth frame found")
                break

        if not auth_frame:
            print("Auth iframe not found!")
        else:
            # Fill email
            email_input = await auth_frame.wait_for_selector("#account_name_text_field", timeout=10000)
            if email_input:
                await email_input.click()
                await email_input.fill("")
                await email_input.type("solomonweb26@gmail.com", delay=50)
                print("Apple ID typed")
                await email_input.press("Enter")
                await page2.wait_for_timeout(4000)
                await page2.screenshot(path=ss("asc_02_after_email"))

            # Refresh frame
            auth_frame = None
            for frame in page2.frames:
                if "idmsa.apple.com" in frame.url:
                    auth_frame = frame
                    break

            if auth_frame:
                try:
                    pass_input = await auth_frame.wait_for_selector("#password_text_field", timeout=8000)
                    if pass_input and await pass_input.is_visible():
                        await pass_input.click()
                        await pass_input.type("Hdsignals1987", delay=50)
                        print("Password typed")
                        sign_in = await auth_frame.query_selector("#sign-in")
                        if sign_in:
                            await sign_in.click()
                        else:
                            await pass_input.press("Enter")
                        print("Signed in")
                except Exception as e:
                    print(f"Password error: {e}")

        await page2.wait_for_timeout(5000)
        await page2.screenshot(path=ss("asc_03_after_signin"))
        print(f"After sign in: {page2.url}")

        # 2FA
        all_text = ""
        for frame in page2.frames:
            try:
                all_text += await frame.inner_text("body") + " "
            except:
                pass

        is_2fa = any(kw in all_text.lower() for kw in [
            "verification code", "two-factor", "6-digit", "sent to your mac",
            "sent to your iphone", "trusted device"
        ])

        if is_2fa:
            print("\n*** 2FA CODE REQUIRED ***")
            print("A 6-digit code was sent to your Mac/iPhone")
            print("CHECK YOUR MAC - there should be a notification with a 6-digit code")
            print("ALSO CHECK: System Settings > Apple ID notifications")
            print("\nThe code boxes are in the browser window")
            print("You need to enter the code in the 6 boxes shown in the Chromium window")
            print("\nWaiting up to 5 minutes for code entry...")

            for i in range(60):  # 60 * 5s = 5 minutes
                await asyncio.sleep(5)
                cur_url = page2.url
                await page2.screenshot(path=ss(f"asc_2fa_{i:02d}"))

                if "appstoreconnect.apple.com" in cur_url and "login" not in cur_url:
                    print(f"2FA complete! URL: {cur_url}")
                    break

                if i % 12 == 0 and i > 0:
                    print(f"Still waiting... {i*5}s")
                    # Try clicking "Resend code" to get a fresh code
                    if i == 12:
                        try:
                            resend = await page2.query_selector('a:has-text("Resend"), button:has-text("Resend")')
                            if resend:
                                await resend.click()
                                print("Clicked resend code")
                        except:
                            pass
        else:
            print("No 2FA detected")

        # Check if we're in
        final_url = page2.url
        print(f"\nFinal URL: {final_url}")

        if "appstoreconnect.apple.com" in final_url and "login" not in final_url:
            print("Logged in! Proceeding to create apps...")
            await page2.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
            await page2.wait_for_timeout(3000)
            await page2.screenshot(path=ss("asc_04_apps"))
            body = await page2.inner_text("body")
            print(f"Apps page:\n{body[:2000]}")
        else:
            print("Auth failed - could not complete 2FA in time")

        await browser.close()
        print("\n=== DONE ===")

asyncio.run(main())
