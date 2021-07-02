#!/usr/bin/env bash

# #########################
# Startup script for jsBeat
# #####
# Determine first if a local copy of NodeJS is present.
# - If yes, use it
# - If not, try to use a system-wide, or fail with an error message if node isn't in PATH
# #####

readonly JSBEAT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")"/../ && pwd)

# Handle script closure nicely, and terminate the jsBeat with it
trap 'kill $(jobs -p) >/dev/null 2>/dev/null' EXIT HUP QUIT PIPE

# Check for local copy of Node
if [ -f "$JSBEAT_ROOT/lib/node/bin/node" ];
then

# Use the bundled NodeJS  to start jsBeat
"$JSBEAT_ROOT/lib/node/bin/node" "$JSBEAT_ROOT/bin/main.js" "$@"

else

# Use the system-wide NodeJS (if any) to start jsBeat
node --version >/dev/null 2>/dev/null || echo -e "CRITICAL: NodeJS not present. Exiting." ; exit 42;
node "$JSBEAT_ROOT/bin/main.js" "$@"

fi
