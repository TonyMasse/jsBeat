const LumberjackClient = require('lumberjack-client');
const os = require('os');

console.log('New Client...')
const client = new LumberjackClient({
  host: 'localhost',
  // host: '192.168.0.223',
  port: 5044,
}, true)


console.log('Log...')
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

console.log('Done.')
