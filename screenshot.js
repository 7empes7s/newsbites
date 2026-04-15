/* eslint-disable @typescript-eslint/no-require-imports */
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667 });
  
  console.log('Navigating to https://news.techinsiderbytes.com/finance...');
  await page.goto('https://news.techinsiderbytes.com/finance', { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });
  
  console.log('Taking screenshot...');
  await page.screenshot({ 
    path: '/opt/newsbites/finance-mobile-test.png',
    fullPage: false
  });
  
  // Check for console errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await browser.close();
  console.log('Screenshot saved to /opt/newsbites/finance-mobile-test.png');
  
  if (errors.length > 0) {
    console.log('Errors encountered:', errors);
  }
})();