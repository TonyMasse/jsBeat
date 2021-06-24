// To read config files
const fs = require('fs');
const path = require('path');

// Load the System Logging functions
const { logToSystem } = require('./systemLogging');

// Get command line params
let commandArgs = {}
try {
  commandArgs = require('arguments-parser')({
    offset: 2 // offset for removing default params of node : default 2
  })
} catch (err) {
  logToSystem('Warning', 'Failed reading command lines arguments.', true);
} finally {
  if (!commandArgs || commandArgs == null) {
    commandArgs = {};
  }
}

// Define the base directory name of the process
let jsBeatRoot = path.join(__dirname, '..');

// If provided, use the path from --jsBeatRoot as jsBeatRoot
if (commandArgs.jsBeatRoot && commandArgs.jsBeatRoot.length) {
  if (fs.existsSync(commandArgs.jsBeatRoot)) {
    jsBeatRoot = commandArgs.jsBeatRoot;
  } else {
    const err = new Error(`CRITICAL: "${commandArgs.jsBeatRoot}" doesn't exist. Exiting.`);
    logToSystem('Critical', err.message, true);
    throw(err)
  }
}

// Read main configuration from jsBeat.json file
function readMainConfig() {
  const config = {
    stateDirectoryPath: "{jsBeatRoot}/states",
    inputsConfigFilePath: "{jsBeatRoot}/config/inputs.json",
    inputsConfigFilesDirectoryPath: "{jsBeatRoot}/config/inputs.d",
    lumberjackConfigPath: "{jsBeatRoot}/config/lumberjack.json",
    decompressionTemporaryRootPath: "/tmp/jsBeat/decompressedFiles",
    logFilePath: "/var/log/jsBeat",
    logLevel: "information"
  }
  let configFilePath = path.join(jsBeatRoot, 'config', 'jsBeat.json');
  let configFromFile = {};

  // Use File path provided by --jsBeatConfigFile from command line, if any
  if (commandArgs.jsBeatConfigFile && commandArgs.jsBeatConfigFile.length) {
    configFilePath = commandArgs.jsBeatConfigFile;
  }

  // Load Config from Disk
  try {
    configFromFile = readConfigFromFile(configFilePath, false, false);
  } catch (err) {
    // Fails
    logToSystem('Warning', 'Loading config from disk failed. ' + err.message, true);
  }

  // Go through each possible configuration parameter, and if one is provided from file, use it
  // Then check if it was provided as a command line argument, and if one, override with it
  // Then parse and replace {jsBeatRoot} by the right value
  Object.keys(config).forEach(configParam => {
    // From config file?
    if (configFromFile && configFromFile[configParam] && configFromFile[configParam].length) {
      config[configParam] = configFromFile[configParam];
    }

    // From command line?
    if (commandArgs && commandArgs[configParam] && commandArgs[configParam].length) {
      config[configParam] = commandArgs[configParam];
    }

    // Parse {jsBeatRoot}
    config[configParam] = String(config[configParam]).replace(/{jsBeatRoot}/g, jsBeatRoot);
  });

  // And ship it back!
  return config;
}

// Read the config for the Inputs, from file and directory
function readInputsConfig (inputsConfigFilePath, inputsConfigFilesDirectoryPath) {
  try {
    let inputsArray = [];
    // Read from main Inputs config file
    if (inputsConfigFilePath && inputsConfigFilePath.length) {
      const inputsFromFile = readConfigFromFile(inputsConfigFilePath, false, false);
  
      if (inputsFromFile) {
        // Checking config file contains an array.
        if (Array.isArray(inputsFromFile)) {
          inputsArray = inputsFromFile;
        } else {
          logToSystem('Warning', `Configuration file "${inputsConfigFilePath}" didn't contain an array of Inputs. Ignoring it.`, true);
        }
      }
    }
  
    // Read from individual Inputs config files from Inputs.d directory
    if (inputsConfigFilesDirectoryPath && inputsConfigFilesDirectoryPath.length) {
      if (fs.existsSync(inputsConfigFilesDirectoryPath)) {
        // Scan the folder for config files
        logToSystem('Verbose', `Scanning configuration directory "${inputsConfigFilesDirectoryPath}"...`, true);
        logToSystem('Warning', err.message, true);

        // Check we are dealing with a proper directory
        let dirStats = fs.statSync(inputsConfigFilesDirectoryPath);
        if (dirStats.isDirectory()) {
          fs.readdirSync(inputsConfigFilesDirectoryPath).forEach((individualInputConfigFilePath) => {
            logToSystem('Verbose', `Loading config from: ${ individualInputConfigFilePath }...`, true);
            // Read from indidual file
            const individualInputConfig = readConfigFromFile(path.join(inputsConfigFilesDirectoryPath, individualInputConfigFilePath), false, false, false, false);
            // Add it to the inputs array
            if (individualInputConfig) {
              inputsArray.push(individualInputConfig);
            }

          });
        } else {
          logToSystem('Warning', `"${inputsConfigFilesDirectoryPath}" is not a directory. Ignoring it.`, true);
        }
  
      } else {
        logToSystem('Warning', `Configuration directory "${inputsConfigFilesDirectoryPath}" doesn't exist. Ignoring it.`, true);
      }
    }
    return inputsArray;
  } catch (err) {
    // fails silently
    return undefined
  }
}

// Read a JSON formatted configuration file and raise exception, if required, if file is missing, not provided or can't be parsed.
// Returns the parsed configuration file
function readConfigFromFile (
  configFilePath,
  exitOnFileMissing = false,
  exitOnParsingError = false,
  useDefaultValuesOnFileMissing = true,
  useDefaultValuesOnParsingError = true
) {
  let configFromFile = null;

  // Prep "default value" messages
  let defaultValuesOnFileMissingMessage = '';
  let defaultValuesOnParsingErrorMessage = '';
  if (useDefaultValuesOnFileMissing) {
    defaultValuesOnFileMissingMessage = ' Using default values instead.';
  }
  if (useDefaultValuesOnParsingError) {
    defaultValuesOnParsingErrorMessage = ' Using default values instead.';
  }

  // And get cracking
  if (configFilePath && configFilePath.length) {
    if (fs.existsSync(configFilePath)) {
      // Get Inputs config
      logToSystem('Verbose', `Reading configuration file "${configFilePath}"...`, true);
      try {
        configFromFile = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
      } catch (err) {
        if (exitOnParsingError === true) {
          const err = new Error(`CRITICAL: Failed parsing configuration file "${configFilePath}". Exiting.`);
          logToSystem('Critical', err.message, true);
          throw err;
        } else {
          logToSystem('Error', `Failed parsing configuration file "${configFilePath}".${defaultValuesOnParsingErrorMessage}`, true);
        }
      }
    } else {
      if (exitOnFileMissing === true) {
        const err = new Error(`CRITICAL: Configuration file "${configFilePath}" doesn't exist. Exiting.`);
        logToSystem('Critical', err.message, true);
        throw err;
      } else {
        logToSystem('Warning', `Configuration file "${configFilePath}" doesn't exist.${defaultValuesOnFileMissingMessage}`, true);
      }
    }
  } else {
    if (exitOnFileMissing === true) {
      const err = new Error('CRITICAL: No file path provided. Exiting.');
      logToSystem('Critical', err.message, true);
      throw err;
    }
  }
  return configFromFile;
}

module.exports = {
  jsBeatRoot, // Base directory
  commandArgs, // Command line arguments
  readMainConfig, // Read jsBeat.json file,
  readInputsConfig // Read the config for the Inputs, from file and directory
}