#!/usr/bin/env python3
"""
Fix api.bible custom dropdowns + handle reCAPTCHA + Apple 2FA with user input
"""

import asyncio
import os
import re
import sys
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/appstore"

def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"


async def fill_custom_select(page, placeholder_text, option_text):
    """Handle a custom select/combobox dropdown"""
    # Try to find the trigger element
    selectors_to_try = [
        f'button:has-text("{placeholder_text}")',
        f'[role="combobox"]:has-text("{placeholder_text}")',
        f'div:has-text("{placeholder_text}"):not(:has(*))',  # leaf div
    ]

    clicked = False
    for sel in selectors_to_try:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                await page.wait_for_timeout(800)
                clicked = True
                print(f"  Opened dropdown: {placeholder_text}")
                break
        except:
            pass

    if not clicked:
        # Try finding by the placeholder text in any clickable element
        all_elements = await page.query_selector_all('button, [role="combobox"], [role="listbox"] button')
        for el in all_elements:
            try:
                text = (await el.inner_text()).strip()
                if placeholder_text.lower() in text.lower():
                    await el.click()
                    await page.wait_for_timeout(800)
                    clicked = True
                    print(f"  Opened dropdown via text match: {text[:40]}")
                    break
            except:
                pass

    if not clicked:
        print(f"  Could not open dropdown for: {placeholder_text}")
        return False

    # Now look for the option
    for sel in [
        f'[role="option"]:has-text("{option_text}")',
        f'li:has-text("{option_text}")',
        f'[role="menuitem"]:has-text("{option_text}")',
        f'div[data-value]:has-text("{option_text}")',
        f'[class*="option"]:has-text("{option_text}")',
    ]:
        try:
            opt = await page.query_selector(sel)
            if opt and await opt.is_visible():
                await opt.click()
                print(f"  Selected: {option_text}")
                await page.wait_for_timeout(500)
                return True
        except:
            pass

    # If not found, try typing to search
    await page.keyboard.type(option_text[:5])
    await page.wait_for_timeout(500)

    for sel in [
        f'[role="option"]:has-text("{option_text}")',
        f'li:has-text("{option_text}")',
    ]:
        try:
            opt = await page.query_selector(sel)
            if opt and await opt.is_visible():
                await opt.click()
                print(f"  Selected after typing: {option_text}")
                return True
        except:
            pass

    print(f"  Could not select option: {option_text}")
    return False


async def debug_dropdown_dom(page):
    """Debug what the dropdown DOM looks like"""
    # Dump the full DOM around select-like elements
    dom_info = await page.evaluate("""() => {
        const els = document.querySelectorAll('[role="combobox"], [role="listbox"], select, [data-radix-select], [class*="select"]');
        return Array.from(els).slice(0, 20).map(el => ({
            tag: el.tagName,
            role: el.getAttribute('role'),
            class: el.className,
            text: el.textContent.trim().slice(0, 100),
            id: el.id,
            name: el.getAttribute('name'),
        }));
    }""")
    print("Dropdown-like elements:")
    for d in dom_info:
        print(f"  {d}")


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

        # Step 1
        await page.goto("https://api.bible/sign-up/starter", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        app_name = await page.query_selector("#appName")
        if app_name:
            await app_name.fill("BibleHabit")

        labels = await page.query_selector_all("label")
        for label in labels:
            text = (await label.inner_text()).strip().lower()
            if "no, there will be no" in text:
                await label.click()
                break

        for label in labels:
            if (await label.inner_text()).strip() == "0-1K":
                await label.click()
                break

        await page.wait_for_timeout(500)

        btn = await page.query_selector('button:has-text("Continue")')
        if btn:
            await btn.click(force=True)
        await page.wait_for_timeout(2000)

        for sel in ['button:has-text("Yes, continue")', 'button:has-text("Yes")']:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                break

        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("fix_01_step2"))
        print(f"Step 2 URL: {page.url}")

        # Debug dropdown DOM
        await debug_dropdown_dom(page)

        # Fill text fields
        for field_id, value in [("firstName", "BibleHabit"), ("lastName", "App"),
                                  ("orgName", "BibleHabit"), ("email", "hello@biblehabit.co")]:
            el = await page.query_selector(f"#{field_id}, input[name='{field_id}']")
            if el and await el.is_visible():
                await el.fill(value)
                print(f"Filled {field_id}: {value}")

        # Handle Organization Type custom dropdown
        # First, inspect what's there
        print("\n--- Inspecting org type dropdown ---")

        # The page uses Radix UI or similar - let's look for buttons
        all_btns = await page.query_selector_all("button")
        print("All buttons:")
        for btn in all_btns:
            try:
                text = (await btn.inner_text()).strip()
                aria = await btn.get_attribute("aria-label")
                role = await btn.get_attribute("role")
                print(f"  [{text[:50]}] aria={aria} role={role}")
            except:
                pass

        # Try clicking the org type button
        org_type_btn = None
        for btn in all_btns:
            try:
                text = (await btn.inner_text()).strip()
                if "organization type" in text.lower() or "select your org" in text.lower():
                    org_type_btn = btn
                    break
            except:
                pass

        if org_type_btn:
            await org_type_btn.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path=ss("fix_02_org_type_open"))

            # Look for Individual option
            for sel in ['[role="option"]', 'li', '[data-value]']:
                opts = await page.query_selector_all(sel)
                for opt in opts:
                    text = (await opt.inner_text()).strip()
                    if text == "Individual":
                        await opt.click()
                        print("Selected Individual")
                        break
        else:
            print("Could not find org type button")
            # Try finding it by aria
            for sel in ['[role="combobox"]', '[aria-haspopup="listbox"]', '[aria-haspopup="menu"]']:
                els = await page.query_selector_all(sel)
                for el in els:
                    if await el.is_visible():
                        text = (await el.inner_text()).strip()
                        print(f"Found combobox: {text[:50]}")
                        await el.click()
                        await page.wait_for_timeout(1000)
                        await page.screenshot(path=ss("fix_03_combobox_open"))
                        # Select first visible option
                        opts = await page.query_selector_all('[role="option"], li[data-value]')
                        if opts:
                            for opt in opts:
                                text = (await opt.inner_text()).strip()
                                if text == "Individual":
                                    await opt.click()
                                    print(f"Selected: {text}")
                                    break
                        break

        await page.wait_for_timeout(1000)

        # Organization Location - select United States
        print("\n--- Selecting org location ---")
        all_btns = await page.query_selector_all("button")
        for btn in all_btns:
            try:
                text = (await btn.inner_text()).strip()
                if "organization location" in text.lower() or "select your org" in text.lower():
                    await btn.click()
                    await page.wait_for_timeout(1000)
                    await page.screenshot(path=ss("fix_04_location_open"))

                    # Look for United States
                    for sel in ['[role="option"]', 'li']:
                        opts = await page.query_selector_all(sel)
                        for opt in opts:
                            opt_text = (await opt.inner_text()).strip()
                            if "United States" in opt_text:
                                await opt.click()
                                print("Selected United States")
                                break
                    break
            except:
                pass

        # Password fields
        pass_fields = await page.query_selector_all('input[type="password"]')
        for pf in pass_fields:
            if await pf.is_visible():
                val = await pf.input_value()
                if not val:
                    await pf.fill("BibleHabit2026!")
                    print("Password filled")

        await page.wait_for_timeout(1000)
        await page.screenshot(path=ss("fix_05_fully_filled"))

        # Check for reCAPTCHA
        recaptcha = await page.query_selector('iframe[src*="recaptcha"], .g-recaptcha')
        if recaptcha:
            print("\n*** reCAPTCHA PRESENT ***")
            print("Please solve the reCAPTCHA in the browser window now!")
            print("Waiting up to 2 minutes...")

            for i in range(24):
                await asyncio.sleep(5)
                # Check if solved via response token
                token_el = await page.query_selector('#g-recaptcha-response, textarea[name="g-recaptcha-response"]')
                if token_el:
                    val = await token_el.input_value()
                    if val and len(val) > 100:
                        print("reCAPTCHA solved!")
                        break
                print(f"  Waiting... {(i+1)*5}s")

        # Submit
        for sel in ['button:has-text("Create Account")', 'button[type="submit"]']:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    print("Clicked Create Account")
                    break
            except:
                pass

        await page.wait_for_timeout(5000)
        await page.screenshot(path=ss("fix_06_after_create"))
        body = await page.inner_text("body")
        print(f"After create URL: {page.url}")
        print(f"Content:\n{body[:1000]}")

        # Continue steps 3 and 4
        for step in range(3, 6):
            url = page.url
            body = await page.inner_text("body")
            if "sign-up/starter" not in url:
                print(f"Step {step}: Left signup flow! URL: {url}")
                break

            # Fill email verification if needed
            if "verify" in body.lower() or "email" in body.lower():
                print(f"Step {step}: Email verification page")
                print("Please check hello@biblehabit.co email and click verification link")
                await page.wait_for_timeout(30000)

            for sel in ['button:has-text("Continue")', 'button:has-text("Next")',
                        'button:has-text("Finish")', 'button[type="submit"]']:
                try:
                    el = await page.query_selector(sel)
                    if el and await el.is_visible():
                        await el.click()
                        print(f"Step {step}: clicked continue")
                        break
                except:
                    pass

            await page.wait_for_timeout(3000)
            await page.screenshot(path=ss(f"fix_step{step}"))
            new_url = page.url
            body = await page.inner_text("body")
            print(f"Step {step}: {new_url}")

            if any(kw in new_url for kw in ["dashboard", "admin", "success"]):
                break

        # Final
        await page.screenshot(path=ss("fix_final"))
        body = await page.inner_text("body")
        print(f"\nFINAL: {page.url}")
        print(f"Content:\n{body[:3000]}")

        # ==============================
        # TASK 1: App Store Connect
        # ==============================
        print("\n=== TASK 1: App Store Connect ===")
        print("Navigating to App Store Connect...")
        page2 = await ctx.new_page()
        await page2.goto("https://appstoreconnect.apple.com", wait_until="networkidle", timeout=30000)
        await page2.wait_for_timeout(4000)
        await page2.screenshot(path=ss("asc_01"))

        # Get auth iframe
        auth_frame = None
        for frame in page2.frames:
            if "idmsa.apple.com" in frame.url:
                auth_frame = frame
                break

        if auth_frame:
            email_input = await auth_frame.wait_for_selector("#account_name_text_field", timeout=10000)
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
                except Exception as e:
                    print(f"Password: {e}")

            await page2.wait_for_timeout(5000)
            await page2.screenshot(path=ss("asc_03"))
            print(f"After sign in: {page2.url}")

            # 2FA - wait for code entry
            all_text = ""
            for frame in page2.frames:
                try:
                    all_text += await frame.inner_text("body")
                except:
                    pass

            if any(kw in all_text.lower() for kw in ["verification code", "two-factor", "sent to your"]):
                print("\n*** 2FA CODE NEEDED ***")
                print("Check your Mac or iPhone for a 6-digit code from Apple")
                print("Enter it in the browser Chromium window that opened")
                print("Waiting 5 minutes...")

                for i in range(60):
                    await asyncio.sleep(5)
                    cur = page2.url
                    await page2.screenshot(path=ss(f"asc_2fa_{i:02d}"))
                    if "appstoreconnect.apple.com" in cur and "login" not in cur:
                        print(f"2FA done! {cur}")
                        break
                    if i % 12 == 0 and i > 0:
                        print(f"  {i*5}s - still waiting for 2FA code...")

        # Check if logged in
        final_url = page2.url
        if "appstoreconnect.apple.com" in final_url and "login" not in final_url:
            print("Logged in!")
            await page2.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
            await page2.wait_for_timeout(3000)
            await page2.screenshot(path=ss("asc_04_apps"))
            body = await page2.inner_text("body")
            print(f"Apps page:\n{body[:2000]}")

            if "sign in" not in body.lower():
                # Create Daily Games
                await create_app_v3(page2, "Daily Games", "cc.dailygames.app", "dailygames001", "dailygames")
                await page2.goto("https://appstoreconnect.apple.com/apps", wait_until="networkidle", timeout=30000)
                await page2.wait_for_timeout(2000)
                # Create PlayToMaster
                await create_app_v3(page2, "PlayToMaster", "com.playtomaster.app", "playtomaster001", "playtomaster")
        else:
            print(f"Not logged in. URL: {final_url}")

        await browser.close()
        print("\n=== COMPLETE ===")


async def create_app_v3(page, name, bundle_id, sku, tag):
    print(f"\n--- Creating: {name} ---")

    # Find and click New App button
    clicked = False
    all_els = await page.query_selector_all("button, [role='button'], a")
    for el in all_els:
        try:
            text = (await el.inner_text()).strip()
            aria = await el.get_attribute("aria-label") or ""
            if text == "+" or "new app" in text.lower() or "new app" in aria.lower():
                await el.click()
                clicked = True
                print(f"Clicked New App: '{text or aria}'")
                break
        except:
            pass

    if not clicked:
        print("New App button not found:")
        for el in all_els[:20]:
            try:
                text = (await el.inner_text()).strip()
                print(f"  [{text[:30]}]")
            except:
                pass
        return

    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss(f"asc_{tag}_01"))

    body = await page.inner_text("body")
    print(f"Modal:\n{body[:300]}")

    # iOS platform
    for sel in ['input[value="IOS"]', 'input[value="iOS"]', 'label:has-text("iOS") input']:
        try:
            el = await page.query_selector(sel)
            if el:
                await el.check()
                print("iOS checked")
                break
        except:
            pass

    # App Name
    for sel in ['input[name="appName"]', '#appName']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.fill(name)
                print(f"Name: {name}")
                break
        except:
            pass

    # Language
    for sel in ['select[name="primaryLocale"]', '#primaryLocale']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.select_option(label="English (U.S.)")
                print("Language: English U.S.")
                break
        except:
            pass

    # Bundle ID - look through all selects
    selects = await page.query_selector_all("select")
    for sel_el in selects:
        options = await sel_el.evaluate("el => Array.from(el.options).map(o => ({value: o.value, text: o.text}))")
        for opt in options:
            if bundle_id in opt.get('value', '') or bundle_id in opt.get('text', ''):
                await sel_el.select_option(value=opt['value'])
                print(f"Bundle: {opt['value']}")
                break

    # SKU
    for sel in ['input[name="vendorId"]', 'input[name="sku"]', '#vendorId', '#sku']:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.fill(sku)
                print(f"SKU: {sku}")
                break
        except:
            pass

    # Full Access
    for sel in ['input[value="FULL_ACCESS"]', 'label:has-text("Full Access") input']:
        try:
            el = await page.query_selector(sel)
            if el:
                await el.check()
                print("Full Access")
                break
        except:
            pass

    await page.screenshot(path=ss(f"asc_{tag}_02"))

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
    await page.screenshot(path=ss(f"asc_{tag}_03"))
    body = await page.inner_text("body")
    print(f"Result URL: {page.url}\n{body[:300]}")


asyncio.run(main())
