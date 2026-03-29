"""
Wayfront.com Public Website Crawler
Takes screenshots of all public feature pages for competitive analysis.
"""
import time
import os
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.expanduser("~/antigravity/projects/slacked-co/research/wayfront_screenshots")

PAGES = [
    ("homepage", "https://wayfront.com"),
    ("features_overview", "https://wayfront.com/features"),
    ("client_portal", "https://wayfront.com/features/client-portal"),
    ("crm", "https://wayfront.com/features/crm"),
    ("order_forms", "https://wayfront.com/features/order-forms"),
    ("helpdesk", "https://wayfront.com/features/helpdesk"),
    ("invoicing", "https://wayfront.com/features/invoicing"),
    ("project_mgmt", "https://wayfront.com/features/project-management"),
    ("reporting", "https://wayfront.com/features/reporting"),
    ("pricing", "https://wayfront.com/pricing"),
    ("integrations", "https://wayfront.com/integrations"),
    ("compare", "https://wayfront.com/compare"),
    ("seo_agencies", "https://wayfront.com/seo-agencies"),
    ("case_study", "https://wayfront.com/case-studies/digitalpush"),
    ("blog_portal", "https://wayfront.com/blog/what-is-a-client-portal"),
]

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        for name, url in PAGES:
            print(f"📄 {name}: {url}")
            try:
                response = page.goto(url, wait_until="networkidle", timeout=20000)
                time.sleep(2)
                status = response.status if response else 0

                if status < 400:
                    # Full page screenshot
                    path = os.path.join(SCREENSHOTS_DIR, f"pub_{name}.png")
                    page.screenshot(path=path, full_page=True)
                    print(f"  ✓ {status} — saved pub_{name}.png")

                    # Also take viewport-only shot for above-fold
                    path2 = os.path.join(SCREENSHOTS_DIR, f"pub_{name}_fold.png")
                    page.screenshot(path=path2, full_page=False)
                else:
                    print(f"  ✗ {status}")
            except Exception as e:
                print(f"  ✗ {str(e)[:80]}")

        browser.close()

    screenshots = sorted([f for f in os.listdir(SCREENSHOTS_DIR) if f.startswith('pub_') and f.endswith('.png')])
    print(f"\n✅ Captured {len(screenshots)} public page screenshots")
    for s in screenshots:
        print(f"  📸 {s}")

if __name__ == "__main__":
    main()
