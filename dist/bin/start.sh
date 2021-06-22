#!/usr/bin/env bash

readonly JSBEAT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")"/../ && pwd)

if [ -f "$JSBEAT_ROOT/lib/node/bin/node" ];
then
# Use the bundled NodeJS
"$JSBEAT_ROOT/lib/node/bin/node" "$JSBEAT_ROOT/bin/main.js"
else
# Use the system-wise NodeJS (if any)
node "$JSBEAT_ROOT/bin/main.js"
fi
