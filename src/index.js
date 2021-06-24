// To read config files
const fs = require('fs');
const path = require('path');

// Load the System Logging functions
const { getLevelToInt, logToSystem } = require('./systemLogging');

// Load the Configuration readers
const { jsBeatRoot, commandArgs, readMainConfig, readInputsConfig } = require('./configReaders');

// Load the main configuration (typically config/jsBeat.json)
const mainConfig = readMainConfig();
process.env.mainConfig = mainConfig;

// Bring in the Log Level as an integer
process.env.logLevel = getLevelToInt(mainConfig.logLevel);
process.env.logForceToConsole = true; // XXXX

// Storing the base directory name of the process, to be used elsewere while loading configuration and other files
// The reason for this is that once packed, all these calls are made from the very same file, so __dirname of source 
// files in sub-directories don't reflect the __dirname once packed.
process.env.baseDirname = jsBeatRoot;

// Load the logMessage function to push messages via Lumberjack to Open Collector
const { logMessage } = require('./outputs/logMessage');
const { FlatFileReaderTail } = require('./inputs/flatFileTail');
const { FlatFileReader } = require('./inputs/flatFile');

// Log that we are starting
logToSystem('Information', 'Beat Started', true);
logMessage(
  'Beat Started', // message
  'Heartbeat', // deviceType
  { // filterHelpers
    heartbeat: true,
    activity: 'Starting'
  }, 
  true // sendExtraHostInfo
)
// Setting up Heatbeat
var heartBeatInterval = setInterval(function () {
  logToSystem('Information', '💖 - Heartbeat', true);
  logMessage(
    'Heartbeat - 💖', // message
    'Heartbeat', // deviceType
    { // filterHelpers
      heartbeat: true
    }, 
    true // sendExtraHostInfo
  )
}, 60000);

// List of the active Inputs and Outputs
const inputs = [];
const outputs = [];

// Get Inputs config
// const inputConfig = JSON.parse(fs.readFileSync(path.join(process.env.baseDirname, 'config', 'inputs.json'), 'utf8'));
const inputConfig = readInputsConfig(mainConfig.inputsConfigFilePath, mainConfig.inputsConfigFilesDirectoryPath);

// Build Inputs from config
if (inputConfig && Array.isArray(inputConfig)) {
  inputConfig.forEach((input) => {
    if (input.log_source_type) {
      const logSourceTypeLowerCase = String(input.log_source_type).toLowerCase()

      if (input.uid && input.uid.length) {

        // Flat File
        if (logSourceTypeLowerCase === 'flatfile') {
          if (input.baseDirectoryPath && input.baseDirectoryPath.length) {
            const deviceType = (input.device_type && input.device_type.length ? input.device_type : undefined)
            inputs.push(
              {
                type: 'flatFile',
                name: deviceType || input.baseDirectoryPath,
                // handler: new FlatFileReaderTail({
                handler: new FlatFileReader({
                  uid: input.uid,
                  path: input.baseDirectoryPath, // Backward compatibility with FlatFileReaderTail
                  baseDirectoryPath: input.baseDirectoryPath, // Going forward, with FlatFileReader
                  inclusionFilter: input.inclusionFilter || '*',
                  exclusionFilter: input.exclusionFilter,
                  recursionDepth: input.recursionDepth,
                  daysToWatchModifiedFiles: input.daysToWatchModifiedFiles,
                  compressionType: input.compressionType,
                  multiLines: input.multiLines,
                  frequency_in_seconds: input.frequency_in_seconds,

                  autoStart: true,
                  printToConsole: input.printToConsole || input.printOnlyToConsole,
                  sendToOpenCollector: !(input.printOnlyToConsole === true),
                  deviceType,
                  filterHelpers: {
                    ...input.filter_helpers,
                    flatFile: true,
                    filePath: input.baseDirectoryPath,
                    logSourceType: 'Flat File'
                  },

                  statesBaseDirectory: mainConfig.stateDirectoryPath
                },
                logMessage)
              }
            )
          } else {
            logToSystem('Warning', 'Flat File Log Source definition is missing baseDirectoryPath. Skipping.', true);
          }
        } // Flat File

      } else {
        logToSystem('Warning', 'Log Source definition is missing uid. Skipping.', true);
    }
    } else {
      logToSystem('Warning', 'Log Source definition is missing log_source_type. Skipping.', true);
    }
  })
} else {
  logToSystem('Error', 'inputs.json must contain an array of Log Source definitions.', true);
}


// // Get command line params
// const commandArgs = process.argv.slice(2);

// if (commandArgs && commandArgs[0] && commandArgs[0].length) {
//   console.log('Tailing: ' + commandArgs[0] + '...');

//   const deviceType = (commandArgs[1] && commandArgs[1].length ? commandArgs[1] : undefined)

//   inputs.push({
//     type: 'flatFile',
//     name: deviceType || commandArgs[0],
//     handler: new FlatFileReaderTail({
//       path: commandArgs[0], // Backward compatibility with FlatFileReaderTail
//       baseDirectoryPath: commandArgs[0], // Going forward, with FlatFileReader
//       autoStart: true,
//       printToConsole: true,
//       deviceType,
//       filterHelpers: {
//         flatFile: true,
//         filePath: commandArgs[0],
//         logSourceType: 'Flat File'
//       }
//     },
//     logMessage)
//   });
// }

// console.log('Input:', inputs);
logToSystem('Debug', 'Input:', true);
logToSystem('Debug', inputs, true);

// console.log(commandArgs)
