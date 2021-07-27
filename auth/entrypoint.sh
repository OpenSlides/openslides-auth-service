#!/bin/sh

set -e

export CACHE_PORT="${CACHE_PORT:-6379}"
export MESSAGE_BUS_PORT="${MESSAGE_BUS_PORT:-6379}"

./wait-for.sh --timeout=10 "$CACHE_HOST:$CACHE_PORT"
./wait-for.sh --timeout=10 "$MESSAGE_BUS_HOST:$MESSAGE_BUS_PORT"

exec "$@"
