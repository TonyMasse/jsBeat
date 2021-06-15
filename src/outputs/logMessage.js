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

function logMessage (message, deviceType, filterHelpers) {
  // message is the Object or String to push to the Open Collector
  // deviceType is an optional String giving the specific of the device type (for example "myApp", "NetworkMonitor", "Mistnet", etc...)
  // filterHelpers is an optional Object used by the Open Collector filter to include or exclude the message (for example: { filter_abc: true, filter_xyz: false } )

  if (message) {
    console.log('🌠');
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
        },
        message: message,
      }
    )
  }
}

module.exports = {
  logMessage
}