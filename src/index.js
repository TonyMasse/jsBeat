const LumberjackClient = require('lumberjack-client');
const os = require('os');

const client = new LumberjackClient({
  host: 'localhost',
  port: 5044,
})

function logMessage (msg) {
  if (msg) {
    client.log(
      {
        '@timestamp': new Date(),
        '@metadata': {
          beat: process.env.npm_package_name,
          version: process.env.npm_package_version
        },
        host: {
          hostname: os.hostname(),
        },
        message: msg,
      }
    )
  }
}

logMessage('1: Hello World');
logMessage();
logMessage('3: Whoopsy!');
