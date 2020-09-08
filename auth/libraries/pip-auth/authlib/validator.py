import jwt
import requests
import secrets
from Crypto.Hash import SHA512
from urllib import parse
from typing import Optional, Tuple, Dict, Any, Callable
import simplejson as json
from .http_handler import HttpHandler
from .exceptions import InvalidCredentialsException, AuthenticateException

from authlib.config import get_private_token_key, get_private_cookie_key


AUTHENTICATION_HEADER = "Authentication"
REFRESH_ID = "refreshId"
USER_ID = "userId"

ANONYMOUS_USER = 0
INVALID_USER = -1


class Validator:
    """
    The validator verifies a given ticket if it is valid.
    """

    auth_url = ""
    debug_fn = print
    http_handler = None

    def __init__(self, http_handler: HttpHandler, debug_fn: Any = print) -> None:
        self.http_handler = http_handler
        self.debug_fn = debug_fn

    def verify_ticket(self, token_encoded: str, cookie_encoded: str) -> int:
        if not isinstance(token_encoded, str) or not isinstance(cookie_encoded, str):
            return ANONYMOUS_USER
        if not self.is_bearer(token_encoded) or not self.is_bearer(cookie_encoded):
            raise InvalidCredentialsException("Wrong format of token or cookie")
        token_encoded = token_encoded[7:]
        cookie_encoded = cookie_encoded[7:]
        self.verify(cookie_encoded, get_private_cookie_key())
        try:
            token = self.verify(token_encoded, get_private_token_key())
            return token.get(USER_ID)
        except Exception as e:
            self.debug_fn(e)
            return INVALID_USER

    def verify(self, encoded_jwt: str, secret: str) -> Dict:
        try:
            return jwt.decode(encoded_jwt, secret)
        except Exception as e:
            raise AuthenticateException(f"JWT is wrong: {e}")

    def is_bearer(self, encoded_jwt: str) -> bool:
        return len(encoded_jwt) >= 7 and encoded_jwt.startswith("bearer ")

    def verify_ticket_from_auth_service(
        self, headers: Dict
    ) -> Tuple[int, Optional[str]]:
        """
        Sends a request to the auth-service configured in the constructor.
        """
        response = self.http_handler.send_request("/api/authenticate", headers)
        if not response.ok:
            raise AuthenticateException(
                f"Authentication service sends HTTP {response.status_code}. Please contact administrator."
            )

        body = response.json()
        try:
            user_id = body[USER_ID]
        except (TypeError, KeyError) as e:
            raise AuthenticateException(
                f"Empty or bad response from authentication service: {e}"
            )

        access_token = response.headers.get(AUTHENTICATION_HEADER, None)
        return user_id, access_token
