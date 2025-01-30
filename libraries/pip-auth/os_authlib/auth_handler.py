import logging
from typing import Any, Optional, Tuple

from .constants import ANONYMOUS_USER
from .exceptions import AuthorizationException
from .http_handler import HttpHandler
from .session_handler import SessionHandler
from .token_validator import JWTBearerOpenSlidesTokenValidator, ISSUER_REAL, ISSUER_INTERNAL, CERTS_URI, \
    create_openslides_token_validator


class AuthHandler:
    """
    A handler to verify tickets from auth-service and authenticates users. It refreshes
    also access-tokens, if they are expired. It is necessary to pass a url to the
    auth-service for requests to that service. A function to print debug-messages can
    optionally be passed.
    """

    TOKEN_DB_KEY = "tokens"

    def __init__(self, debug_fn: Any = print) -> None:
        self.logger = logging.getLogger(__name__)
        self.debug_fn = debug_fn
        self.http_handler = HttpHandler(debug_fn)
        self.session_handler = SessionHandler(debug_fn)
        self.validator = create_openslides_token_validator()

    def authenticate(
        self, access_token: Optional[str]
    ) -> Tuple[int, Optional[str]]:
        """
        Tries to check and read a user_id from a given access_token and refresh_id.
        """
        if not access_token:
            self.debug_fn("No access_token")
            return ANONYMOUS_USER, None
        token_string = access_token.split(" ")[1]
        # validator.validate_token(token, scopes, request, **kwargs)
        token = self.validator.authenticate_token(token_string)
        claims = self.validator.validate_token(token, ["openid", "profile", "os", "offline_access", "email"], None)

        return claims.get("os_uid"), token

    def verify_logout_token(
            self, logout_token: Optional[str]
    ) -> dict:
        """
        Tries to check and read a user_id from a given access_token and refresh_id.
        """
        self.debug_fn(f"Logout Token: {logout_token}")
        if not logout_token:
            self.debug_fn("No logout_token")
            raise AuthorizationException("No logout_token")
        return self.validator.authenticate_logout_token(logout_token)

    def hash(self, to_hash: str) -> str:
        self.debug_fn(f"Hash {to_hash}: {self.hashing_handler.hash(to_hash)}")
        return self.hashing_handler.hash(to_hash)

    def is_equal(self, to_hash: str, to_compare: str) -> bool:
        return self.hashing_handler.is_equal(to_hash, to_compare)

    def clear_all_sessions(self, access_token: str, refresh_id: str) -> None:
        return self.session_handler.clear_all_sessions(access_token, refresh_id)
