#!/bin/bash

set -e

export LB_LIBRARY_PATH=/usr/local/lib

wait-for-it auth:9004

exec "$@"
