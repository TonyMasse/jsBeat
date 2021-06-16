const https = require('https');
const fs = require('fs');
const path = require('path');

// *******************************
//           NOT USED
// *******************************
// Poking around only
// *******************************

async function getData () {
  let returnData = '';
  console.log('🎉 getData...');
  
  // Use the following commands to produce the PEM files from the Mistnet issued .p12 file:
  // openssl pkcs12 -in 0000-abcdef.p12 -out https.cert.pem -clcerts -nokeys
  // openssl pkcs12 -in 0000-abcdef.p12 -out https.key.pem -nocerts -nodes

  const httpsKey = fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'https.key.pem'));
  const httpsCert = fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'https.cert.pem'));
  
  console.log(' - 🎁 - 0');
  
  const options = {
    hostname: 'api.mistnet.io',
    port: 443,
    path: '/api/v1/customer/customer-cases/_search',
    method: 'GET',
    key: httpsKey,
    cert: httpsCert,
    agent: false
  };

  console.log(' - 🎁 - 1');

  const req = await https.request(options, (res) => {
    console.log('🤞 Call back:');
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);

    res.on('data', (d) => {
      process.stdout.write(d);
    });
  });

  console.log(' - 🎁 - 2');

  req.on('error', (e) => {
    console.log('😢 Error:');
    console.error(e);
  });

  console.log(' - 🎁 - 3');

  req.end();

  console.log(' - 🎁 - 4');

  console.log('👍 getData.');
  return returnData;
}


getData()
  .then((data) => {
    console.log('Data: ' + data);
  })
  .catch((err) => {
    console.error('Problem:')
    console.error(err)
  })