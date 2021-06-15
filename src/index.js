// Load the logMessage function to push messages via Lumberjack to Open Collector
const { logMessage } = require('./outputs/logMessage');
const { FlatFileReader } = require('./inputs/flatFile');

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