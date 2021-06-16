'use strict';
const Tail = require('tail').Tail;

class FlatFileReaderTail {

  constructor(config, loggerFunction) {
    // config: object containing these params:
    // - path: string. Full path to the log file to tail. Must be non-empty.
    // - autoStart: boolean. If false, it will only create the object and wait for start() to be called. Otherwise (default) it will try to start capturing the data immediately.
    // - printToConsole: boolean. If true, it will print out to the Console, as well as to the Open Collector.
    // - sendToOpenCollector: boolean. If true, will push to Open Collector via Lumberjack.
    // - deviceType: string. The name of the Device Type, to pass onto the Open Collector Pipeline.
    // - filterHelpers: object. A set of flags/strings/objects to help the JQ filter of the Open Collector Pipeline to trigger on.

    Object.assign(this, {
      config: { ...config },
      state: {
        hasFailedToUseLogger: false
        // Ideally we would need file position too, but we are starting with a crude version for now
      }
    })

    if (loggerFunction) {
      this.use(loggerFunction);
    }

    if (config.autoStart !== false) {
      this.start();
    }
  } // constructor

  use (loggerFunction) {
    // loggerFunction must have the following parameters:
    // (message, deviceType, filterHelpers)
    // - message is the Object or String to push to the Open Collector
    // - deviceType is an optional String giving the specific of the device type (for example "myApp", "NetworkMonitor", "Mistnet", etc...)
    // - filterHelpers is an optional Object used by the Open Collector filter to include or exclude the message (for example: { filter_abc: true, filter_xyz: false } )
    if (loggerFunction && typeof loggerFunction === 'function') {
      this.loggerFunction = loggerFunction
    } else {
      const err = new Error('loggerFunction must be a valid function.')
      console.error(err);
    }
  } // use

  start () {
    if (this.config.path && this.config.path.length) {
      if (this.loggerFunction && typeof this.loggerFunction === 'function') {
        try {
          this.tail = new Tail(this.config.path);

          this.tail.on("line", this.onTailLineEvent.bind(this));

          this.tail.on("error", function (error) {
            console.log('ERROR: ', error);
          });

        } catch (err) {
          console.error(err);
        }
      } else {
        const err = new Error('loggerFunction must be a valid function.')
        console.error(err);
      }
    } else {
      const err = new Error('path must be a non empty string.')
      console.error(err);
    }
  } // start

  onTailLineEvent (data) {
    if (this.config.printToConsole === true) {
      console.log(data);
    }
    if (this.config.sendToOpenCollector === true) {
      try {
        this.loggerFunction(data, this.config.deviceType, this.config.filterHelpers);
      } catch (err) {
        // Fails once with an error, then silently
        if (this.state.hasFailedToUseLogger !== true) {
          this.state.hasFailedToUseLogger = true;
          const err = new Error('Failed to send line to Open Collector via Lumberjack.')
          console.log('ERROR: ', err);
        }
      }
    }
  }
}


module.exports = {
  FlatFileReaderTail
};