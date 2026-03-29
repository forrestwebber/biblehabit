"""
Wayfront.com Client Portal Crawler v3
Two-step login with proper input targeting.
"""
import time
import json
import os
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.expanduser("~/antigravity/projects/slacked-co/research/wayfront_screenshots")
URL = "https://solomonweb.wayfront.com"
EMAIL = "hello@forrestwebber.com"
PASSWORD = "hunsok-0micte-matJoz"

def screenshot(page, name, wait=2):
    time.sleep(wait)
    path = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    print(f"  ✓ Screenshot: {name}.png")
    return path

def extract_page_features(page):
    return page.evaluate("""
        () => {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText.trim());
            const buttons = Array.from(document.querySelectorAll('button, [role="button"], .btn, a.button')).map(b => b.innerText.trim()).filter(t => t);
            const tables = document.querySelectorAll('table').length;
            const forms = document.querySelectorAll('form').length;
            const cards = document.querySelectorAll('[class*="card"], [class*="Card"]').length;
            const tabs = Array.from(document.querySelectorAll('[role="tab"], .tab, [class*="tab"]')).map(t => t.innerText.trim()).filter(t => t);
            const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea')).map(i => ({
                type: i.type || i.tagName.toLowerCase(),
                name: i.name || i.placeholder || '',
                visible: i.offsetParent !== null
            }));
            return { headings, buttons, tables, forms, cards, tabs, inputs };
        }
    """)

def debug_inputs(page):
    """List all visible inputs on page."""
    inputs = page.evaluate("""
        () => Array.from(document.querySelectorAll('input')).map((el, i) => ({
            index: i,
            type: el.type,
            name: el.name,
            placeholder: el.placeholder,
            visible: el.offsetParent !== null,
            id: el.id,
            className: el.className
        }))
    """)
    for inp in inputs:
        print(f"    Input[{inp['index']}]: type={inp['type']}, name={inp['name']}, placeholder={inp['placeholder']}, visible={inp['visible']}, id={inp['id']}")
    return inputs

def main():
    results = {"pages": {}, "nav_links": [], "login_success": False}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Step 1: Navigate to login
        print("🔑 Navigating to login page...")
        page.goto(URL, wait_until="networkidle", timeout=30000)
        screenshot(page, "01_login_page")

        # Debug: list all inputs
        print("  Inputs on login page:")
        debug_inputs(page)

        # Step 2: Fill email using placeholder
        print("\n🔑 Step 1: Entering email...")
        try:
            # Try by placeholder "Email"
            email_field = page.get_by_placeholder("Email")
            email_field.fill(EMAIL)
            print("  ✓ Email filled via placeholder")
        except:
            try:
                # Fallback: visible input that's not hidden
                email_field = page.locator('input[type="email"], input[type="text"]:visible, input:not([type="hidden"]):visible').first
                email_field.fill(EMAIL)
                print("  ✓ Email filled via visible input")
            except Exception as e:
                print(f"  ❌ Could not fill email: {e}")
                browser.close()
                return

        time.sleep(0.5)

        # Click Sign in
        page.get_by_role("button", name="Sign in").click()
        print("  Clicked Sign in...")
        time.sleep(4)

        try:
            page.wait_for_load_state("networkidle", timeout=10000)
        except:
            pass

        screenshot(page, "02_after_email_submit")
        current_url = page.url
        print(f"  URL: {current_url}")

        # Debug inputs on this page
        print("  Inputs after email submit:")
        inputs_info = debug_inputs(page)

        # Check page text
        body_text = page.inner_text('body')
        print(f"  Body text (first 500): {body_text[:500]}")

        # Look for password field
        password_count = page.locator('input[type="password"]').count()
        visible_inputs = [i for i in inputs_info if i['visible'] and i['type'] != 'hidden']

        if password_count > 0:
            print("\n🔑 Step 2: Password field found, entering password...")
            page.locator('input[type="password"]').first.fill(PASSWORD)
            time.sleep(0.5)
            screenshot(page, "03_password_filled")
            page.get_by_role("button", name="Sign in").or_(page.locator('button[type="submit"]')).click()
            time.sleep(4)
            try:
                page.wait_for_load_state("networkidle", timeout=10000)
            except:
                pass
            screenshot(page, "04_after_login")
            print(f"  URL after login: {page.url}")
        elif 'magic' in body_text.lower() or 'link' in body_text.lower() or 'check your' in body_text.lower():
            print("\n⚠️ Magic link login detected — no password step available")
            print(f"  Page says: {body_text[:300]}")
        else:
            # Try to find any visible non-hidden input to put password in
            if visible_inputs:
                print(f"\n  Found {len(visible_inputs)} visible inputs, trying to fill password...")
                for inp in visible_inputs:
                    if inp['type'] in ('text', 'password', ''):
                        selector = f"input[name='{inp['name']}']" if inp['name'] else f"input#{inp['id']}" if inp['id'] else None
                        if selector:
                            try:
                                page.locator(selector).fill(PASSWORD)
                                print(f"  Filled input: {selector}")
                                break
                            except:
                                pass

        # Now check where we are
        current_url = page.url
        print(f"\n📍 Current URL: {current_url}")

        # Try navigating to portal pages regardless
        print("\n📍 Navigating portal sections...")
        base_url = "https://solomonweb.wayfront.com"
        visited = set()

        sections = [
            ("dashboard", "/"),
            ("dashboard2", "/dashboard"),
            ("orders", "/orders"),
            ("order_new", "/order/new"),
            ("projects", "/projects"),
            ("clients", "/clients"),
            ("services", "/services"),
            ("billing", "/billing"),
            ("invoices", "/invoices"),
            ("tickets", "/tickets"),
            ("helpdesk", "/helpdesk"),
            ("messages", "/messages"),
            ("inbox", "/inbox"),
            ("reports", "/reports"),
            ("analytics", "/analytics"),
            ("settings", "/settings"),
            ("team", "/team"),
            ("integrations", "/integrations"),
            ("forms", "/forms"),
            ("coupons", "/coupons"),
            ("affiliates", "/affiliates"),
            ("account", "/account"),
            ("profile", "/profile"),
            ("subscriptions", "/subscriptions"),
            ("workspace", "/workspace"),
        ]

        for name, path in sections:
            full_url = base_url + path
            if full_url in visited:
                continue
            visited.add(full_url)
            try:
                response = page.goto(full_url, wait_until="networkidle", timeout=12000)
                time.sleep(2)
                status = response.status if response else 0
                final_url = page.url

                # Redirected to login?
                if 'login' in final_url.lower() and name != "dashboard":
                    print(f"  ✗ {name}: → login redirect")
                    results["pages"][name] = {"url": full_url, "redirected_to_login": True}
                    continue

                screenshot(page, f"10_{name}", wait=1)
                features = extract_page_features(page)
                results["pages"][name] = {
                    "url": final_url,
                    "status": status,
                    "features": features,
                    "title": page.title()
                }
                if 'login' not in final_url.lower():
                    results["login_success"] = True
                print(f"  ✓ {name}: {status} | {final_url} | {len(features.get('headings',[]))}h {len(features.get('buttons',[]))}b")

                # Get nav links from first successful page
                if not results["nav_links"]:
                    nav = page.evaluate("""
                        () => Array.from(document.querySelectorAll('a[href]')).map(a => ({
                            text: a.innerText.trim(),
                            href: a.href
                        })).filter(l => l.text && l.href && !l.href.includes('javascript'))
                    """)
                    results["nav_links"] = nav
                    print(f"  📍 Found {len(nav)} links on page")

            except Exception as e:
                print(f"  ✗ {name}: {str(e)[:80]}")

        # Visit nav links that look like portal sections
        for link in results.get("nav_links", [])[:30]:
            href = link['href']
            if href in visited or not href.startswith(base_url):
                continue
            visited.add(href)
            name = link['text'].lower().replace(' ', '_').replace('/', '_')[:25]
            if not name or name in ('sign_in', 'sign_up', 'login', 'logout'):
                continue
            try:
                response = page.goto(href, wait_until="networkidle", timeout=12000)
                time.sleep(2)
                if response and response.status < 400 and 'login' not in page.url.lower():
                    screenshot(page, f"20_nav_{name}", wait=1)
                    features = extract_page_features(page)
                    results["pages"][f"nav_{name}"] = {
                        "url": page.url,
                        "status": response.status,
                        "features": features,
                        "title": page.title()
                    }
                    print(f"  ✓ nav/{name}: {response.status}")
            except Exception as e:
                print(f"  ✗ nav/{name}: {str(e)[:60]}")

        browser.close()

    # Save results
    results_path = os.path.join(SCREENSHOTS_DIR, "crawl_results.json")
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n💾 Results saved to {results_path}")

    print(f"\n{'='*60}")
    print("CRAWL SUMMARY")
    print(f"{'='*60}")
    print(f"Login successful: {results['login_success']}")
    accessible = [n for n, d in results['pages'].items() if d.get('features')]
    print(f"Pages with content: {len(accessible)}")
    for name in accessible:
        data = results['pages'][name]
        h = data['features'].get('headings', [])
        print(f"  {name}: {data.get('title','')} | headings: {h[:3]}")

    screenshots = sorted([f for f in os.listdir(SCREENSHOTS_DIR) if f.endswith('.png')])
    print(f"\nScreenshots ({len(screenshots)}):")
    for s in screenshots:
        print(f"  📸 {s}")

if __name__ == "__main__":
    main()
