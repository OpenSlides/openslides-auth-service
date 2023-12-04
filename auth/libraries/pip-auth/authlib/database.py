import json
import os
from typing import Any

import redis

from .constants import PASSWORD_RESET_TOKEN_EXPIRATION_TIME


class Database:
    AUTH_PREFIX = "auth"

    def __init__(self, prefix: str, debug_fn: Any = print) -> None:
        self.prefix = prefix
        self.debug_fn = debug_fn
        host = os.environ.get("CACHE_HOST", "localhost")
        port = int(os.environ.get("CACHE_PORT", 6379))
        self.redis = redis.Redis(host=host, port=port)

    def set(self, key: str, obj: Any, expire: bool = False) -> None:
        redisKey = self.getPrefixedKey(key)
        self.redis.hset(redisKey, redisKey, json.dumps(obj))
        if expire:
            self.redis.expire(redisKey, PASSWORD_RESET_TOKEN_EXPIRATION_TIME)

    def get(self, key: str) -> Any:
        redisKey = self.getPrefixedKey(key)
        data = self.redis.hget(redisKey, redisKey)
        if data:
            return json.loads(data)

    def getPrefix(self) -> str:
        return f"{Database.AUTH_PREFIX}:{self.prefix}"

    def getPrefixedKey(self, key: str) -> str:
        return f"{self.getPrefix()}:{key}"
