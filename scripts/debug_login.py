#!/usr/bin/env python3
"""
Debug Apple login - check for iframes and fix input detection
"""

import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/forrestwebber/slacked-internal-dev/projects/daily_bible/screenshots/appstore"

async def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=100)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await ctx.new_page()

        print("=== Checking Apple Login Iframe ===")
        await page.goto("https://appstoreconnect.apple.com", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)

        # Check for iframes
        frames = page.frames
        print(f"Number of frames: {len(frames)}")
        for i, frame in enumerate(frames):
            print(f"  Frame {i}: url={frame.url}, name={frame.name}")

        # Check main frame DOM
        html = await page.content()
        print(f"\nPage HTML length: {len(html)}")
        print("Looking for input in HTML...")
        if "input" in html.lower():
            # Find input elements
            idx = html.lower().find("<input")
            while idx != -1:
                print(f"  Found input at {idx}: {html[idx:idx+200]}")
                idx = html.lower().find("<input", idx+1)
                if idx > 5000:
                    break

        await page.screenshot(path=f"{SCREENSHOT_DIR}/debug_01_initial.png")

        # Check each iframe
        for i, frame in enumerate(frames):
            if frame.url and frame.url != "about:blank":
                try:
                    inputs = await frame.query_selector_all("input")
                    print(f"\nFrame {i} ({frame.url}) inputs: {len(inputs)}")
                    for inp in inputs:
                        t = await inp.get_attribute("type")
                        n = await inp.get_attribute("name")
                        pid = await inp.get_attribute("id")
                        ph = await inp.get_attribute("placeholder")
                        vis = await inp.is_visible()
                        print(f"    type={t} name={n} id={pid} placeholder={ph} visible={vis}")

                    if inputs:
                        print(f"\nTrying to fill in frame {i}...")
                        for inp in inputs:
                            t = await inp.get_attribute("type")
                            if t not in ["hidden", "checkbox", "radio"]:
                                vis = await inp.is_visible()
                                if vis:
                                    await inp.click()
                                    await inp.fill("solomonweb26@gmail.com")
                                    print("Filled email in iframe!")
                                    break
                except Exception as e:
                    print(f"  Error in frame {i}: {e}")

        await page.screenshot(path=f"{SCREENSHOT_DIR}/debug_02_after_iframe_fill.png")

        # Also try clicking by coordinates (the input is visually at center)
        print("\nTrying click by coordinates...")
        await page.mouse.click(640, 418)  # Center of the input box from screenshot
        await page.wait_for_timeout(500)
        await page.keyboard.type("solomonweb26@gmail.com", delay=50)
        await page.wait_for_timeout(500)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/debug_03_typed.png")

        body = await page.inner_text("body")
        print(f"Body after typing: {body[:300]}")

        await browser.close()

asyncio.run(main())
