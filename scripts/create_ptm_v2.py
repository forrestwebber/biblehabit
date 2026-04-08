#!/usr/bin/env python3
"""
Create PlayToMaster - fixed triple_click + bundle ID registration check
"""

import asyncio
import os
import re
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/final"

def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"


async def login(browser):
    ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
    page = await ctx.new_page()

    try:
        await page.goto("https://appstoreconnect.apple.com", wait_until="domcontentloaded", timeout=15000)
    except:
        pass
    await page.wait_for_timeout(5000)

    if "login" in page.url:
        auth_frame = next((f for f in page.frames if "idmsa.apple.com" in f.url), None)
        if auth_frame:
            try:
                email_el = await auth_frame.wait_for_selector("#account_name_text_field", timeout=10000)
                await email_el.click()
                await email_el.fill("solomonweb26@gmail.com")
                await email_el.press("Enter")
                await page.wait_for_timeout(4000)
            except Exception as e:
                print(f"Email: {e}")

            auth_frame = next((f for f in page.frames if "idmsa.apple.com" in f.url), None)
            if auth_frame:
                try:
                    pass_el = await auth_frame.wait_for_selector("#password_text_field", timeout=8000)
                    if pass_el:
                        await pass_el.click()
                        await pass_el.fill("Hdsignals1987")
                        sign_btn = await auth_frame.query_selector("#sign-in")
                        if sign_btn:
                            await sign_btn.click()
                        else:
                            await pass_el.press("Enter")
                except Exception as e:
                    print(f"Password: {e}")

        await page.wait_for_timeout(5000)
        print(f"After login: {page.url}")

        # 2FA
        all_text = ""
        for frame in page.frames:
            try:
                all_text += await frame.inner_text("body")
            except:
                pass

        if any(kw in all_text.lower() for kw in ["verification code", "two-factor", "sent to"]):
            print("Waiting for 2FA...")
            for i in range(120):
                await asyncio.sleep(5)
                if "appstoreconnect.apple.com" in page.url and "login" not in page.url:
                    print("2FA done!")
                    break
                if i % 12 == 0 and i > 0:
                    print(f"  {i*5}s waiting for 2FA...")

    return page, ctx


async def check_bundle_ids(page):
    """Check what bundle IDs are registered in Developer portal"""
    print("\n=== Checking Bundle IDs ===")
    try:
        await page.goto("https://developer.apple.com/account/resources/identifiers/list", wait_until="domcontentloaded", timeout=15000)
    except:
        pass
    await page.wait_for_timeout(5000)
    await page.screenshot(path=ss("dev_01_identifiers"))
    print(f"Identifiers URL: {page.url}")
    body = await page.inner_text("body")
    print(f"Content:\n{body[:1000]}")


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=200, args=["--no-sandbox"])

        page, ctx = await login(browser)
        print(f"Authenticated: {page.url}")

        # First check what bundle IDs are available
        # Navigate to developer.apple.com to see identifiers
        await check_bundle_ids(page)

        # Go back to App Store Connect
        try:
            await page.goto("https://appstoreconnect.apple.com/apps", wait_until="domcontentloaded", timeout=15000)
        except:
            pass
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("ptm2_01_apps"))

        # Open the new app form
        # Find and click the + button
        plus_el = await page.query_selector('button:has-text("+")')
        if plus_el:
            await plus_el.click()
            print("Clicked +")
        else:
            # Try coordinate click at the blue + button
            await page.mouse.click(146, 104)
            print("Coordinate click for +")

        await page.wait_for_timeout(1500)
        await page.screenshot(path=ss("ptm2_02_plus_open"))

        # Click New App
        new_app = await page.query_selector('li:has-text("New App"), a:has-text("New App")')
        if new_app:
            await new_app.click()
            print("Clicked New App from menu")
        else:
            # Try via JS
            await page.evaluate("""() => {
                document.querySelectorAll('li, a, button').forEach(el => {
                    if(el.textContent.trim() === 'New App' && el.offsetParent !== null) el.click();
                });
            }""")

        await page.wait_for_timeout(4000)
        await page.screenshot(path=ss("ptm2_03_form"))
        print(f"Form URL: {page.url}")
        body = await page.inner_text("body")

        # Check bundle IDs available
        bundle_select = await page.query_selector('select[name="bundleId"], select[id="bundleId"]')
        if bundle_select:
            options = await bundle_select.evaluate("el => Array.from(el.options).map(o => ({value: o.value, text: o.text}))")
            print(f"Available bundle IDs: {options}")

        # Check the form
        if "Name" in body or "Platforms" in body:
            print("Form is visible, filling...")

            # iOS checkbox
            ios_cb = await page.query_selector('input[name="platformsById.IOS"]')
            if ios_cb:
                await ios_cb.check()
                print("iOS checked")

            # App Name
            name_input = await page.query_selector('input[name="name"]')
            if name_input and await name_input.is_visible():
                await name_input.click()
                await name_input.fill("PlayToMaster")
                print("Name: PlayToMaster")

            # Primary Language
            lang_sel = await page.query_selector('select[name="primaryLocale"]')
            if lang_sel:
                await lang_sel.select_option(label="English (U.S.)")
                print("Language: English (U.S.)")

            # Bundle ID - check what's available
            bundle_sel = await page.query_selector('select[name="bundleId"]')
            if bundle_sel:
                options = await bundle_sel.evaluate("el => Array.from(el.options).map(o => ({value: o.value, text: o.text}))")
                print(f"Bundle ID options: {options}")

                # Try to find playtomaster
                ptm_opt = next((o for o in options if 'playtomaster' in o['value'].lower() or 'playtomaster' in o['text'].lower()), None)
                if ptm_opt:
                    await bundle_sel.select_option(value=ptm_opt['value'])
                    print(f"Selected bundle: {ptm_opt['value']}")
                else:
                    print("com.playtomaster.app not found in bundle IDs list!")
                    print("Available options:", options)
                    # Need to register bundle ID first in developer.apple.com

            # SKU
            sku_input = await page.query_selector('input[name="sku"]')
            if sku_input:
                await sku_input.click()
                await sku_input.fill("playtomaster001")
                print("SKU: playtomaster001")

            # User Access - Full
            full_access = await page.query_selector('input[value="full"]')
            if full_access:
                await full_access.check()
                print("Full Access")

            await page.wait_for_timeout(1000)
            await page.screenshot(path=ss("ptm2_04_filled"))
            body = await page.inner_text("body")
            print(f"Form state:\n{body[:400]}")

            # Check if bundle ID is a problem
            if not ptm_opt or options == [{'value': '', 'text': 'Choose'}]:
                print("\n*** BUNDLE ID NOT REGISTERED ***")
                print("Need to register com.playtomaster.app in Apple Developer portal first")
                print("Going to developer.apple.com to register...")

                # Cancel the form
                cancel = await page.query_selector('button:has-text("Cancel")')
                if cancel:
                    await cancel.click()
                    await page.wait_for_timeout(2000)

                # Register bundle ID
                try:
                    await page.goto("https://developer.apple.com/account/resources/identifiers/add/bundleId", wait_until="domcontentloaded", timeout=15000)
                except:
                    pass
                await page.wait_for_timeout(5000)
                await page.screenshot(path=ss("ptm2_05_dev_register"))
                print(f"Dev register URL: {page.url}")
                body = await page.inner_text("body")
                print(f"Content:\n{body[:500]}")

                # Fill the registration form
                inputs = await page.query_selector_all("input")
                print("Inputs on registration page:")
                for inp in inputs:
                    t = await inp.get_attribute("type")
                    n = await inp.get_attribute("name") or ""
                    pid = await inp.get_attribute("id") or ""
                    ph = await inp.get_attribute("placeholder") or ""
                    vis = await inp.is_visible()
                    print(f"  type={t} name={n} id={pid} ph={ph} vis={vis}")

            else:
                # Try to create
                create_btn = await page.query_selector('button:has-text("Create")')
                if create_btn:
                    await create_btn.click()
                    print("Create clicked!")
                    await page.wait_for_timeout(5000)
                    await page.screenshot(path=ss("ptm2_06_created"))
                    print(f"Result URL: {page.url}")
                    body = await page.inner_text("body")
                    print(f"Result:\n{body[:500]}")
        else:
            print("Form not visible")
            print("Content:", body[:300])

        # Final state
        try:
            await page.goto("https://appstoreconnect.apple.com/apps", wait_until="domcontentloaded", timeout=15000)
        except:
            pass
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("ptm2_final"))
        body = await page.inner_text("body")
        print(f"\nFinal apps page:\n{body[:400]}")

        # Get app IDs
        app_links = await page.evaluate("""() => {
            const links = document.querySelectorAll('a[href*="/apps/"]');
            const seen = new Set();
            const result = [];
            links.forEach(a => {
                const m = a.href.match(/\\/apps\\/(\\d+)/);
                if(m && !seen.has(m[1])) {
                    seen.add(m[1]);
                    result.push({id: m[1], href: a.href, text: a.textContent.trim().slice(0,60)});
                }
            });
            return result;
        }""")
        print("\nApp IDs found:")
        for app in app_links:
            if app['text']:
                print(f"  {app['text']}: {app['id']}")

        await browser.close()
        print("\n=== DONE ===")


asyncio.run(main())
