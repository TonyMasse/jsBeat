const LumberjackClient = require('lumberjack-client');
const os = require('os');

const client = new LumberjackClient({
  // host: 'localhost',
  host: '192.168.0.223',
  port: 5044,
})

client.log(
  {
    '@timestamp': new Date(),
    '@metadata': {
      beat: 'jsbeat',
      version: '1.0.0'
    },
    host: {
        hostname: os.hostname(),
    },
    message: 'hello world',
  }
)