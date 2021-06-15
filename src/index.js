// Load the logMessage function to push messages via Lumberjack to Open Collector
const { logMessage } = require('./outputs/logMessage');
const { FlatFileReader } = require('./inputs/flatFile');
// To read config files
const fs = require('fs');
const path = require('path');


// Get command line params
const commandArgs = process.argv.slice(2);

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

// List of the active Inputs and Outputs
const inputs = [];
const outputs = [];

// Get Inputs config
const inputConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'log_sources.json'), 'utf8'));

// Build Inputs from config
if (inputConfig && Array.isArray(inputConfig)) {
  inputConfig.forEach((input) => {
    if (input.log_source_type) {
      const logSourceTypeLowerCase = String(input.log_source_type).toLowerCase()

      // Flat File
      if (logSourceTypeLowerCase === 'flatfile') {
        if (input.filePath && input.filePath.length) {
          const deviceType = (input.device_type && input.device_type.length ? input.device_type : undefined)
          inputs.push(
            {
              type: 'flatFile',
              name: deviceType || input.filePath,
              handler: new FlatFileReader({
                path: input.filePath,
                autoStart: true,
                printToConsole: input.printToConsole || input.printOnlyToConsole,
                sendToOpenCollector: !(input.printOnlyToConsole === true),
                deviceType,
                filterHelpers: {
                  flatFile: true,
                  filePath: input.filePath,
                  logSourceType: 'Flat File'
                }
              },
              logMessage)
            }
          )
        } else {
          console.log('WARNING: Flat File Log Source definition is missing filePath. Skipping.');
        }
      } // Flat File

    } else {
      console.log('WARNING: Log Source definition is missing log_source_type. Skipping.');
    }
  })
} else {
  console.log('ERROR: log_sources.json must contain an array of Log Source definitions.');
}

if (commandArgs && commandArgs[0] && commandArgs[0].length) {
  console.log('Tailing: ' + commandArgs[0] + '...');

  const deviceType = (commandArgs[1] && commandArgs[1].length ? commandArgs[1] : undefined)

  inputs.push({
    type: 'flatFile',
    name: deviceType || commandArgs[0],
    handler: new FlatFileReader({
      path: commandArgs[0],
      autoStart: true,
      printToConsole: true,
      deviceType,
      filterHelpers: {
        flatFile: true,
        filePath: commandArgs[0],
        logSourceType: 'Flat File'
      }
    },
    logMessage)
  });
}

console.log('Input:');
console.log(inputs);