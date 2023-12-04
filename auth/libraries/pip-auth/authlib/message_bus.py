import os
from collections import defaultdict
from time import time
from typing import Any, Dict, Optional

import redis


class MessageBus:
    def __init__(self, debug_fn: Any = print) -> None:
        self.debug_fn = debug_fn
        host = os.environ.get("MESSAGE_BUS_HOST", "localhost")
        port = int(os.environ.get("MESSAGE_BUS_PORT", 6379))
        self.redis = redis.Redis(host=host, port=port)
        self.last_ids: Dict[str, str] = defaultdict(lambda: "0-0")

    def xread(self, topic: str, max_age: Optional[int] = None) -> Any:
        last_id = self.last_ids[topic]
        last_timestamp = int(last_id.split("-")[0])
        if max_age:
            min_timestamp = round((time() - max_age) * 1000)
            if min_timestamp > last_timestamp:
                last_id = str(min_timestamp)
        response = self.redis.xread({topic: last_id})
        if response:
            entries = response[0][1]
            self.last_ids[topic] = entries[-1][0].decode()
            return entries
        else:
            self.last_ids[topic] = last_id
            return []
