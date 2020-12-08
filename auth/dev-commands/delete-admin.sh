#!/bin/bash

set -e

curl -X POST http://localhost:9011/internal/datastore/writer/write -H "Content-Type: application/json" -d '{"events": [{"type": "delete", "fqid": "user/1"}], "information": {}, "user_id": 1, "locked_fields": {}}'