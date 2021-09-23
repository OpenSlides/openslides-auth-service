from typing import Any, Optional, Tuple
from requests import Response

from .constants import ANONYMOUS_USER
from .token_factory import TokenFactory
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
        self.token_factory = TokenFactory(self.http_handler, debug_fn)
        self.hashing_handler = HashingHandler()

    def authenticate(
        self, access_token: Optional[str], refresh_id: Optional[str]
    ) -> Tuple[int, Optional[str]]:
        """
        Tries to check and read a user_id from a given access_token and refresh_id.
        """
        self.debug_fn(f"Try to authenticate with")
        self.debug_fn(f"AccessToken: {access_token}")
        self.debug_fn(f"RefreshId: {refresh_id}")
        if not access_token or not refresh_id:
            self.debug_fn("No access_token or refresh_id")
            return ANONYMOUS_USER, None
        return self.validator.verify(access_token, refresh_id)

    def authenticate_only_refresh_id(self, refresh_id: Optional[str]) -> int:
        """
        This tries to check and read a user_id from a given refresh_id. It only returns an int or raises an error.

        Use this with caution, because using only a refresh_id to verify a valid authentication is vulnerable
        for CSRF-attacks.
        """
        self.debug_fn("Try to authenticate only with")
        self.debug_fn(f"RefreshId: {refresh_id}")
        if not refresh_id:
            self.debug_fn("No refresh_id given")
            return ANONYMOUS_USER
        return self.validator.verify_only_cookie(refresh_id)

    def hash(self, to_hash: str) -> str:
        self.debug_fn(f"Hash {to_hash}: {self.hashing_handler.hash(to_hash)}")
        return self.hashing_handler.hash(to_hash)

    def is_equals(self, to_hash: str, to_compare: str) -> bool:
        return (
            self.hashing_handler.hash(to_hash, hash_reference=to_compare) == to_compare
        )

    def create_authorization_token(self, user_id: int, email: str) -> Response:
        return self.token_factory.create(user_id, email)

    def verify_authorization_token(self, authorization_token: str) -> Tuple[int, str]:
        return self.validator.verify_authorization_token(authorization_token)