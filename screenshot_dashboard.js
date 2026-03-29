const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const BASE_URL = 'http://localhost:3099';

const DASHBOARD_PAGES = [
  { name: 'overview', path: '/dashboard' },
  { name: 'deliverables', path: '/dashboard/deliverables' },
  { name: 'messages', path: '/dashboard/messages' },
  { name: 'billing', path: '/dashboard/billing' },
  { name: 'reports', path: '/dashboard/reports' },
  { name: 'services', path: '/dashboard/services' },
  { name: 'settings', path: '/dashboard/settings' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Also screenshot the login page on production
  const prodContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const prodPage = await prodContext.newPage();
  await prodPage.goto('https://slacked.co/login', { waitUntil: 'networkidle', timeout: 15000 });
  await prodPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login_desktop.png'), fullPage: true });
  console.log('✅ Saved: login_desktop.png (production)');

  const prodMobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const prodMobilePage = await prodMobileCtx.newPage();
  await prodMobilePage.goto('https://slacked.co/login', { waitUntil: 'networkidle', timeout: 15000 });
  await prodMobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login_mobile.png'), fullPage: true });
  console.log('✅ Saved: login_mobile.png (production)');
  await prodContext.close();
  await prodMobileCtx.close();

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const dp of DASHBOARD_PAGES) {
      const url = `${BASE_URL}${dp.path}`;
      console.log(`  Navigating to ${dp.name}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      } catch (e) {
        console.log(`    Timeout on networkidle, proceeding...`);
      }

      await page.waitForTimeout(1500);

      const filename = `dashboard_${dp.name}_${vp.name}.png`;
      const filepath = path.join(SCREENSHOTS_DIR, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      console.log(`    ✅ Saved: ${filename}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\n🎉 All screenshots complete!');
})();
