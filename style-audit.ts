import { chromium } from '@playwright/test';

async function auditStyles() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Check if CSS files are loaded
  console.log('\n=== CSS FILES LOADED ===');
  const stylesheets = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    return links.map(link => (link as HTMLLinkElement).href);
  });
  console.log('Stylesheets:', stylesheets);

  // Check computed styles on key elements
  console.log('\n=== SIDEBAR STYLES ===');
  const sidebarStyles = await page.evaluate(() => {
    const sidebar = document.querySelector('[data-testid="sidebar"]') ||
                    document.querySelector('aside') ||
                    document.querySelector('.bg-sidebar');
    if (!sidebar) return { error: 'Sidebar not found' };
    const computed = window.getComputedStyle(sidebar);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      width: computed.width,
      classes: sidebar.className,
    };
  });
  console.log('Sidebar:', JSON.stringify(sidebarStyles, null, 2));

  // Check CSS variables
  console.log('\n=== CSS VARIABLES ===');
  const cssVars = await page.evaluate(() => {
    const root = document.documentElement;
    const computed = window.getComputedStyle(root);
    return {
      '--sidebar': computed.getPropertyValue('--sidebar'),
      '--background': computed.getPropertyValue('--background'),
      '--primary': computed.getPropertyValue('--primary'),
      '--primary-600': computed.getPropertyValue('--primary-600'),
      '--card': computed.getPropertyValue('--card'),
      '--border': computed.getPropertyValue('--border'),
      '--muted': computed.getPropertyValue('--muted'),
    };
  });
  console.log('CSS Variables:', JSON.stringify(cssVars, null, 2));

  // Check body styles
  console.log('\n=== BODY STYLES ===');
  const bodyStyles = await page.evaluate(() => {
    const body = document.body;
    const computed = window.getComputedStyle(body);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontFamily: computed.fontFamily,
    };
  });
  console.log('Body:', JSON.stringify(bodyStyles, null, 2));

  // Check a card element
  console.log('\n=== CARD STYLES ===');
  const cardStyles = await page.evaluate(() => {
    const card = document.querySelector('.bg-card') ||
                 document.querySelector('[class*="card"]');
    if (!card) return { error: 'Card not found' };
    const computed = window.getComputedStyle(card);
    return {
      backgroundColor: computed.backgroundColor,
      borderColor: computed.borderColor,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      classes: card.className,
    };
  });
  console.log('Card:', JSON.stringify(cardStyles, null, 2));

  // Check active nav item (Dashboard)
  console.log('\n=== ACTIVE NAV ITEM ===');
  const navStyles = await page.evaluate(() => {
    const activeNav = document.querySelector('[data-testid*="dashboard"]') ||
                      document.querySelector('a[href="/"]') ||
                      document.querySelector('.bg-primary');
    if (!activeNav) return { error: 'Active nav not found' };
    const computed = window.getComputedStyle(activeNav);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      classes: activeNav.className,
    };
  });
  console.log('Active Nav:', JSON.stringify(navStyles, null, 2));

  // Check for any console errors
  console.log('\n=== CONSOLE ERRORS ===');
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // Take a screenshot for reference
  await page.screenshot({ path: '/tmp/style-audit-screenshot.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/style-audit-screenshot.png');

  await browser.close();
}

auditStyles().catch(console.error);
