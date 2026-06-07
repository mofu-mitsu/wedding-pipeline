import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', {waitUntil: 'networkidle0'});
  const content = await page.content();
  console.log(content.substring(0, 1000));
  await browser.close();
})();
