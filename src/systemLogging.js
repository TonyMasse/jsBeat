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

// Output the log to the system log
function logToSystem (severity, message, copyToConsole = (false || process.env.logForceToConsole)) {
  try {
    if (severity !== undefined && severity.length && message !== undefined && message.length) {
      const outSeverityInt = getLevelToInt(severity);
      if (outSeverityInt >= (process.env.logLevel !== undefined && process.env.logLevel >= minLevelInt && process.env.logLevel <= maxLevelInt ? process.env.logLevel : defaultLevelInt)) {
        const outSeverity = getIntToLevel(outSeverityInt).toUpperCase();
        const outTimestamp = new Date().toISOString();
        if (copyToConsole === true || copyToConsole === 'true') {
          console.log(outTimestamp, '|', outSeverity, '|', message);
        }
        // Send to system
        // .....
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