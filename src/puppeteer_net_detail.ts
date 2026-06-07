import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', (err: any) => console.log('PAGE ERROR:', err.message));
  page.on('request', req => console.log('REQ:', req.url()));
  page.on('response', res => console.log('RES:', res.url(), res.status()));
  
  await page.goto('http://localhost:3000', {waitUntil: 'networkidle0'});
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
