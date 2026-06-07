import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
      console.log('PAGE LOG:', msg.type(), msg.text());
  });
  page.on('pageerror', (error: any) => {
      console.log('PAGE ERROR (pageerror):', error.message);
  });
  
  console.log("Navigating...");
  await page.goto('http://localhost:3000');
  console.log("Waiting for #root > div");
  try {
      await page.waitForSelector('#root > div', {timeout: 15000});
      console.log("Found #root > div");
  } catch (e) {
      console.log("Timeout waiting for #root > div");
  }
  const html = await page.evaluate(() => document.getElementById('root').innerHTML);
  console.log("ROOT HTML LENGTH:", html.length);
  await browser.close();
})();
