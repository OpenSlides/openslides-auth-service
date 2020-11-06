from typing import Any, Dict, Optional, Tuple

from .constants import ANONYMOUS_USER
from .hashing_handler import HashingHandler
from .http_handler import HttpHandler
from .validator import Validator


class AuthHandler:
    """
    A handler to verify tickets from auth-service and authenticates users.
    It refreshes also access-tokens, if they are expired.
    It is necessary to pass a url to the auth-service for requests to that service.
    A function to print debug-messages can optionally be passed.
    """

    def __init__(self, debug_fn: Any = print) -> None:
        self.debug_fn = debug_fn
        self.http_handler = HttpHandler(debug_fn)
        self.validator = Validator(self.http_handler, debug_fn)
        self.hashing_handler = HashingHandler()

    def authenticate(
        self, headers: Optional[Dict], cookies: Optional[Dict]
    ) -> Tuple[int, Optional[str]]:
        if not headers or not cookies:
            return ANONYMOUS_USER, None
        return self.validator.verify(headers, cookies)

    def hash(self, to_hash: str) -> str:
        return self.hashing_handler.hash(to_hash)

    def is_equals(self, to_hash: str, to_compare: str) -> bool:
        return (
            self.hashing_handler.hash(to_hash, hash_reference=to_compare) == to_compare
        )
