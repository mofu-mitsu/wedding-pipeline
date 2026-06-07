import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('requestfailed', request => console.log('Req Failed:', request.url(), request.failure()?.errorText));
  
  await page.goto('http://localhost:3000', {waitUntil: 'networkidle0'});
  await browser.close();
})();
