#!/bin/bash

export CACHE_PORT="${CACHE_PORT:-6379}"
export MESSAGE_BUS_PORT="${MESSAGE_BUS_PORT:-6379}"

wait-for-it --timeout=10 "$CACHE_HOST:$CACHE_PORT"
wait-for-it --timeout=10 "$MESSAGE_BUS_HOST:$MESSAGE_BUS_PORT"

exec "$@"
