#!/bin/bash

wait-for-it auth:9004

exec "$@"
