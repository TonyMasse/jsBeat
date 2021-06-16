# Flat file collection

### Algo:
- [ ] Crawl the path for files matching criteria
  - [ ] Check existence of root path
    - [ ] If not present, set timer to check later
  - [ ] for each file:
    - [ ] add new file to State
    - [ ] read any new file
      - [ ] collect from byte 0
    - [ ] read any changed file
      - [ ] use file size to trigger collect
        - [ ] if bigger: collect from last collected byte +1
        - [ ] if smaller: collect from byte 0
    - [ ] update State
  - [ ] after each crawl cycle:
    - [ ] persist State to disk
    - [ ] set timer for next Crawl
  - [ ] limit crawl to specific depths (from config)
  - [ ] crawl interval set by config
- [ ] regularly
  - [ ] prune State
    - [ ] low frequency (daily?)

### Collect process
- [ ] if required (from config) decompress file
- [ ] use Regex to spot EOL for Linux, Windows and Mac
- [ ] use Regex to reconstruct multi-lines log
  - [ ] Start Regex
  - [ ] End Regex
  - [ ] Separator Regex
