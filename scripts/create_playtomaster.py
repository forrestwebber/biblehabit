#!/usr/bin/env python3
"""
Create PlayToMaster app - navigation via + dropdown then form fill
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
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=300,
            args=["--no-sandbox"]
        )
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()

        # Login
        try:
            await page.goto("https://appstoreconnect.apple.com", wait_until="domcontentloaded", timeout=15000)
        except:
            pass
        await page.wait_for_timeout(5000)
        await page.screenshot(path=ss("ptm_00_initial"))
        print(f"Initial URL: {page.url}")

        if "login" in page.url:
            # Login
            auth_frame = next((f for f in page.frames if "idmsa.apple.com" in f.url), None)
            if auth_frame:
                try:
                    email_el = await auth_frame.wait_for_selector("#account_name_text_field", timeout=10000)
                    await email_el.click()
                    await email_el.fill("")
                    await email_el.type("solomonweb26@gmail.com", delay=80)
                    await email_el.press("Enter")
                    await page.wait_for_timeout(4000)
                except Exception as e:
                    print(f"Email: {e}")

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
                        print(f"Password: {e}")

            await page.wait_for_timeout(5000)
            print(f"After login: {page.url}")

            # Wait for 2FA
            all_text = ""
            for frame in page.frames:
                try:
                    all_text += await frame.inner_text("body")
                except:
                    pass

            if any(kw in all_text.lower() for kw in ["verification code", "two-factor", "sent to your"]):
                print("2FA needed - waiting 10 min for manual entry...")
                for i in range(120):
                    await asyncio.sleep(5)
                    if "appstoreconnect.apple.com" in page.url and "login" not in page.url:
                        print("2FA done!")
                        break
                    if i % 12 == 0 and i > 0:
                        print(f"  {i*5}s waiting...")

        print(f"Authenticated at: {page.url}")

        # Navigate to apps
        try:
            await page.goto("https://appstoreconnect.apple.com/apps", wait_until="domcontentloaded", timeout=15000)
        except:
            pass
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("ptm_01_apps"))
        print(f"Apps URL: {page.url}")

        # Get current apps
        body = await page.inner_text("body")
        print(f"Apps page:\n{body[:400]}")

        # Click the "+" button (blue circle button next to "Apps" heading)
        plus_btn = await page.query_selector('button[aria-label="+"], button.add-button, .new-app-button')
        if not plus_btn:
            # Find the + button by text
            all_btns = await page.query_selector_all("button")
            for btn in all_btns:
                t = (await btn.inner_text()).strip()
                if t == "+":
                    plus_btn = btn
                    break

        if plus_btn:
            await plus_btn.click()
            print("Clicked + button")
        else:
            print("+ button not found, trying coordinate click")
            # The + is the blue circle button at top left, near "Apps" heading
            await page.mouse.click(146, 104)  # Approximate position from screenshot

        await page.wait_for_timeout(1500)
        await page.screenshot(path=ss("ptm_02_plus_menu"))
        print("Dropdown should be open")

        # Click "New App" from dropdown menu
        new_app_el = await page.query_selector('li:has-text("New App"), a:has-text("New App"), button:has-text("New App")')
        if new_app_el:
            await new_app_el.click()
            print("Clicked 'New App' from menu")
        else:
            # Try finding it by evaluating
            result = await page.evaluate("""() => {
                const els = document.querySelectorAll('li, a, button, [role="menuitem"]');
                for(const el of els) {
                    if(el.textContent.trim() === 'New App' && el.offsetParent !== null) {
                        el.click();
                        return el.tagName + ' clicked';
                    }
                }
                return 'not found';
            }""")
            print(f"New App click result: {result}")

        await page.wait_for_timeout(4000)
        await page.screenshot(path=ss("ptm_03_new_app_form"))
        print(f"After New App click: {page.url}")
        body = await page.inner_text("body")
        print(f"Form content:\n{body[:500]}")

        # Now the form should be visible
        # Get all form elements
        form_info = await page.evaluate("""() => ({
            inputs: Array.from(document.querySelectorAll('input')).map(i => ({
                type: i.type, name: i.name, id: i.id, value: i.value, placeholder: i.placeholder
            })).filter(i => i.type !== 'hidden'),
            selects: Array.from(document.querySelectorAll('select')).map(s => ({
                name: s.name, id: s.id, value: s.value,
                options: Array.from(s.options).map(o => ({value: o.value, text: o.text})).slice(0,10)
            })),
            buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t=>t).slice(0,20),
            url: window.location.href
        })""")
        print(f"\nForm inputs: {form_info['inputs']}")
        print(f"Form selects: {len(form_info['selects'])} selects")
        for s in form_info['selects']:
            print(f"  Select {s['name']}/{s['id']}: {[o['text'] for o in s['options'][:5]]}")
        print(f"Buttons: {form_info['buttons']}")

        # If we have form fields, fill them
        if form_info['inputs']:
            print("\nFilling form...")

            # iOS platform
            for inp in form_info['inputs']:
                if inp['type'] in ['checkbox', 'radio'] and 'ios' in (inp['value'] or '').lower():
                    el = await page.query_selector(f"input[value='{inp['value']}']")
                    if el:
                        await el.check()
                        print("iOS checked")
                        break

            # App Name
            for inp in form_info['inputs']:
                if inp['name'] == 'appName' or inp['id'] == 'appName' or 'name' in inp['placeholder'].lower():
                    el = await page.query_selector(f"input[name='{inp['name']}']") if inp['name'] else await page.query_selector(f"#{inp['id']}")
                    if el and await el.is_visible():
                        await el.triple_click()
                        await el.fill("PlayToMaster")
                        print("App name: PlayToMaster")
                        break

            # Language select
            for sel_info in form_info['selects']:
                if 'locale' in sel_info['name'].lower() or 'locale' in sel_info['id'].lower() or 'language' in sel_info['name'].lower():
                    sel_el = await page.query_selector(f"select[name='{sel_info['name']}']") if sel_info['name'] else await page.query_selector(f"#{sel_info['id']}")
                    if sel_el:
                        await sel_el.select_option(label="English (U.S.)")
                        print("Language: English U.S.")
                        break

            # Bundle ID select
            for sel_info in form_info['selects']:
                opts = sel_info['options']
                playtomaster_opt = next((o for o in opts if 'playtomaster' in o['value'].lower() or 'playtomaster' in o['text'].lower()), None)
                if playtomaster_opt:
                    sel_name = sel_info['name'] or sel_info['id']
                    sel_el = await page.query_selector(f"select[name='{sel_info['name']}']") if sel_info['name'] else await page.query_selector(f"#{sel_info['id']}")
                    if sel_el:
                        await sel_el.select_option(value=playtomaster_opt['value'])
                        print(f"Bundle: {playtomaster_opt['value']}")
                        break

            # SKU
            for inp in form_info['inputs']:
                if inp['name'] in ['vendorId', 'sku'] or inp['id'] in ['vendorId', 'sku']:
                    el = await page.query_selector(f"input[name='{inp['name']}']") if inp['name'] else await page.query_selector(f"#{inp['id']}")
                    if el and await el.is_visible():
                        await el.triple_click()
                        await el.fill("playtomaster001")
                        print("SKU: playtomaster001")
                        break

            # Full Access
            fa_el = await page.query_selector('input[value="FULL_ACCESS"]')
            if fa_el:
                await fa_el.check()
                print("Full Access")

            await page.wait_for_timeout(1000)
            await page.screenshot(path=ss("ptm_04_form_filled"))

            # Click Create
            create_btn = await page.query_selector('button:has-text("Create")')
            if create_btn and await create_btn.is_visible():
                await create_btn.click()
                print("Clicked Create!")
                await page.wait_for_timeout(5000)
                await page.screenshot(path=ss("ptm_05_result"))
                print(f"Result URL: {page.url}")
                body = await page.inner_text("body")
                print(f"Result:\n{body[:500]}")
            else:
                print("Create button not found")
                # Show what buttons exist
                create_btns = await page.query_selector_all("button")
                for btn in create_btns:
                    t = (await btn.inner_text()).strip()
                    if t:
                        print(f"  Button: [{t}]")
        else:
            print("No form inputs found - form may not have loaded")
            print("Page content:", body[:200])

        # Check final apps list
        try:
            await page.goto("https://appstoreconnect.apple.com/apps", wait_until="domcontentloaded", timeout=15000)
        except:
            pass
        await page.wait_for_timeout(3000)
        await page.screenshot(path=ss("ptm_final_apps"))
        body = await page.inner_text("body")
        print(f"\nFinal apps: {body[:500]}")

        # Get app links/IDs
        app_links = await page.evaluate("""() => {
            const links = document.querySelectorAll('a[href*="/apps/"]');
            return Array.from(links).map(a => ({href: a.href, text: a.textContent.trim()}));
        }""")
        print("\nApp IDs:")
        for link in app_links:
            if link['text']:
                match = re.search(r'/apps/(\d+)', link['href'])
                if match:
                    print(f"  {link['text']}: {match.group(1)}")

        await browser.close()
        print("\n=== DONE ===")


asyncio.run(main())
