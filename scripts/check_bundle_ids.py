#!/usr/bin/env python3
"""
Debug bundle ID availability in App Store Connect + check if PlayToMaster already exists
"""

import asyncio
import os
import re
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/final"

def ss(name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    return f"{SCREENSHOT_DIR}/{name}.png"


async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=300, args=["--no-sandbox"])
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()

        # Login
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
                            await pass_el.fill("Hdsignals1987")
                            sign_btn = await auth_frame.query_selector("#sign-in")
                            if sign_btn:
                                await sign_btn.click()
                            else:
                                await pass_el.press("Enter")
                    except Exception as e:
                        print(f"Password: {e}")

            await page.wait_for_timeout(5000)

            all_text = "".join([(await f.inner_text("body")) for f in page.frames if True])
            if any(kw in all_text.lower() for kw in ["verification code", "two-factor"]):
                print("2FA - waiting 10 min...")
                for i in range(120):
                    await asyncio.sleep(5)
                    if "appstoreconnect.apple.com" in page.url and "login" not in page.url:
                        print("2FA done!")
                        break
                    if i % 12 == 0 and i > 0:
                        print(f"  {i*5}s...")

        print(f"At: {page.url}")

        # Navigate to App Store Connect and use the API to check bundle IDs
        await page.goto("https://appstoreconnect.apple.com/apps", wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(3000)

        # Use the internal API to check available bundle IDs
        result = await page.evaluate("""async () => {
            try {
                const r = await fetch('/iris/v1/ascBundleIds?limit=200', {
                    credentials: 'include',
                    headers: {'Accept': 'application/json'}
                });
                const data = await r.json();
                return {
                    status: r.status,
                    count: data.data?.length || 0,
                    ids: (data.data || []).map(item => ({
                        id: item.id,
                        bundleId: item.attributes?.bundleId,
                        name: item.attributes?.name
                    }))
                };
            } catch(e) {
                return {error: e.message};
            }
        }""")
        print(f"\nBundle IDs from API: {result}")

        # Also check the apps list
        apps_result = await page.evaluate("""async () => {
            try {
                const r = await fetch('/iris/v1/apps?limit=100', {
                    credentials: 'include',
                    headers: {'Accept': 'application/json'}
                });
                const data = await r.json();
                return {
                    status: r.status,
                    count: data.data?.length || 0,
                    apps: (data.data || []).map(item => ({
                        id: item.id,
                        name: item.attributes?.name,
                        bundleId: item.attributes?.bundleId,
                        sku: item.attributes?.sku
                    }))
                };
            } catch(e) {
                return {error: e.message};
            }
        }""")
        print(f"\nApps from API: {apps_result}")

        # Open New App form and wait for bundle IDs to load
        print("\nOpening New App form...")
        plus_el = await page.query_selector('button:has-text("+")')
        if plus_el:
            await plus_el.click()
        else:
            await page.mouse.click(146, 104)
        await page.wait_for_timeout(1000)

        new_app = await page.query_selector('li:has-text("New App"), a:has-text("New App")')
        if new_app:
            await new_app.click()
        await page.wait_for_timeout(5000)  # Wait longer for bundle IDs to load
        await page.screenshot(path=ss("check_01_form"))

        # Check bundle ID select again after longer wait
        bundle_sel = await page.query_selector('select[name="bundleId"]')
        if bundle_sel:
            options = await bundle_sel.evaluate("el => Array.from(el.options).map(o => ({value: o.value, text: o.text}))")
            print(f"\nBundle ID options (after 5s wait): {options}")

            if len(options) <= 1:
                # Try clicking the select to trigger loading
                await bundle_sel.click()
                await page.wait_for_timeout(3000)
                options2 = await bundle_sel.evaluate("el => Array.from(el.options).map(o => ({value: o.value, text: o.text}))")
                print(f"Options after clicking: {options2}")

        await page.screenshot(path=ss("check_02_bundle"))

        # Check the network requests for bundle ID loading
        # Listen for XHR responses
        print("\nLooking for bundle ID API endpoint...")
        bundle_api = await page.evaluate("""async () => {
            try {
                // Try to fetch bundle IDs from ASC API
                const r = await fetch('/iris/v1/ascBundleIds?limit=200&filter[platform]=IOS', {
                    credentials: 'include',
                    headers: {'Accept': 'application/json'}
                });
                const data = await r.json();
                return {status: r.status, data: JSON.stringify(data).slice(0, 2000)};
            } catch(e) {
                return {error: e.message};
            }
        }""")
        print(f"Bundle ID API: {bundle_api}")

        # Also try alternate endpoint
        bundle_api2 = await page.evaluate("""async () => {
            try {
                const r = await fetch('/iris/v1/bundleIds?limit=200', {
                    credentials: 'include',
                    headers: {'Accept': 'application/json'}
                });
                const data = await r.json();
                return {status: r.status, data: JSON.stringify(data).slice(0, 2000)};
            } catch(e) {
                return {error: e.message};
            }
        }""")
        print(f"\nBundle API 2: {bundle_api2}")

        await browser.close()
        print("\n=== DONE ===")


asyncio.run(main())
