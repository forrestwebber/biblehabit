const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'wayfront_authenticated');
const BASE_URL = 'https://solomonweb.wayfront.com';
const EMAIL = 'hello@forrestwebber.com';
const PASSWORD = 'hunsok-0micte-matJoz';

async function run() {
  // Create screenshot directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = {};

  try {
    // Step 1: Go to login page
    console.log('1. Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_page.png'), fullPage: true });
    console.log('   Login page loaded.');

    // Step 2: Enter email
    console.log('2. Entering email...');
    await page.fill('input[type="email"], input[name="email"]', EMAIL);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_email_filled.png'), fullPage: true });

    // Click sign in
    await page.click('button:has-text("Sign in"), button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_after_email_submit.png'), fullPage: true });
    console.log('   Email submitted. Current URL:', page.url());

    // Step 3: Check if password field appeared
    const passwordField = await page.$('input[type="password"]');
    if (passwordField) {
      console.log('3. Password field found. Entering password...');
      await passwordField.fill(PASSWORD);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_password_filled.png'), fullPage: true });

      // Submit password
      await page.click('button:has-text("Sign in"), button[type="submit"]');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_after_login.png'), fullPage: true });
      console.log('   Password submitted. Current URL:', page.url());
    } else {
      // Maybe it's a magic link login or different flow
      console.log('3. No password field found. Checking page content...');
      const pageContent = await page.textContent('body');
      console.log('   Page text (first 500 chars):', pageContent.substring(0, 500));

      // Try looking for other input types
      const inputs = await page.$$eval('input', els => els.map(e => ({ type: e.type, name: e.name, placeholder: e.placeholder })));
      console.log('   Available inputs:', JSON.stringify(inputs));
    }

    // Step 4: Check if we're logged in
    const currentUrl = page.url();
    console.log('4. Current URL after login:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('   Still on login page. Checking for errors...');
      const bodyText = await page.textContent('body');
      console.log('   Body text:', bodyText.substring(0, 500));

      // Try alternative: maybe the form has different selectors
      const allButtons = await page.$$eval('button', els => els.map(e => e.textContent.trim()));
      console.log('   Buttons on page:', allButtons);
      const allInputs = await page.$$eval('input', els => els.map(e => ({ type: e.type, name: e.name, id: e.id })));
      console.log('   Inputs on page:', JSON.stringify(allInputs));
    }

    // Step 5: Navigate authenticated pages
    const pagesToVisit = [
      { name: 'dashboard', path: '/dashboard' },
      { name: 'orders', path: '/orders' },
      { name: 'services', path: '/services' },
      { name: 'billing', path: '/billing' },
      { name: 'messages', path: '/messages' },
      { name: 'helpdesk', path: '/helpdesk' },
      { name: 'account', path: '/account' },
      { name: 'settings', path: '/settings' },
      { name: 'profile', path: '/profile' },
      { name: 'reports', path: '/reports' },
      { name: 'analytics', path: '/analytics' },
      { name: 'team', path: '/team' },
      { name: 'workspace', path: '/workspace' },
      { name: 'inbox', path: '/inbox' },
      { name: 'affiliates', path: '/affiliates' },
      { name: 'invoices', path: '/invoices' },
      { name: 'tickets', path: '/tickets' },
      { name: 'files', path: '/files' },
      { name: 'notifications', path: '/notifications' },
    ];

    for (const pg of pagesToVisit) {
      try {
        console.log(`\nVisiting ${pg.name} (${BASE_URL}${pg.path})...`);
        await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1500);

        const url = page.url();
        const title = await page.title();

        // Check if redirected to login
        const redirectedToLogin = url.includes('/login');

        // Get page features
        let features = {};
        if (!redirectedToLogin) {
          features = await page.evaluate(() => {
            const headings = [...document.querySelectorAll('h1, h2, h3')].map(h => h.textContent.trim()).filter(t => t);
            const buttons = [...document.querySelectorAll('button, a.btn, [role="button"]')].map(b => b.textContent.trim()).filter(t => t).slice(0, 20);
            const tables = document.querySelectorAll('table').length;
            const forms = document.querySelectorAll('form').length;
            const cards = document.querySelectorAll('.card, [class*="card"], [class*="Card"]').length;
            const tabs = [...document.querySelectorAll('[role="tab"], .tab, [class*="tab"]')].map(t => t.textContent.trim()).filter(t => t);
            const navItems = [...document.querySelectorAll('nav a, aside a, [class*="sidebar"] a, [class*="nav"] a')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') })).filter(i => i.text);
            const inputs = [...document.querySelectorAll('input, textarea, select')].map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder }));
            const modals = document.querySelectorAll('[class*="modal"], [role="dialog"]').length;
            const dropdowns = document.querySelectorAll('[class*="dropdown"], select').length;
            const charts = document.querySelectorAll('canvas, svg[class*="chart"], [class*="chart"]').length;

            return { headings, buttons, tables, forms, cards, tabs, navItems: navItems.slice(0, 30), inputs, modals, dropdowns, charts };
          });
        }

        results[pg.name] = {
          url,
          title,
          redirectedToLogin,
          features,
          status: redirectedToLogin ? 'login_redirect' : 'accessible'
        };

        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `${pg.name}.png`),
          fullPage: true
        });

        console.log(`   Status: ${redirectedToLogin ? 'REDIRECTED TO LOGIN' : 'ACCESSIBLE'}`);
        console.log(`   Title: ${title}`);
        if (features.headings) console.log(`   Headings: ${features.headings.join(', ')}`);
        if (features.navItems && features.navItems.length > 0) console.log(`   Nav items: ${features.navItems.map(n => n.text).join(', ')}`);

      } catch (err) {
        console.log(`   ERROR on ${pg.name}: ${err.message}`);
        results[pg.name] = { error: err.message };
      }
    }

    // Step 6: If logged in, explore the sidebar/navigation to find ALL available pages
    if (!page.url().includes('/login')) {
      console.log('\n\n=== EXPLORING NAVIGATION ===');
      try {
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 });
        const allLinks = await page.$$eval('a', els => els.map(e => ({
          text: e.textContent.trim(),
          href: e.getAttribute('href')
        })).filter(l => l.href && l.href.startsWith('/')));
        console.log('All internal links found:', JSON.stringify(allLinks, null, 2));
        results['_navigation'] = allLinks;
      } catch (err) {
        console.log('Navigation exploration error:', err.message);
      }
    }

  } catch (err) {
    console.error('Fatal error:', err.message);
  }

  // Save results
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'crawl_results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\n\nResults saved to crawl_results.json');
  console.log('Screenshots saved to', SCREENSHOT_DIR);

  await browser.close();
}

run().catch(console.error);
