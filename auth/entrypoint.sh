#!/bin/bash

export STORAGE_PORT="${STORAGE_PORT:-6379}"

# TODO: read optional ports from env variables: db_port and redis_port
wait-for-it --timeout=10 "$STORAGE_HOST:$STORAGE_PORT"
wait-for-it --timeout=10 "$MESSAGE_BUS_HOST:$MESSAGE_BUS_PORT"

exec "$@"