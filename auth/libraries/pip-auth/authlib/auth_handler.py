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
        self, access_token: Optional[str], refresh_id: Optional[str]
    ) -> Tuple[int, Optional[str]]:
        self.debug_fn(f"Try to authenticate with")
        self.debug_fn(f"AccessToken: {access_token}")
        self.debug_fn(f"RefreshId: {refresh_id}")
        if not access_token or not refresh_id:
            self.debug_fn("No access_token or refresh_id")
            return ANONYMOUS_USER, None
        return self.validator.verify(access_token, refresh_id)

    def hash(self, to_hash: str) -> str:
        self.debug_fn(f"Hash {to_hash}: {self.hashing_handler.hash(to_hash)}")
        return self.hashing_handler.hash(to_hash)

    def is_equals(self, to_hash: str, to_compare: str) -> bool:
        return (
            self.hashing_handler.hash(to_hash, hash_reference=to_compare) == to_compare
        )
