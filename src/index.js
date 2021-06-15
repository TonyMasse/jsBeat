// Load the logMessage function to push messages via Lumberjack to Open Collector
const { logMessage } = require('./logMessage');

// Get command line params
const commandArgs = process.argv.slice(2);

logMessage('1: Hello World');
// { "@metadata": { "beat": "jsbeat", "version": "1.0.0" }, "@timestamp": "2021-06-14T21:04:02.192Z", "host": { "hostname": "ip-192-168-100-12.eu-west-1.compute.internal" }, "message": "1: Hello World" }
logMessage(); // << this will NOT log anything
logMessage(''); // << this neither
logMessage('3: Whoopsy!');
// { "@metadata": { "beat": "jsbeat", "version": "1.0.0" }, "@timestamp": "2021-06-14T21:04:02.192Z", "host": { "hostname": "ip-192-168-100-12.eu-west-1.compute.internal" }, "message": "3: Whoopsy!" }
logMessage({ id: 4, abc: 'DEF' });
// { "@metadata": { "beat": "jsbeat", "version": "1.0.0" }, "@timestamp": "2021-06-14T21:02:58.275Z", "host": { "hostname": "ip-192-168-100-12.eu-west-1.compute.internal" }, "message": { "abc": "DEF", "id": 4 } }
logMessage('5: Daisy!');
// { "@metadata": { "beat": "jsbeat", "version": "1.0.0" }, "@timestamp": "2021-06-14T21:02:58.275Z", "host": { "hostname": "ip-192-168-100-12.eu-west-1.compute.internal" }, "message": "5: Daisy!" }
logMessage('6: Daisy!', 'myApp');
// { "@metadata": { "beat": "jsbeat", "device_type": "myApp", "version": "1.0.0" }, "@timestamp": "2021-06-14T21:02:58.275Z", "host": { "hostname": "ip-192-168-100-12.eu-west-1.compute.internal" }, "message": "6: Daisy!" }
logMessage('7: Daisy!', 'myApp', { doggy: 'Good boy', filter_xyz: true });
// { "@metadata": { "beat": "jsbeat", "device_type": "myApp", "filter_helpers": { "doggy": "Good boy", "filter_xyz": true }, "version": "1.0.0" }, "@timestamp": "2021-06-14T21:04:02.192Z", "host": { "hostname": "ip-192-168-100-12.eu-west-1.compute.internal" }, "message": "7: Daisy!" }

if (commandArgs && commandArgs[0] && commandArgs[0].length) {
  console.log('Tailing: ' + commandArgs[0] + '...');

  const Tail = require('tail').Tail;

  try {
    tail = new Tail(commandArgs[0]);

    tail.on("line", function (data) {
      console.log(data);
      logMessage(data);
    });

    tail.on("error", function (error) {
      console.log('ERROR: ', error);
    });

  } catch (err) {
    console.error(err);
  }
}