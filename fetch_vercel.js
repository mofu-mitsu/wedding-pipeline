const https = require('https');
https.get('https://wedding-pipeline.vercel.app/', (res) => {
  let data = '';
  res.on('data', (d) => data += d);
  res.on('end', () => console.log(data));
});
