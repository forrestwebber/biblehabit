#!/usr/bin/env python3
"""
Create PlayToMaster app - using CDP to connect to existing logged-in Chromium session
OR re-login with saved session if needed
"""

import asyncio
import os
import re
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/final"

def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"


async def login_and_setup(page):
    """Login to App Store Connect"""
    try:
        await page.goto("https://appstoreconnect.apple.com", wait_until="domcontentloaded", timeout=15000)
    except:
        pass
    await page.wait_for_timeout(5000)

    if "login" not in page.url:
        print(f"Already logged in at: {page.url}")
        return True

    # Login via iframe
    auth_frame = next((f for f in page.frames if "idmsa.apple.com" in f.url), None)
    if not auth_frame:
        print("No auth frame")
        return False

    try:
        email_el = await auth_frame.wait_for_selector("#account_name_text_field", timeout=10000)
        await email_el.click()
        await email_el.fill("")
        await email_el.type("solomonweb26@gmail.com", delay=80)
        await email_el.press("Enter")
        await page.wait_for_timeout(4000)
    except Exception as e:
        print(f"Email error: {e}")
        return False

    auth_frame = next((f for f in page.frames if "idmsa.apple.com" in f.url), None)
    if auth_frame:
        try:
            pass_el = await auth_frame.wait_for_selector("#password_text_field", timeout=8000)
            if pass_el and await pass_el.is_visible():
                await pass_el.click()
                await pass_el.type("Hdsignals1987", delay=80)
                sign_btn = await auth_frame.query_selector("#sign-in")
                if sign_btn:
                    await sign_btn.click()
                else:
                    await pass_el.press("Enter")
        except Exception as e:
            print(f"Password error: {e}")

    await page.wait_for_timeout(5000)
    print(f"After login: {page.url}")

    # 2FA check
    all_text = ""
    for frame in page.frames:
        try:
            all_text += await frame.inner_text("body") + " "
        except:
            pass

    if any(kw in all_text.lower() for kw in ["verification code", "two-factor", "sent to your"]):
        print("2FA needed - waiting 10 min...")
        for i in range(120):
            await asyncio.sleep(5)
            if "appstoreconnect.apple.com" in page.url and "login" not in page.url:
                print("2FA done!")
                return True
            if i % 12 == 0 and i > 0:
                print(f"  {i*5}s waiting for 2FA...")
        return False

    return "login" not in page.url


async def create_playtomaster(page):
    """Create PlayToMaster app"""
    print("\n--- Creating PlayToMaster ---")

    # Navigate directly to the new app creation URL
    # App Store Connect uses this pattern for creating new apps
    try:
        await page.goto("https://appstoreconnect.apple.com/apps/new", wait_until="domcontentloaded", timeout=15000)
    except:
        pass
    await page.wait_for_timeout(3000)
    await page.screenshot(path=ss("ptm_01_new_app_url"))
    print(f"New app URL: {page.url}")
    body = await page.inner_text("body")
    print(f"Content: {body[:300]}")

    # If that didn't work, try clicking + then New App from dropdown
    if "new" not in page.url.lower() or page.url == "https://appstoreconnect.apple.com/apps/new":
        print("Direct URL worked!")
    else:
        # Go to apps page and click through menu
        try:
            await page.goto("https://appstoreconnect.apple.com/apps", wait_until="domcontentloaded", timeout=15000)
        except:
            pass
        await page.wait_for_timeout(3000)

        # Click the + button
        await page.evaluate("""() => {
            const btns = document.querySelectorAll('button');
            for(const btn of btns) {
                if(btn.textContent.trim() === '+') { btn.click(); return; }
            }
        }""")
        await page.wait_for_timeout(1000)

        # Click "New App" from dropdown
        await page.evaluate("""() => {
            document.querySelectorAll('a, button, li').forEach(el => {
                if(el.textContent.trim() === 'New App') el.click();
            });
        }""")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("ptm_02_after_new_app"))
        print(f"After new app click: {page.url}")

    body = await page.inner_text("body")
    print(f"Form content: {body[:400]}")

    # Dump all form elements
    form_info = await page.evaluate("""() => ({
        inputs: Array.from(document.querySelectorAll('input')).map(i => ({type: i.type, name: i.name, id: i.id, value: i.value, placeholder: i.placeholder})),
        selects: Array.from(document.querySelectorAll('select')).map(s => ({name: s.name, id: s.id, options: Array.from(s.options).map(o => o.text).slice(0,8)})),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim().slice(0,40)).filter(t=>t).slice(0,15),
        url: window.location.href
    })""")
    print(f"Form info:")
    print(f"  Inputs: {form_info['inputs']}")
    print(f"  Selects: {form_info['selects']}")
    print(f"  Buttons: {form_info['buttons']}")

    # Fill form - try both approaches (JS and Playwright direct)
    # Platform iOS
    ios_inputs = await page.query_selector_all('input[value="IOS"], input[value="iOS"], label:has-text("iOS") input')
    for inp in ios_inputs:
        try:
            await inp.check()
            print("iOS checked")
            break
        except:
            pass

    # App Name
    name_selectors = ['input[name="appName"]', '#appName', 'input[aria-label*="App Name"]']
    for sel in name_selectors:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.triple_click()
                await el.fill("PlayToMaster")
                print("App name: PlayToMaster")
                break
        except:
            pass

    # Primary Language
    lang_selectors = ['select[name="primaryLocale"]', '#primaryLocale', 'select[id*="locale"]']
    for sel in lang_selectors:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.select_option(label="English (U.S.)")
                print("Language: English U.S.")
                break
        except:
            pass

    # Bundle ID - find the select with playtomaster option
    all_selects = await page.query_selector_all("select")
    for sel_el in all_selects:
        options_info = await sel_el.evaluate("""el => Array.from(el.options).map(o => ({value: o.value, text: o.text}))""")
        for opt in options_info:
            if "playtomaster" in opt.get('value', '').lower() or "playtomaster" in opt.get('text', '').lower():
                await sel_el.select_option(value=opt['value'])
                print(f"Bundle ID: {opt['value']}")
                break

    # SKU
    sku_selectors = ['input[name="vendorId"]', 'input[name="sku"]', '#vendorId', '#sku']
    for sel in sku_selectors:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.triple_click()
                await el.fill("playtomaster001")
                print("SKU: playtomaster001")
                break
        except:
            pass

    # Full Access
    fa_selectors = ['input[value="FULL_ACCESS"]', 'label:has-text("Full Access") input']
    for sel in fa_selectors:
        try:
            el = await page.query_selector(sel)
            if el:
                await el.check()
                print("Full Access")
                break
        except:
            pass

    await page.wait_for_timeout(1000)
    await page.screenshot(path=ss("ptm_03_form_filled"))
    body = await page.inner_text("body")
    print(f"Form state: {body[:300]}")

    # Click Create
    create_selectors = ['button:has-text("Create")', 'button[type="submit"]', 'input[type="submit"]']
    for sel in create_selectors:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                print(f"Create clicked: {sel}")
                break
        except:
            pass

    await page.wait_for_timeout(5000)
    await page.screenshot(path=ss("ptm_04_result"))
    print(f"Result URL: {page.url}")
    body = await page.inner_text("body")
    print(f"Result: {body[:500]}")

    return page.url


async def get_app_ids(page):
    """Get app IDs for existing apps"""
    print("\n--- Getting App IDs ---")
    try:
        await page.goto("https://appstoreconnect.apple.com/apps", wait_until="domcontentloaded", timeout=15000)
    except:
        pass
    await page.wait_for_timeout(3000)

    # Get apps and their URLs (which contain the app ID)
    app_links = await page.evaluate("""() => {
        const links = document.querySelectorAll('a[href*="/apps/"]');
        return Array.from(links).map(a => ({href: a.href, text: a.textContent.trim().slice(0,50)}));
    }""")
    print("App links found:")
    for link in app_links:
        print(f"  {link['text']}: {link['href']}")
        # Extract app ID from URL like /apps/123456789/...
        match = re.search(r'/apps/(\d+)', link['href'])
        if match:
            print(f"    App ID: {match.group(1)}")


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=200,
            args=["--no-sandbox"]
        )
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()

        # Login
        logged_in = await login_and_setup(page)
        if not logged_in:
            print("Could not authenticate")
            await browser.close()
            return

        print("Authenticated!")
        await page.screenshot(path=ss("logged_in"))

        # Get app IDs for existing apps
        await get_app_ids(page)

        # Create PlayToMaster
        result_url = await create_playtomaster(page)
        print(f"\nPlayToMaster creation result: {result_url}")

        # Check apps page again
        try:
            await page.goto("https://appstoreconnect.apple.com/apps", wait_until="domcontentloaded", timeout=15000)
        except:
            pass
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("final_apps"))
        body = await page.inner_text("body")
        print(f"\nFinal apps page:\n{body[:500]}")

        await get_app_ids(page)

        await browser.close()
        print("\n=== DONE ===")


asyncio.run(main())
