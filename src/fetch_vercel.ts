import https from 'https';

https.get('https://wedding-pipeline.vercel.app/', (res) => {
  let data = '';
  res.on('data', (d) => {
    data += d;
  });
  res.on('end', () => {
    console.log("HTML START");
    console.log(data);
    console.log("HTML END");
  });
}).on('error', (e) => {
  console.error(e);
});
