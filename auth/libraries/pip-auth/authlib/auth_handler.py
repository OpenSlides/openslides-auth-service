from urllib import parse
from typing import Optional, Tuple, Dict, Any, Callable

from .exceptions import AuthenticateException
from .hashing_handler import HashingHandler
from .http_handler import HttpHandler
from .validator import Validator
from .constants import (
    AUTHENTICATION_HEADER,
    REFRESH_ID,
    USER_ID,
    ANONYMOUS_USER,
    INVALID_USER,
    HASHED_LENGTH,
)


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

    def authenticate(self, headers: Dict, cookies: Dict) -> Tuple[int, Optional[str]]:
        if not headers or not cookies:
            return ANONYMOUS_USER, None
        return self.validator.verify(headers, cookies)

    def hash(self, to_hash: str, old_hash: str = None) -> str:
        return self.hashing_handler.sha512(to_hash, hash_reference=old_hash)

    def is_equals(self, to_hash: str, to_compare: str) -> bool:
        if not isinstance(to_hash, str) or not isinstance(to_compare, bytes):
            return False
        return (
            self.hashing_handler.sha512(to_hash, hash_reference=to_compare)
            == to_compare
        )
