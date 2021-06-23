#!/usr/bin/env bash

readonly JSBEAT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")"/../ && pwd)

if [ -f "$JSBEAT_ROOT/lib/node/bin/node" ];
then
# Use the bundled NodeJS
echo -e "Using the bundled NodeJS to start jsBeat..."
"$JSBEAT_ROOT/lib/node/bin/node" "$JSBEAT_ROOT/bin/main.js"
else
# Use the system-wise NodeJS (if any)
echo -e "Using the system-wise NodeJS (if any) to start jsBeat..."
node --version >/dev/null 2>/dev/null || echo -e "CRITICAL: NodeJS not present. Exiting." 1>&2; exit 42;
node "$JSBEAT_ROOT/bin/main.js"
fi
