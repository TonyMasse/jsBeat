# Configuration

Where `{jsBeatRoot}` can be used in a path, it will be replaced by either (in decreasing order of priority):
- the path provided by `--jsBeatRoot` via the command line, if any
- the jsBeat root path detected at runtime

> __IMPORTANT__
>
> If the path provided by `--jsBeatRoot` via the command line doesn't exist, __jsBeat__ will exit.

## jsBeat.json
- Optional: yes
- Type: JSON file
- Default path: `{jsBeatRoot}/config/jsBeat.json`
- Path cath can be overridden by: `--jsBeatConfigFile` via the command line.

Overal configuraion of jsBeat.

> __NOTE__
>
> All the fields are optional

| Field | Default value | Description | Can be overridden by |
|-------|---------------|-------------|---------------|
| stateDirectoryPath | `{jsBeatRoot}/states` | Directory used to store the State of each Log Source. Any occurrence of `{jsBeatRoot}` in this path will be replaced by the value of `jsBeatRoot`. | `--stateDirectoryPath` |
| inputsConfigFilePath | `{jsBeatRoot}/config/inputs.json` | Description of one or several Log Sources. Works in addition to the definitions (if any) found in `inputsConfigFilesDirectoryPath`. Any occurrence of `{jsBeatRoot}` in this path will be replaced by the value of `jsBeatRoot`. | `--inputsConfigFilePath` |
| inputsConfigFilesDirectoryPath | `{jsBeatRoot}/config/inputs.d` | Contains individual Log Source description files. Works in addition to the definitions (if any) found in `inputsConfigFilePath`. Any occurrence of `{jsBeatRoot}` in this path will be replaced by the value of `jsBeatRoot`.  | `--inputsConfigFilesDirectoryPath` |
| lumberjackConfigPath | `{jsBeatRoot}/config/lumberjack.json` | Parameters for the Lumberjack protocol. Defines how to connect to the Open Collector. Any occurrence of `{jsBeatRoot}` in this path will be replaced by the value of `jsBeatRoot`. | `--lumberjackConfigPath` |
| decompressionTemporaryRootPath | `/tmp/jsBeat/decompressedFiles` | Temporary directory inside of which new directories will be created if needed to temporarily store decompressed files, while they get processed. Any occurrence of `{jsBeatRoot}` in this path will be replaced by the value of `jsBeatRoot`. | `--decompressionTemporaryRootPath` |
| logFilePath | `/var/log/jsBeat` | Log file of jsBeat. Any occurrence of `{jsBeatRoot}` in this path will be replaced by the value of `jsBeatRoot`. | `--logFilePath` |
| logLevel | `information` | Level of logging details. Possible values: `critical`, `error`, `warning`, `information`, `verbose`, `debug` | `--logLevel` |

__Example:__
```json
{
  "stateDirectoryPath": "{jsBeatRoot}/states",
  "inputsConfigFilePath": "{jsBeatRoot}/config/inputs.json",
  "inputsConfigFilesDirectoryPath": "{jsBeatRoot}/config/inputs.d",
  "lumberjackConfigPath": "{jsBeatRoot}/config/lumberjack.json",
  "decompressionTemporaryRootPath": "/tmp/jsBeat/decompressedFiles",
  "logFilePath": "/var/log/jsBeat",
  "logLevel": "information"
}
```
  

## lumberjack.json
- Optional: yes
- Type: JSON file
- Default path: `{jsBeatRoot}/config/lumberjack.json`
- Path can be overridden by `lumberjackConfigPath` inside of `config/jsBeat.json`.
- Path can be overridden by `--lumberjackConfigPath` via the command line.

Parameters for the Lumberjack protocol. Defines how to connect to the Open Collector.

> __NOTE__
>
> All the fields are optional

| Field | Default value | Description |
|-------|---------------|-------------|
| host | `localhost` | Host running the Open Collector. |
| port | `5044` | Port the Open Collector listens to. |  

__Example:__
```json
{
  "host": "localhost",
  "port": 5044
}
```

## inputs.json
- Optional: yes
- Type: JSON file
- Default path: `{jsBeatRoot}/config/inputs.json`
- Path can be overridden by `inputsConfigFilePath` inside of `config/jsBeat.json`.
- Path can be overridden by `--inputsConfigFilePath` via the command line.

Description of one or several Log Sources. Works in addition to the definitions (if any) found in `{jsBeatRoot}/config/inputs.d/`. See [inputs.d/](#inputsd) section for more details.

It is formatted as an array of objects, each containing some of the following parameters:


Compulsory fields for all Log Sources (🟠):
- `log_source_type`
- `uid`

Compulsory fields for Flat File (🟣), when `log_source_type` = `flatFile`:
- `baseDirectoryPath`
- `inclusionFilter`

Strongly advised (🔵), as they are used by the __JQ Filter__ of the __Open Collector__:
- `deviceType`
- `filterHelpers`

All the other fields are optional (⚫)

| | Field | Type | Description |
|-|-------|------|-------------|
|🟠| `log_source_type` | string | One of the supported log source type: `flatFile` or `syslog`. |
|🟠| `uid` | string | UID of the Log Source / data stream. If none provided, one will be generated. |
|⚫| `name` | string | Optional user friendly name for the Log Source / data stream. |
|🟣| `baseDirectoryPath` | string | Full Base directory path to crawl to find the files matching inclusionFilter. Must be non-empty. |
|🟣| `inclusionFilter` | string | If prefixed with "Regex::" then regex filter, otherwise file system type filter. Must be non-empty. |
|⚫| `exclusionFilter` | string | If prefixed with "Regex::" then regex filter, otherwise file system type filter. |
|⚫| `recursionDepth` | number | Maximum number of sub-directory to crawl into. |
|⚫| `daysToWatchModifiedFiles` | number | Stop checking for update/growth files older than X days old. 0 means disabled (all files are checked) |
|⚫| `compressionType` | string | Contains one of the compression format. |
|⚫| `multiLines` | object | Branches: `msgStartRegex`, `msgStopRegex` and `msgDelimiterRegex` |
|⚫| - `msgStartRegex` | string | Inclusing Regex to match the beginning of a new message. |
|⚫| - `msgStopRegex` | string | Inclusing Regex to match the end of a message. |
|⚫| - `msgDelimiterRegex` | string | Excluding Regex to separate two messages. |
|⚫| `collectFromBeginning` | boolean | If set to true, the first collection cycle will collect from the beginning. Otherwise, the first cycle only collect file size and update the State.
|⚫| `frequencyInSeconds` | number | Collect cycle frequency. Default to 30 seconds if not provided or below 0. |
|⚫| `autoStart` | boolean | If false, it will only create the object and wait for start() to be called. Otherwise (default) it will try to start capturing the data immediately.
|⚫| `printToConsole` | boolean | If true, it will print out to the Console, as well as to the Open Collector. |
|⚫| `sendToOpenCollector` | boolean | If true, will push to Open Collector via Lumberjack. |
|🔵| `deviceType` | string | The name of the Device Type, to pass onto the Open Collector Pipeline. |
|🔵| `filterHelpers` | object | A set of flags/strings/objects to help the JQ filter of the Open Collector Pipeline to trigger on. |


__Example:__
```json
[
  {
    "log_source_type": "flatFile",
    "uid": "ef480e69-5c1b-4d8f-8144-7d51c765f1ee",
    "name": "Firewalld logs",
    "deviceType": "firewalld",
    "filterHelpers": {
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
    "frequencyInSeconds": 10,
    "printToConsole": false
  },
  {
    "log_source_type": "flatFile",
    "uid": "b2d5912d-e842-4689-b7fe-1c6a452d1002",
    "name": "System wide Messages",
    "deviceType": "system_messages",
    "filterHelpers": {
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
    "frequencyInSeconds": 5,
    "printToConsole": false
  }
]
```

## inputs.d/
- Optional: yes
- Type: Directory
- Default path: `{jsBeatRoot}/config/inputs.d/`
- Path can be overridden by `inputsConfigFilesDirectoryPath` inside of `config/jsBeat.json`.
- Path can be overridden by `--inputsConfigFilesDirectoryPath` via the command line.

Contains individual Log Source description files. Works in addition to the definitions (if any) found in {jsBeatRoot}/config/inputs.json`. See [inputs.json](#inputsjson) section for more details.

Compulsory fields:
- `log_source_type`
- `uid`
- `baseDirectoryPath`
- `inclusionFilter`

Strongly advised:
- `deviceType`
- `filterHelpers`

__Examples:__
- `{jsBeatRoot}/config/inputs.d/firewalld.json`
```json
{
  "log_source_type": "flatFile",
  "uid": "d6a5a53f-51d7-4324-8920-377e07f754ed",
  "name": "Firewalld logs",
  "deviceType": "firewalld",
  "filterHelpers": {
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
  "frequencyInSeconds": 10,
  "printToConsole": false
}
```

- `{jsBeatRoot}/config/inputs.d/messages.json`
```json
{
  "log_source_type": "flatFile",
  "uid": "f114e094-4a21-414c-bcd6-7456a5e1e75a",
  "name": "System wide Messages",
  "deviceType": "system_messages",
  "filterHelpers": {
    "System_Messages": true
  },
  "baseDirectoryPath": "/var/log",
  "inclusionFilter": "messages",
}

```
