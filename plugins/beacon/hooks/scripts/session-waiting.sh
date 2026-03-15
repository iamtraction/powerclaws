#!/bin/bash
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
node "$PLUGIN_ROOT/beacon.js" status waiting
