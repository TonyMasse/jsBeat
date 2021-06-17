'use strict';
const fs = require('fs-extra')
const path = require('path')

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
        collectionCycleStillOngoing: false, // Is a Collection Cycle already running?
        currentCollectionCycleStartedAt: 0,
        stillPruningState: false, // Are we still Pruning?
        currentPruningStateStartedAt: 0,
        positions: new Map() // File position and other stats
      },
      statistics: {
        directoriesScanned: 0, // Directories we crawled into
        directoriesSkipped: 0, // Directorues we skipped (out of depth, for example)
        entriesErrored: 0, // File/Directory entry we could not get stats about
        filesDetected: 0, // File that we detected
        filesCollected: 0, // File that we collected data from,
        collectionCycleDurations: [], // Array of Cycle durations, in milliseconds
        collectionCycleDurationAverage: 0, // Average Cycle duration, in milliseconds
        collectionCyclesDone: 0, // Total number of completed Cycle
        collectionCyclesSkipped: 0, // Total number of Cycle skipped due to still runing previous Cycle
        collectionCyclesSkippedSinceLastCompleted: 0 // Number of Cycle skipped due to still runing previous Cycle, since the last completed Cycle
      },
      collectionCycleInterval: null, // ID of the Collection Cycle job set by setInterval
      pruningStateInterval: null // ID of the Pruning State job set by setInterval
    })

    // Set frequency_in_seconds to 30 seconds by default
    if (!this.config.frequency_in_seconds || (this.config.frequency_in_seconds && this.config.frequency_in_seconds <= 0)) {
      this.config.frequency_in_seconds = 30
    }

    // Set recursionDepth to 5 by default
    if (!this.config.recursionDepth || (this.config.recursionDepth && this.config.recursionDepth <= 0)) {
      this.config.recursionDepth = 5
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
        // Prepare inclusion and exclusion filters Regexes
        if (String(this.config.inclusionFilter).startsWith('Regex::')) {
          // Strip "Regex::" out
          this.config.inclusionFilterRegex = this.config.inclusionFilter.substring(7);
        } else {
          // Transform File System style filter to Regex
          this.config.inclusionFilterRegex = String(this.config.inclusionFilter)
            .replace(/\./g, '\\.') // Escape dots
            .replace(/\?/g, '.') // A single char
            .replace(/\*/g, '.*') // Anything

          if (!String(this.config.inclusionFilterRegex).startsWith('^')) {
            this.config.inclusionFilterRegex = '^' + this.config.inclusionFilterRegex
          }
          if (!String(this.config.inclusionFilterRegex).endsWith('$')) {
            this.config.inclusionFilterRegex = this.config.inclusionFilterRegex + '$'
          }

          // So:
          // *.txt => ^.*\.txt$
          // log_file.* => ^log_file\..*$
          // log_file_num_???.log => ^log_file_num_...\.log$
          // *.* => ^.*\..*$
          // * => ^.*$
        }

        if (this.config.exclusionFilter && this.config.exclusionFilter.length) {
          if (String(this.config.exclusionFilter).startsWith('Regex::')) {
            // Strip "Regex::" out
            this.config.exclusionFilterRegex = this.config.exclusionFilter.substring(7);
          } else {
            // Transform File System style filter to Regex
            this.config.exclusionFilterRegex = String(this.config.exclusionFilter)
              .replace(/\./g, '\\.') // Escape dots
              .replace(/\?/g, '.') // A single char
              .replace(/\*/g, '.*') // Anything

            if (!String(this.config.exclusionFilterRegex).startsWith('^')) {
              this.config.exclusionFilterRegex = '^' + this.config.exclusionFilterRegex
            }
            if (!String(this.config.exclusionFilterRegex).endsWith('$')) {
              this.config.exclusionFilterRegex = this.config.exclusionFilterRegex + '$'
            }
          }
        } // If none, simply leave this.config.exclusionFilterRegex as undefined

        if (this.config.inclusionFilterRegex && this.config.inclusionFilterRegex.length) {
          if (this.loggerFunction && typeof this.loggerFunction === 'function') {
            try {
              // Schedule State Pruning
              this.pruningStateInterval = setInterval(pruneState.bind(this), 86400000); // Daily
              // Schedule Crawling Cycle
              this.collectionCycleInterval = setInterval(collectionCycle.bind(this), this.config.frequency_in_seconds * 1000);
              // Start first Crawling Cycle
              setTimeout(collectionCycle.bind(this))
              // collectionCycle.call(this)
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

function collectionCycle() {
  if (this.collectionCycleStillOngoing) {
    this.statistics.collectionCyclesSkipped++;
    this.statistics.collectionCyclesSkippedSinceLastCompleted++;
    console.log('🔎 - Collection Cycle still ongoing... Doing nothing. (Been collecting for ' + ((Date.now() - this.currentCollectionCycleStartedAt)/1000) + ' seconds // Number of times we skipped since last complete Cycle: ' + this.statistics.collectionCyclesSkippedSinceLastCompleted + ')');
  } else {
    try {
      this.collectionCycleStillOngoing = true;
      this.currentCollectionCycleStartedAt = Date.now();
      // console.log('🔎 - Start Collection Cycle!');
      console.log('🔎 - Start Collection Cycle!');
      // Let's get cracking!
      this.statistics.directoriesScanned = 0;
      this.statistics.directoriesSkipped = 0;
      this.statistics.entriesErrored = 0;
      crawl.call(this, this.config.baseDirectoryPath, 0);
    } catch (err) {
      console.log(err);
    } finally {
      // Update statistics
      // First calculate the time this Cycle took, and store it in an array (of max 50 cycles) to calculate average
      const timeTakenMs = (Date.now() - this.currentCollectionCycleStartedAt);
      this.statistics.collectionCycleDurations.push(timeTakenMs);
      if (this.statistics.collectionCycleDurations.length > 0) {
        this.statistics.collectionCycleDurationAverage = 
          this.statistics.collectionCycleDurations.reduce((sum, duration) => sum += duration) /
          this.statistics.collectionCycleDurations.length
      }
      // Increment the Cycle counter
      this.statistics.collectionCyclesDone++;

      console.log(
        '🔎 - Stats: ' +
        ' // Directories Scanned: ' + this.statistics.directoriesScanned +
        ' // Directories Skipped: ' + this.statistics.directoriesSkipped +
        ' // Entities Errored: ' + this.statistics.entriesErrored +
        ' // Files Detected: ' + this.statistics.filesDetected +
        ' // Files Collected: ' + this.statistics.filesCollected
      );

      console.log('🔎 - Collection Cycle finished... (Took ' + (timeTakenMs / 1000) + ' seconds // Average is ' + (this.statistics.collectionCycleDurationAverage / 1000) + ' seconds)');
      this.statistics.collectionCyclesSkippedSinceLastCompleted = 0;
      this.collectionCycleStillOngoing = false;
    }
  }
}

function crawl(directory, depth) {
  try {
    // console.log(String('').padStart(depth, ' ') + '🦔 - crawler entering directory: (' + depth + ') ' + directory);

    // Bail out if sent to a phony directory
    if (!fs.existsSync(directory)) {
      return;
    }

    // Double check we are actually dealing with a directory
    let dirStats = fs.statSync(directory);
    if (dirStats.isDirectory()) {
      this.statistics.directoriesScanned++;
      fs.readdirSync(directory).forEach((entry) => {
        try {
          let entryFullPath = path.join(directory, entry);
  
          let entryStats = fs.statSync(entryFullPath);
  
          // Oh look! A sub-directory, let's stick our nose in there too.
          if (entryStats.isDirectory()) {
            // Crawl deeper... If allowed by config.recursionDepth
            if (depth < this.config.recursionDepth) {
              crawl.call(this, entryFullPath, depth + 1);
            } else {
              // Out of depth
              const err = Error('Maximum recursion depth reached (' + (depth + 1) + '). Not going any deeper.');
              // console.log(err); // This is way too frequent to log
              this.statistics.directoriesSkipped++
            }
          } else if (entryStats.isFile()) {
            // Check if file matches the inclusing Regex
            if (String(entry).match(this.config.inclusionFilterRegex)) {
              // And if it does't our exclusion Regex
              if (!this.config.exclusionFilterRegex || (this.config.exclusionFilterRegex && !String(entry).match(this.config.exclusionFilterRegex))) {
                console.log('🦔 - processing: ' + entry);
                const previousStats = this.state.positions.get(entryFullPath)
                if (previousStats) {
                  // Existing File
                  // Compare the Stats
                  if (entryStats.size > previousStats.size) {
                    // The file grew since last check
                    // Let's gather new data
                    console.log('🦔 - 🟩 - File grew');
                    collectMessagesFromFile.call(this, entryFullPath, previousStats.size, entryStats.size);
                  } else if (entryStats.size < previousStats.size) {
                    // Size shrunk, indicating a fresh new content
                    // Let's gather full file content
                    console.log('🦔 - 🟦 - New content');
                    collectMessagesFromFile.call(this, entryFullPath, 0, entryStats.size);
                  } else {
                    console.log('🦔 - ⬛ - Same file');
                  }
                  this.state.positions.set(entryFullPath, entryStats)
                } else {
                  // New file
                  this.state.positions.set(entryFullPath, entryStats)
                  // Let's gather full file content
                  console.log('🦔 - 🆕 - New file');
                  collectMessagesFromFile.call(this, entryFullPath, 0, entryStats.size);
                }
              }
            }
          }

        } catch (err) {
          // Fails silently
          this.statistics.entriesErrored++
        }
      })
    } else {
      const err = Error('"' + directory + '" is not a valid directory. Not crawling through it.');
      console.log(err);
    }

  } catch (err) {
    console.log(err);
  } finally {
    //
  }
}

function collectMessagesFromFile(fileFullPath, fromByte, toByte) {
  if (fileFullPath && fileFullPath.length && fromByte >= 0 && toByte > fromByte) {
    console.log('🚀 - collectMessagesFromFile "' + fileFullPath + '" from Byte: ' + fromByte + ' to Byte: ' + toByte);
    console.log(this.config.compressionType);
  }
  //
}

function pruneState() {
  if (this.stillPruningState) {
    console.log('🌳 - Still Pruning State. Doing nothing. (Been pruning for ' + ((Date.now() - this.currentPruningStateStartedAt) / 1000) + ' seconds)');
  } else {
    try {
      this.stillPruningState = true;
      this.currentPruningStateStartedAt = Date.now();
      console.log('🌳 - Start Pruning State!');
      // Let's get cracking!
      // Code here
    } catch (err) {
      console.log(err);
    } finally {
      this.stillPruningState = false;
    }
  }

}

module.exports = {
  FlatFileReader
};