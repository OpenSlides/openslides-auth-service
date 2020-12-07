#!/bin/bash

set -e

curl http://localhost:9011/internal/datastore/writer/write -H "Content-Type: application/json" -d '{"user_id": 1, "information": {}, "locked_fields": {}, "events": [{"type": "create", "fqid": "user/1", "fields": {"id": 1, "is_active": true, "username": "admin", "password": "316af7b2ddc20ead599c38541fbe87e9a9e4e960d4017d6e59de188b41b2758flD5BVZAZ8jLy4nYW9iomHcnkXWkfk3PgBjeiTSxjGG7+fBjMBxsaS1vIiAMxYh+K38l0gDW4wcP+i8tgoc4UBg=="}}]}' 