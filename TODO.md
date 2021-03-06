# TODO

### Target: current dev

## TO DO
- [x] Create and use General JSON configuration file to store
  - [x] State folder location
  - [x] Inputs JSON file location
  - [x] Lumberjack JSON file location
  - [x] Temporary folder location for decompression of Flat Files (for example `/tmp/some_sub_directory/`)
  - [x] Log file
  - [x] Log Level
  - [x] Update `config/README.md`
- [x] Ability to specify config files via command line
  - [x] Specify Inputs JSON file via command line argument
  - [x] Specify Lumberjack JSON file via command line argument
  - [x] Specify location of State directory via command line argument
  - [x] Update `config/README.md`
- [x] Read Input JSON files from a directory (`config/inputs.d/*.json`)
- [x] Ability to write logs to `/var/log/jsBeat`
  - [x] Update `config/README.md`
- [x] Clean up (limit) output STDOUT
  - [x] Create a Log Level global variable with one of these values
    - 1 - Debug
    - 2 - Verbose
    - 3 - Info
    - 4 - Warning
    - 5 - Error
    - 6 - Critical
  - [x] Use Log Level to decide what to output
  - [x] Create a logging function to make all this easy
- [x] Flat file - Ability to NOT collect from the beginning
- [ ] Flat file - Handle compressed files
  - [ ] Decompress in `/tmp/some_sub_directory/log_source_specific_folder/flat_file_specific_folder`
  - [ ] Crawl for each decompressed file(s)
  - [ ] Process each decompressed file(s)
    - [ ] Read decompressed file
    - [ ] Delete decompressed file
  - [ ] Delete `/tmp/some_sub_directory/log_source_specific_folder/flat_file_specific_folder`
- [ ] Flat file - Send collection stats to Open Collector
- [ ] Add Syslog support
  - [ ] UDP
  - [ ] TCP
    - [ ] Secure Syslog
- [x] Provide SHA256 checksum with each Release
- [x] Add `Active` parameter to the Input config files, and ignore any Input where `Active` is not `true`
- [x] Output the version number if run with parameter `--version` or `-v`

## TO FIX
- [x] Console output not sending JSON with .message
- [x] `@metadata.beat` and `.version` are empty when running in Production

## TO TEST
- [x] Use General JSON configuration file to store
- [x] Ability to specify config files via command line
- [x] Read Input JSON files from a directory
- [x] Flat file - Ability to NOT collect from the beginning
