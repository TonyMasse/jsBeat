# TODO - Frontend

### Target: current dev

## TO DO
- [ ] Create and use General JSON configuration file to store
  - [ ] State folder location
  - [ ] Inputs JSON file location
  - [ ] Lumberjack JSON file location
  - [ ] Temporary folder location for decompression of Flat Files (for example `/tmp/some_sub_directory/`)
- [ ] Ability to specify config files via command line
  - [ ] Specify Inputs JSON file via command line argument
  - [ ] Specify Lumberjack JSON file via command line argument
  - [ ] Specify location of State directory via command line argument
- [ ] Read Input JSON files from a directory (`config/inputs.d/*.json`)
- [ ] Ability to write logs to `/var/log/jsBeat`
- [ ] Clean up (limit) output STDOUT
  - [ ] Create a Log Level global variable with one of these values
    - 1 - Debug
    - 2 - Verbose
    - 3 - Info
    - 4 - Warning
    - 5 - Error
    - 6 - Critical
  - [ ] use Log Level to decide what to output
  - [ ] Create a logging function to make all this easy
- [ ] Provide SHA256 checksum with wach Release
- [ ] Add Syslog support
  - [ ] UDP
  - [ ] TCP
    - [ ] Secure Syslog
- [ ] Flat file - Ability to NOT collect from the beginning
- [ ] Flat file - Handle compressed files
  - [ ] Decompress in `/tmp/some_sub_directory/log_source_specific_folder/flat_file_specific_folder`
  - [ ] Crawl for each decompressed file(s)
  - [ ] Process each decompressed file(s)
    - [ ] Read decompressed file
    - [ ] Delete decompressed file
  - [ ] Delete `/tmp/some_sub_directory/log_source_specific_folder/flat_file_specific_folder`

## TO FIX
:hole:

## TO TEST
:hole:

