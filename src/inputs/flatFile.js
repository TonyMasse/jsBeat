'use strict';
const fs = require('fs-extra')
const path = require('path')
const uuid = require('uuid-random');

// This version is to use the home made algo, as the Tail is too simplistic
// See README.md for details and progress

class FlatFileReader {

  constructor(config, loggerFunction) {
    // config: object containing these params:
    // - uid: string. UID of the Log Source / data stream. If none provided, one will be generated.
    // - name: string. Optional user friendly name for the Log Source / data stream.
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
        positions: new Map(), // File position and other stats
        fullStateFilePath: '' // Is defined a few lines of code further, as it requires a valid UID
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

    // Create a UID if none provided
    if ((this.config.uid === undefined) || (this.config.uid && !this.config.uid.length)) {
      this.config.uid = uuid();
    }

    // Set frequency_in_seconds to 30 seconds by default
    if (!this.config.frequency_in_seconds || (this.config.frequency_in_seconds && this.config.frequency_in_seconds <= 0)) {
      this.config.frequency_in_seconds = 30;
    }

    // Set recursionDepth to 5 by default
    if ((this.config.recursionDepth === undefined) || (this.config.recursionDepth && this.config.recursionDepth < 0)) {
      this.config.recursionDepth = 5;
    }

    // Prep State file path
    this.state.fullStateFilePath = path.join(process.env.PWD, 'states', 'state.' + this.config.uid + '.json');

    // Call use() to add the loggerFunction if already provided
    if (loggerFunction) {
      this.use(loggerFunction);
    }

    // And kick it all off, if set to autoStart
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
    if (this.config.uid && this.config.uid.length) {
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

          // Prepare log message selection Regex
          // 1. multi-line separator (exclusive)
          // 2. multi-line start (inclusive)
          // 3. multi-line end (inclusive)
          // 4. EOL (exclusive)

          this.config.logMessageSelectionRegex = ''
            // Look for potential multi-line Separator at the beginning, without capturing it
            + (this.config.multiLines && this.config.multiLines.msgDelimiterRegex !== undefined && this.config.multiLines.msgDelimiterRegex.length ? '(?:' + this.config.multiLines.msgDelimiterRegex + ')?' : '')
            + '('
            // Look for the multi-line Start, capturing it
            + (this.config.multiLines && this.config.multiLines.msgStartRegex !== undefined && this.config.multiLines.msgStartRegex.length ? '(?:' + this.config.multiLines.msgStartRegex + ')' : '')
            // The log message itself
            + '.*?'
            // Look for the multi-line Stop, capturing it
            + (this.config.multiLines && this.config.multiLines.msgStopRegex !== undefined && this.config.multiLines.msgStopRegex.length ? '(?:' + this.config.multiLines.msgStopRegex + ')' : '')
            + ')'
            // Look for the multi-line Separator at the end, without capturing it. If none defined, use EOL
            + (this.config.multiLines && this.config.multiLines.msgDelimiterRegex !== undefined && this.config.multiLines.msgDelimiterRegex.length ? '(?:' + this.config.multiLines.msgDelimiterRegex + ')' : '[\r]{0,1}\n')
          ;

          // Print out configuration
          console.log('Running configuration:');
          console.log(this.config);
          // Print out state
          console.log('Running state:');
          console.log(this.state);

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
    } else {
      const err = new Error('uid must be a non empty string and must be unique to this log source / stream.')
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
      this.statistics.filesDetected = 0;
      this.statistics.filesCollected = 0;
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

      // Persist State to disk
      persistState.call(this);

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
                // console.log('🦔 - processing: ' + entry);
                this.statistics.filesDetected++;
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
    try {
      console.log('🚀 - Collect messages from file: "' + fileFullPath + '" from Byte: ' + fromByte + ' to Byte: ' + toByte);
      this.statistics.filesCollected++;
      if (this.config.compressionType && this.config.compressionType.length) {
        // Handle decompression
        console.log('🚀 - WARNING : Compression is not yet implemented.');
      }

      try {
        const fileDescriptor = fs.openSync(fileFullPath, 'r');

        const bufferSize = 5242880; // 5 Megabytes
        let buffer = new Buffer.alloc(bufferSize);
        const bytesToReadTotal = toByte - fromByte; // Bytes to read in total
        let bytesToRead = 0; // Bytes to read in one chunk
        let bytesReadTotal = 0; // Bytes read in total
        let bytesRead = 0; // Bytes read in one chunk
        let readFromByte = 0; // First byte read for the chunk
        let messageMathesCountTotal = 0; // Total number of parsed messages
        let messageMathesCount = 0; // Number of parsed messages for this chunk
        let messagePushedToOpenCollectorCountTotal = 0; // Total number of messages sent to the Open Collector
        let messagePushedToOpenCollectorCount = 0; // Number of messages sent to the Open Collector for this chunk

        let infiniteLoopBreaker = 1000; // Just to be safe :)
        while ((bytesReadTotal < bytesToReadTotal) && (infiniteLoopBreaker > 0)) {
          infiniteLoopBreaker--; // Just to be safe :)

          // Calculate how many bytes left to gather, but cap to the buffer size if needed
          bytesToRead = bytesToReadTotal - bytesReadTotal;
          if (bytesToRead > bufferSize) {
            bytesToRead = bufferSize
          }

          // Calculate starting point for this chunk
          readFromByte = fromByte + bytesReadTotal;

          // Load the goods
          bytesRead = fs.readSync(fileDescriptor, buffer, 0, bytesToRead, readFromByte);

          // Slice the buffer into log messages
          
          const bufferAsString = buffer.toString('utf8', 0, bytesRead); // Transpose to a String the bytes received (ignoring the rest of the buffer)
          messageMathesCount = 0;
          messagePushedToOpenCollectorCount = 0;
          try {
            let tempLogMessageSelectionRegex = new RegExp(
              this.config.logMessageSelectionRegex,
              // Regex Flags:
              // - g: Global search
              // - m: Multi-line search
              // - s: Allows . to match newline characters
              'gms'
              );
            let messageMatches = tempLogMessageSelectionRegex.exec(bufferAsString);
            while (messageMatches) {
              messageMathesCount++;
              // console.log('🚀 >>> ', messageMatches[1]);

              // Push the message out
              if (this.config.printToConsole === true) {
                console.log(messageMatches[1]);
              }
              if (this.config.sendToOpenCollector === true) {
                try {
                  this.loggerFunction(messageMatches[1], this.config.deviceType, { ...this.config.filterHelpers, filePath: fileFullPath });
                  messagePushedToOpenCollectorCount++;
                } catch (err) {
                  // Fails once with an error, then silently
                  if (this.state.hasFailedToUseLogger !== true) {
                    this.state.hasFailedToUseLogger = true;
                    const err = new Error('Failed to send line to Open Collector via Lumberjack.')
                    console.log('ERROR: ', err);
                  }
                }
              }

              messageMatches = tempLogMessageSelectionRegex.exec(bufferAsString);
            }
          } catch (err) {
            console.log('🚀 - 🟠 WARNING - Message parsing', err);
          } finally {
            //
          }

          // And finally update the counters
          bytesReadTotal += bytesRead;
          messageMathesCountTotal += messageMathesCount;
          messagePushedToOpenCollectorCountTotal += messagePushedToOpenCollectorCount;
        }
        if (infiniteLoopBreaker <= 0) {
          console.log('🚀 - 🟠 WARNING: Hitting the buffer on the file read loop...');
        }
        console.log('🚀 - 🔢🏁 - Stats // Bytes read: ' + bytesReadTotal + ' // Messages parsed: ' + messageMathesCountTotal + ' // Messages pushed to Open Collector: ' + messagePushedToOpenCollectorCountTotal);
      } catch (err) {
        console.log(err);
      } finally {
        try {
          fs.closeSync(fileDescriptor);
        } catch (err) {
          // fails silently
        }
      }

    } catch (err) {
      //
    }
  }
  //
}

function loadState() {
  //
}

function persistState() {
  try {
    fs.ensureFileSync(this.state.fullStateFilePath);
    fs.writeFileSync(
      this.state.fullStateFilePath,
      JSON.stringify(Array.from(this.state.positions), null, '  '),
      {
        encoding: 'utf8',
        mode: 0o640
      }
    );
  } catch (err) {
    console.log(err);
  }
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