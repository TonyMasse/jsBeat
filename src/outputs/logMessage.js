const LumberjackClient = require('lumberjack-client');
const os = require('os');

// Get Lumberjack config
const fs = require('fs');
const path = require('path');

const lumberjackConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'lumberjack.json'), 'utf8'));

const client = new LumberjackClient({
  host: (lumberjackConfig && lumberjackConfig.host && lumberjackConfig.host.length ? lumberjackConfig.host : 'localhost'),
  port: (lumberjackConfig && lumberjackConfig.port && lumberjackConfig.port.length ? lumberjackConfig.port : 5044),
})

function logMessage (message, deviceType, filterHelpers, sendExtraHostInfo) {
  // message is the Object or String to push to the Open Collector
  // deviceType is an optional String giving the specific of the device type (for example "myApp", "NetworkMonitor", "Mistnet", etc...)
  // filterHelpers is an optional Object used by the Open Collector filter to include or exclude the message (for example: { filter_abc: true, filter_xyz: false } )
  // sendExtraHostInfo is an optional Boolean used to decide if we should send extra info about the Host / OS as well

  if (message !== undefined) {
    // console.log('🌠');
    client.log(
      {
        '@timestamp': new Date(),
        '@metadata': {
          beat: process.env.npm_package_name,
          version: process.env.npm_package_version,
          device_type: deviceType,
          filter_helpers: filterHelpers
        },
        host: {
          hostname: os.hostname(),
          os: (sendExtraHostInfo ? {
            platform: os.platform(),
            release: os.release(),
            version: os.version()
          } : undefined)
        },
        message: message
      }
    )
  }
}

// Some examples of use:
// logMessage('1: Hello World');
// // { "@metadata": { "beat": "jsbeat", "version": "1.0.0" }, "@timestamp": "2021-06-14T21:04:02.192Z", "host": { "hostname": "ip-192-168-100-12.eu-west-1.compute.internal" }, "message": "1: Hello World" }
// logMessage(); // << this will NOT log anything
// logMessage(''); // << this neither
// logMessage('3: Whoopsy!');
// // { "@metadata": { "beat": "jsbeat", "version": "1.0.0" }, "@timestamp": "2021-06-14T21:04:02.192Z", "host": { "hostname": "ip-192-168-100-12.eu-west-1.compute.internal" }, "message": "3: Whoopsy!" }
// logMessage({ id: 4, abc: 'DEF' });
// // { "@metadata": { "beat": "jsbeat", "version": "1.0.0" }, "@timestamp": "2021-06-14T21:02:58.275Z", "host": { "hostname": "ip-192-168-100-12.eu-west-1.compute.internal" }, "message": { "abc": "DEF", "id": 4 } }
// logMessage('5: Daisy!');
// // { "@metadata": { "beat": "jsbeat", "version": "1.0.0" }, "@timestamp": "2021-06-14T21:02:58.275Z", "host": { "hostname": "ip-192-168-100-12.eu-west-1.compute.internal" }, "message": "5: Daisy!" }
// logMessage('6: Daisy!', 'myApp');
// // { "@metadata": { "beat": "jsbeat", "device_type": "myApp", "version": "1.0.0" }, "@timestamp": "2021-06-14T21:02:58.275Z", "host": { "hostname": "ip-192-168-100-12.eu-west-1.compute.internal" }, "message": "6: Daisy!" }
// logMessage('7: Daisy!', 'myApp', { doggy: 'Good boy', filter_xyz: true });
// // { "@metadata": { "beat": "jsbeat", "device_type": "myApp", "filter_helpers": { "doggy": "Good boy", "filter_xyz": true }, "version": "1.0.0" }, "@timestamp": "2021-06-14T21:04:02.192Z", "host": { "hostname": "ip-192-168-100-12.eu-west-1.compute.internal" }, "message": "7: Daisy!" }

module.exports = {
  logMessage
}