# Inputs

## Flat file collection

### Crawler process:
- [ ] Crawl the path for files matching criteria
  - [ ] Check existence of State file for Log Source
    - [ ] read State from disk
  - [x] Check existence of root path
    - [x] If not present, set timer to check later
  - [ ] Check if root path is File, in case user misunderstood and/or mis-configured it as a file instead of directory
    - [ ] If it is, process it as a file directly
  - [ ] for each file:
    - [x] check include Filter for match
    - [x] check exclude Filter for NO match
    - [x] add new file to State
      - [ ] unless they are older than `Days to watch modified files`
    - [x] read any new file
      - [x] collect from byte 0
    - [x] read any changed file
      - [x] use file size to trigger collect
        - [x] if bigger: collect from last collected byte +1
        - [x] if smaller: collect from byte 0
    - [x] update State
  - [x] for each directory:
    - [x] Recursively crawl said directory
    - [x] Do not recursively crawl if reached maximum depth
  - [ ] after each crawl cycle:
    - [ ] persist State to disk
  - [x] limit crawl to specific depths (from config)
  - [x] crawl interval set by config
- [ ] regularly
  - [ ] prune State
    - [ ] low frequency (daily?)

### Collect process
- [ ] if required (from config) decompress file
- [x] use Regex to spot EOL for Linux, Windows and Mac
- [x] use Regex to reconstruct multi-lines log
  - [x] Start Regex
  - [x] End Regex
  - [x] Separator Regex
- [x] for each message
  - [x] push to Open Collector

### Configuration
- Base directory path (👈 Compulsory)
- Inclusions (👈 Compulsory)
- Exclusions
- Multi-lines log
  - Start Regex
  - End Regex
  - Separator / Delimiter Regex
- ~~Is directory~~ (👈 decided to make it a directory all the time by default)
- Recursion depth
- Days to watch modified files
- Compression type
  - none
  - gzip
  - tar
  - targzip
  - zip
  - gzip (partitionned file)
- Crawl frequency (seconds)