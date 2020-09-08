from urllib import parse
from typing import Optional, Tuple, Dict, Any, Callable
from .hashing_handler import HashingHandler
from .http_handler import HttpHandler
from .validator import Validator


AUTHENTICATION_HEADER = "Authentication"
REFRESH_ID = "refreshId"
USER_ID = "userId"

ANONYMOUS_USER = 0
INVALID_USER = -1


class AuthHandler:
    """
    A handler to verify tickets from auth-service and authenticates users.
    It refreshes also access-tokens, if they are expired.
    It is necessary to pass a url to the auth-service for requests to that service. 
    A function to print debug-messages can optionally be passed.
    """

    # auth_url = ""
    validator = None
    http_handler = None
    hashing_handler = None
    debug_fn = print

    def __init__(self, auth_path: str, debug_fn: Any = print) -> None:
        self.auth_url = auth_path
        self.debug_fn = debug_fn
        self.http_handler = HttpHandler(auth_path)
        self.validator = Validator(self.http_handler, debug_fn)
        self.hashing_handler = HashingHandler()

    def authenticate(self, headers: Dict, cookies: Dict) -> Tuple[int, Optional[str]]:
        token_encoded = headers.get(AUTHENTICATION_HEADER)
        cookie_encoded = (
            parse.unquote(cookies.get(REFRESH_ID))
            if not cookies.get(REFRESH_ID) is None
            else None
        )
        user_id = self.validator.verify_ticket(token_encoded, cookie_encoded)
        access_token = None
        if user_id == INVALID_USER:
            user_id, access_token = self.validator.verify_ticket_from_auth_service(
                headers
            )
        return user_id, access_token

    def hash(self, to_hash: str) -> str:
        return self.hashing_handler.sha512(to_hash)

    def is_equals(self, to_hash: str, to_compare: str) -> bool:
        if (
            not isinstance(to_hash, str)
            or not isinstance(to_compare, str)
            or len(to_compare) != 152
        ):
            return False
        return self.hashing_handler.sha512(to_hash, salt=to_compare[0:64]) == to_compare

