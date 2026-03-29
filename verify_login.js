const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to https://slacked.co/login...');
  await page.goto('https://slacked.co/login', { waitUntil: 'networkidle' });

  console.log('Filling in credentials...');
  // The inputs have name="email" and name="password"
  await page.fill('input[name="email"]', 'hello@forrestwebber.com');
  await page.fill('input[name="password"]', 'A734nfhUio!!');
  
  console.log('Clicking login button...');
  // The button text is "Sign in with Email"
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button:has-text("Sign in with Email")')
  ]);

  const currentUrl = page.url();
  console.log(`Final URL: ${currentUrl}`);

  if (currentUrl.includes('/dashboard')) {
    console.log('✅ Login successful! Redirected to dashboard.');
  } else {
    console.log('❌ Login failed. Still on: ' + currentUrl);
    await page.screenshot({ path: 'login_failure.png' });
  }

  await browser.close();
})();
