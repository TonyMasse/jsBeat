const LumberjackClient = require('lumberjack-client');
const os = require('os');

// Load the System Logging functions
const { logToSystem } = require('../systemLogging');

// Get the version number from package.json
const { name, version } = require('../../package.json')

// Get Lumberjack config
const fs = require('fs');
const path = require('path');

// Bring the config file path from teh main configuration, and if not go for config/lumberjack.json
const lumberjackConfigFilePath = (
  process.env.mainConfig && process.env.mainConfig.lumberjackConfigPath && process.env.mainConfig.lumberjackConfigPath.length
    ? process.env.mainConfig.lumberjackConfigPath
    : path.join(process.env.baseDirname, 'config', 'lumberjack.json')
);

let lumberjackConfig = {};
try {
  lumberjackConfig = JSON.parse(fs.readFileSync(lumberjackConfigFilePath, 'utf8'));
} catch (err) {
  logToSystem('Warning', err.message);
}

const client = new LumberjackClient({
  host: (lumberjackConfig && lumberjackConfig.host && lumberjackConfig.host.length ? lumberjackConfig.host : 'localhost'),
  port: (lumberjackConfig && lumberjackConfig.port && lumberjackConfig.port.length ? lumberjackConfig.port : 5044),
})

function logMessage (message, deviceType, filterHelpers, sendExtraHostInfo) {
  // message is the Object or String to push to the Open Collector
  // deviceType is an optional String giving the specific of the device type (for example "myApp", "NetworkMonitor", "Mistnet", etc...)
  // filterHelpers is an optional Object used by the Open Collector filter to include or exclude the message (for example: { filter_abc: true, filter_xyz: false } )
  // sendExtraHostInfo is an optional Boolean used to decide if we should send extra info about the Host / OS as well

  if (client && message !== undefined) {
    client.log(
      {
        '@timestamp': new Date(),
        '@metadata': {
          beat: (process.env.npm_package_name || name || 'jsBeat'),
          version: (process.env.npm_package_version || version),
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

// logMessage('8: Extra OS details', 'Heartbeat', { heartbeat: true }, true);
// {"@metadata":{"beat":"jsbeat","device_type":"Heartbeat","filter_helpers":{"heartbeat":true},"version":"1.0.0"},"@timestamp":"2021-06-18T11:02:11.079Z","host":{"hostname":"oc-ez","os":{"platform":"linux","release":"3.10.0-1160.21.1.el7.x86_64","version":"#1 SMP Tue Mar 16 18:28:22 UTC 2021"}},"message":"8: Extra OS details"}


module.exports = {
  logMessage
}