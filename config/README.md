# Configuration

## jsBeat.json
Optional: yes
Type: JSON file
Default path: `{jsBeatRoot}/config/jsBeat.json`
Path cath can be overridden by: `--jsBeatConfigFile` via the command line.

| Field | Default value | Description |
|-------|---------------|-------------|
| jsBeatRoot | `null` | If provided, the root of the jsBeat paths. `{jsBeatRoot}` can then be used in any other paths, and will be replaced by this value. If not provided `{jsBeatRoot}` will be replaced by the jsBeat root path detected at runtime. |
| stateDirectoryPath | `{jsBeatRoot}/states` | Directory used to store the State of each Log Source. Any occurrence of `{jsBeatRoot}` in this path will be replaced by the value of `jsBeatRoot`. |
| inputsConfigFilePath | `{jsBeatRoot}/config/inputs.json` | Description of one or several Log Sources. Works in addition to the definitions (if any) found in `inputsConfigFilesDirectoryPath`. Any occurrence of `{jsBeatRoot}` in this path will be replaced by the value of `jsBeatRoot`. |
| inputsConfigFilesDirectoryPath | `{jsBeatRoot}/config/inputs.d` | Contains individual Log Source description files. Works in addition to the definitions (if any) found in `inputsConfigFilePath`. Any occurrence of `{jsBeatRoot}` in this path will be replaced by the value of `jsBeatRoot`.  |
| lumberjackConfigPath | `{jsBeatRoot}/config/lumberjack.json` | Parameters for the Lumberjack protocol. Defines how to connect to the Open Collector. Any occurrence of `{jsBeatRoot}` in this path will be replaced by the value of `jsBeatRoot`. |
| decompressionTemporaryRootPath | `/tmp/jsBeat/decompressedFiles` | Temporary directory inside of which new directories will be created if needed to temporarily store decompressed files, while they get processed. Any occurrence of `{jsBeatRoot}` in this path will be replaced by the value of `jsBeatRoot`. |

__Example:__
```json
{
  "jsBeatRoot": null,
  "stateDirectoryPath": "{jsBeatRoot}/states",
  "inputsConfigFilePath": "{jsBeatRoot}/config/inputs.json",
  "inputsConfigFilesDirectoryPath": "{jsBeatRoot}/config/inputs.d",
  "lumberjackConfigPath": "{jsBeatRoot}/config/lumberjack.json",
  "decompressionTemporaryRootPath": "/tmp/jsBeat/decompressedFiles"
}
```
  

## lumberjack.json
Optional: yes
Type: JSON file
Default path: `{jsBeatRoot}/config/lumberjack.json`
Path can be overridden by `lumberjackConfigPath` inside of `config/jsBeat.json`.
Path can be overridden by `--lumberjackConfigPath` via the command line.

Parameters for the Lumberjack protocol. Defines how to connect to the Open Collector.

| Field | Default value | Description |
|-------|---------------|-------------|
| host | localhost | Host running the Open Collector. |
| port | 5044 | Port the Open Collector listens to. |  

__Example:__
```json
{
  "host": "localhost",
  "port": 5044
}
```

## inputs.json
Optional: yes
Type: JSON file
Default path: `{jsBeatRoot}/config/inputs.json`
Path can be overridden by `inputsConfigFilePath` inside of `config/jsBeat.json`.
Path can be overridden by `--inputsConfigFilePath` via the command line.

Description of one or several Log Sources. Works in addition to the definitions (if any) found in `{jsBeatRoot}/config/inputs.d/`.

Compulsory fields:
- `log_source_type`
- `uid`
- `baseDirectoryPath`
- `inclusionFilter`

__Example:__
```json
[
  {
    "log_source_type": "flatFile",
    "uid": "ef480e69-5c1b-4d8f-8144-7d51c765f1ee",
    "name": "Firewalld logs",
    "device_type": "firewalld",
    "filter_helpers": {
      "boggus_test_file": false,
      "firewalld": true
    },
    "baseDirectoryPath": "/tmp",
    "inclusionFilter": "firewalld",
    "exclusionFilter": "",
    "recursionDepth": 0,
    "daysToWatchModifiedFiles": 5,
    "compressionType": "none",
    "multiLines": {
      "msgStartRegex": "",
      "msgStopRegex": "",
      "msgDelimiterRegex": ""
    },
    "frequency_in_seconds": 10,
    "printToConsole": false
  },
  {
    "log_source_type": "flatFile",
    "uid": "b2d5912d-e842-4689-b7fe-1c6a452d1002",
    "name": "System wide Messages",
    "device_type": "system_messages",
    "filter_helpers": {
      "System_Messages": true
    },
    "baseDirectoryPath": "/var/log",
    "inclusionFilter": "messages",
    "exclusionFilter": "",
    "recursionDepth": 0,
    "daysToWatchModifiedFiles": 0,
    "compressionType": "none",
    "multiLines": {
      "msgStartRegex": "",
      "msgStopRegex": "",
      "msgDelimiterRegex": ""
    },
    "frequency_in_seconds": 5,
    "printToConsole": false
  }
]
```

## inputs.d/
Optional: yes
Type: Directory
Default path: `{jsBeatRoot}/config/inputs.d/`
Path can be overridden by `inputsConfigFilesDirectoryPath` inside of `config/jsBeat.json`.
Path can be overridden by `--inputsConfigFilesDirectoryPath` via the command line.

Contains individual Log Source description files. Works in addition to the definitions (if any) found in {jsBeatRoot}/config/inputs.json`.

__Examples:__
- `{jsBeatRoot}/config/inputs.d/firewalld.json`
```json
{
  "log_source_type": "flatFile",
  "uid": "d6a5a53f-51d7-4324-8920-377e07f754ed",
  "name": "Firewalld logs",
  "device_type": "firewalld",
  "filter_helpers": {
    "boggus_test_file": false,
    "firewalld": true
  },
  "baseDirectoryPath": "/tmp",
  "inclusionFilter": "firewalld",
  "exclusionFilter": "",
  "recursionDepth": 0,
  "daysToWatchModifiedFiles": 5,
  "compressionType": "none",
  "multiLines": {
    "msgStartRegex": "",
    "msgStopRegex": "",
    "msgDelimiterRegex": ""
  },
  "frequency_in_seconds": 10,
  "printToConsole": false
}
```

- `{jsBeatRoot}/config/inputs.d/messages.json`
```json
{
  "log_source_type": "flatFile",
  "uid": "f114e094-4a21-414c-bcd6-7456a5e1e75a",
  "name": "System wide Messages",
  "device_type": "system_messages",
  "filter_helpers": {
    "System_Messages": true
  },
  "baseDirectoryPath": "/var/log",
  "inclusionFilter": "messages",
}

```
