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
  page.on('error', (error: any) => {
      console.log('PAGE ERROR (error):', error.message);
  });
  
  await page.goto('http://localhost:3000', {waitUntil: 'networkidle0'});
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
