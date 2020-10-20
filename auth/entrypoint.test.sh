#!/bin/bash

set -e

wait-for-it auth:9004

exec "$@"
