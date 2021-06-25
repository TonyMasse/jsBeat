const fs = require('fs');

const levelToInt = {
  'Debug': 1,
  'Verbose': 2,
  'Information': 3,
  'Warning': 4,
  'Error': 5,
  'Critical': 6
};

const intToLevel = {
  1: 'Debug',
  2: 'Verbose',
  3: 'Information',
  4: 'Warning',
  5: 'Error',
  6: 'Critical'
};

const minLevelInt = 1;
const maxLevelInt = 6;
const defaultLevelInt = 2; // Verbose
const defaultLevel = levelToInt[defaultLevelInt];

// End of line
const eol = "\n";

// Stram handle
var logStream = undefined;

// Get you the Integer level for a string level (Warning -> 4) Default to defaultLevelInt.
function getLevelToInt(level) {
  if (level !== undefined && level.length) {
    return levelToInt[String(level).charAt(0).toUpperCase() + String(level).slice(1).toLowerCase()] || defaultLevelInt;
  } else {
    return defaultLevelInt;
  }
}

// Get you the String level for a integer level (4 -> Warning). Default to defaultLevel.
function getIntToLevel(level) {
  if (level !== undefined && level >= minLevelInt && level <= maxLevelInt) {
    return intToLevel[level] || defaultLevel;
  } else {
    return defaultLevel;
  }
}

function openStream(logFilePath) {
  if (logStream !== undefined) {
    try {
      logStream.end();
    } catch (err) {
      //
    }
  }
  try {
    logStream = fs.createWriteStream(logFilePath, { flags: 'a+' });
  } catch (err) {
    //
  }
}

// Output the log to the system log
function logToSystem (severity, message, copyToConsole = (false || process.env.logForceToConsole)) {
  try {
    if (severity !== undefined && severity.length && message !== undefined && message.length) {
      const outSeverityInt = getLevelToInt(severity);
      if (outSeverityInt >= (process.env.logLevel !== undefined && process.env.logLevel >= minLevelInt && process.env.logLevel <= maxLevelInt ? process.env.logLevel : defaultLevelInt)) {
        const outSeverity = getIntToLevel(outSeverityInt).toUpperCase();
        const outTimestamp = new Date().toISOString();

        // Send to Console
        if (copyToConsole === true || copyToConsole === 'true') {
          console.log(outTimestamp, '|', outSeverity, '|', message);
        }

        // Send to system logs
        if (process.env.logFilePath && process.env.logFilePath.length) {
          if (logStream === undefined) {
            openStream(process.env.logFilePath);
          }
          logStream.write(`${outTimestamp} | ${outSeverity} | ${message}${eol}`);
        }
      }
    }
  } catch (err) {
    // Catch silently
  }
}

module.exports = {
  levelToInt,
  intToLevel,
  getLevelToInt,
  getIntToLevel,
  logToSystem
}