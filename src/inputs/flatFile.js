'use strict';

// This version is to use the home made algo, as the Tail is too simplistic
// See README.md for details and progress

class FlatFileReader {

  constructor(config, loggerFunction) {
    // config: object containing these params:
    // - baseDirectoryPath: string. Full Base directory path to crawl to find the files matching inclusionFilter. Must be non-empty.
    // - inclusionFilter: string. If prefixed with "Regex::" then regex filter, otherwise file system type filter. Must be non-empty.
    // - exclusionFilter: string. If prefixed with "Regex::" then regex filter, otherwise file system type filter.
    // - recursionDepth: number. Maximum number of sub-directory to crawl into.
    // - daysToWatchModifiedFiles: number. Stop checking for update/growth files older than X days old. 0 means disabled (all files are checked)
    // - compressionType: string. Contains one of the compression format.
    // - multiLines: object. Branches:
    //   - msgStartRegex: string. Inclusing Regex to match the beginning of a new message.
    //   - msgStopRegex: string. Inclusing Regex to match the end of a message.
    //   - msgDelimiterRegex: string. Excluding Regex to separate two messages.
    // - autoStart: boolean. If false, it will only create the object and wait for start() to be called. Otherwise (default) it will try to start capturing the data immediately.
    // - printToConsole: boolean. If true, it will print out to the Console, as well as to the Open Collector.
    // - sendToOpenCollector: boolean. If true, will push to Open Collector via Lumberjack.
    // - deviceType: string. The name of the Device Type, to pass onto the Open Collector Pipeline.
    // - filterHelpers: object. A set of flags/strings/objects to help the JQ filter of the Open Collector Pipeline to trigger on.

    Object.assign(this, {
      config: { ...config },
      state: {
        hasFailedToUseLogger: false,
        stillCrawling: false, // Is a Crawler already running?
        currentCrawlStartedAt: 0,
        stillPruningState: false, // Are we still Pruning?
        currentPruningStateStartedAt: 0,
        positions: [] // File position
      },
      crawlInterval: null, // ID of the Crawl job set by setInterval
      pruningStateInterval: null // ID of the Pruning State job set by setInterval
    })

    // Set frequency_in_seconds to 30 seconds by default
    if (!this.config.frequency_in_seconds || (this.config.frequency_in_seconds && this.config.frequency_in_seconds <= 0)) {
      this.config.frequency_in_seconds = 30
    }

    // Call use() to add the loggerFunction if already provided
    if (loggerFunction) {
      this.use(loggerFunction);
    }

    // Annd kick it all off, if set to autoStart
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
    if (this.config.baseDirectoryPath && this.config.baseDirectoryPath.length) {
      if (this.config.inclusionFilter && this.config.inclusionFilter.length) {
        if (this.loggerFunction && typeof this.loggerFunction === 'function') {
          try {
            // Schedule State Pruning
            this.pruningStateInterval = setInterval(pruneState.bind(this), 86400000); // Daily
            // Schedule Crawling Cycle
            this.crawlInterval = setInterval(crawl.bind(this), this.config.frequency_in_seconds * 1000);
            // Start first Crawling Cycle
            crawl.call(this)
          } catch (err) {
            console.error(err);
          }
        } else {
          const err = new Error('loggerFunction must be a valid function.')
          console.error(err);
        }
      } else {
        const err = new Error('inclusionFilter must be a non empty string.' + this.config.inclusionFilter)
        console.error(err);
      }
    } else {
      const err = new Error('baseDirectoryPath must be a non empty string.')
      console.error(err);
    }
  } // start

  pushMessage (data) {
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

function crawl() {
  if (this.stillCrawling) {
    console.log('🦔 - Still Crawling. Doing nothing.');
  } else {
    this.stillCrawling = true;
    console.log('🦔 - Start Crawling!');
    this.stillCrawling = false;
  }

}

function pruneState() {
  if (this.stillPruningState) {
    console.log('🌳 - Still Pruning State. Doing nothing.');
  } else {
    this.stillPruningState = true;
    console.log('🌳 - Start Pruning State!');
    this.stillPruningState = false;
  }

}

module.exports = {
  FlatFileReader
};