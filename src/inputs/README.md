# Inputs

## Flat file collection

### Crawler process:
- [ ] Crawl the path for files matching criteria
  - [x] Check existence of root path
    - [x] If not present, set timer to check later
  - [ ] for each file:
    - [x] check include Filter for match
    - [x] check exclude Filter for NO match
    - [x] add new file to State
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
- Base directory path
- Multi-lines log
  - Start Regex
  - End Regex
  - Separator / Delimiter Regex
- ~~Is directory~~
- Recursion depth
- Inclusions
- Exclusions
- Days to watch modified files
- Compression type
  - none
  - gzip
  - tar
  - targzip
  - zip
  - gzip (partitionned file)
- Crawl frequency (seconds)