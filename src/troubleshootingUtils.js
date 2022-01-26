const { promisify } = require('util')
const Inspector = require('inspector-api')

// Load the System Logging functions
const { logToSystem } = require('./systemLogging');

// Load the logMessage function to push messages via Lumberjack to Open Collector
const { logMessage } = require('./outputs/logMessage');

// Length, in ms, of the capture window
const defaultProfileRecordTime = 60000 // ms

// Use `kill -USR1 ${pid}` to get the CPU profile dump
// Dumps sould end up in /tmp/profile_*.cpuprofile
function enableCpuProfileDump(signal = 'SIGUSR1', profileRecordTime = defaultProfileRecordTime) {
  process.on(signal, async () => {
    logToSystem('Information', '🐾▶️ - Starting collecting CPU profile...', true);
    logMessage(
      `Troubleshooting - ${signal} - Starting collecting CPU profile...`, // message
      'Internal', // deviceType
      { // filterHelpers
        internal: true,
        activity: 'CPU Profile Dump'
      }, 
      true // sendExtraHostInfo
    );

    const inspector = new Inspector({ storage: { type: 'fs' } });
    await inspector.profiler.enable();
    await inspector.profiler.start();
    await promisify(setTimeout)(profileRecordTime);
    await inspector.profiler.stop();

    logToSystem('Information', '🐾💾 - CPU profile has been written.', true);
    logMessage(
      `Troubleshooting - ${signal} - CPU profile has been written`, // message
      'Internal', // deviceType
      { // filterHelpers
        internal: true,
        activity: 'CPU Profile Dump'
      }, 
      true // sendExtraHostInfo
    );

    await inspector.profiler.disable();
  });
}

// Use `kill -USR2 ${pid}` to get the Heap profile dump
// Dumps sould end up in /tmp/heapprofiler_*.heapprofile
function enableHeapProfileDump(signal = 'SIGUSR2', profileRecordTime = defaultProfileRecordTime) {
  process.on(signal, async () => {
    logToSystem('Information', '🐾▶️ - Starting collecting Heap profile...', true);
    logMessage(
      `Troubleshooting - ${signal} - Starting collecting Heap profile...`, // message
      'Internal', // deviceType
      { // filterHelpers
        internal: true,
        activity: 'CPU Profile Dump'
      }, 
      true // sendExtraHostInfo
    );

    const inspector = new Inspector({ storage: { type: 'fs' } });
    await inspector.heap.enable();
    await inspector.heap.startSampling();
    await promisify(setTimeout)(profileRecordTime);
    await inspector.heap.stopSampling();

    logToSystem('Information', '🐾💾 - Heap profile has been written.', true);
    logMessage(
      `Troubleshooting - ${signal} - Heap profile has been written`, // message
      'Internal', // deviceType
      { // filterHelpers
        internal: true,
        activity: 'Heap Profile Dump'
      }, 
      true // sendExtraHostInfo
    );

    await inspector.heap.disable();
  });
}

module.exports = {
  enableCpuProfileDump,
  enableHeapProfileDump
}
