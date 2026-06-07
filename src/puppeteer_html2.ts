import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', {waitUntil: 'networkidle0'});
  const content = await page.content();
  console.log(content.indexOf('id="root"'));
  console.log(content.substring(content.indexOf('id="root"') - 50, content.indexOf('id="root"') + 500));
  await browser.close();
})();
