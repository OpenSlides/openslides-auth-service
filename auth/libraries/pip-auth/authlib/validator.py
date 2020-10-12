import jwt
import requests
import secrets
from urllib import parse
from typing import Optional, Tuple, Dict, Any, Callable
import simplejson as json
from .http_handler import HttpHandler
from .exceptions import InvalidCredentialsException, AuthenticateException

from authlib.config import get_private_token_key, get_private_cookie_key
from .constants import (
    AUTHENTICATION_HEADER,
    USER_ID,
    REFRESH_ID,
    ANONYMOUS_USER,
    INVALID_USER,
)


class Validator:
    """
    The validator verifies a given ticket if it is valid.
    """

    def __init__(self, http_handler: HttpHandler, debug_fn: Any = print) -> None:
        self.http_handler = http_handler
        self.debug_fn = debug_fn

    def verify(self, headers: Dict, cookies: Dict) -> Tuple[int, Optional[str]]:
        try:
            token_encoded, cookie_encoded = self.__extractTokenAndCookie(
                headers, cookies
            )
            return self.__verify_ticket(token_encoded, cookie_encoded), None
        except jwt.exceptions.ExpiredSignatureError:
            return self.__verify_ticket_from_auth_service(headers, cookies)

    def __verify_ticket(self, token_encoded: str, cookie_encoded: str) -> int:
        if not isinstance(token_encoded, str) or not isinstance(cookie_encoded, str):
            return ANONYMOUS_USER
        self.__validate_wellformed_token_and_cookie(token_encoded, cookie_encoded)
        token_encoded = token_encoded[7:]
        cookie_encoded = cookie_encoded[7:]
        self.__verify(cookie_encoded, get_private_cookie_key())
        return self.__getUserIdFromAccessToken(token_encoded)

    def __verify_ticket_from_auth_service(
        self, headers: Dict, cookies: Dict
    ) -> Tuple[int, Optional[str]]:
        """
        Sends a request to the auth-service configured in the constructor.
        """
        response = self.http_handler.send_internal_request(
            "/api/authenticate", headers, cookies
        )
        if not response.ok:
            raise AuthenticateException(
                f"Authentication service sends HTTP {response.status_code}. Please contact administrator."
            )

        user_id = self.__getUserIdFromResponseBody(response.json())
        access_token = response.headers.get(AUTHENTICATION_HEADER, None)
        return user_id, access_token

    def __getUserIdFromResponseBody(self, response_body) -> int:
        try:
            return response_body[USER_ID]
        except (TypeError, KeyError) as e:
            raise AuthenticateException(
                f"Empty or bad response from authentication service: {e}"
            )

    def __getUserIdFromAccessToken(self, access_token: str) -> int:
        payload = self.__verify(access_token, get_private_token_key())
        return payload.get(USER_ID)

    def __validate_wellformed_token_and_cookie(self, token: str, cookie: str) -> None:
        if not self.__is_bearer(token):
            raise InvalidCredentialsException("Wrong format of access-token")
        if not self.__is_bearer(cookie):
            raise InvalidCredentialsException("Wrong format of refresh-cookie")

    def __verify(self, encoded_jwt: str, secret: str) -> Dict:
        return jwt.decode(encoded_jwt, secret, algorithms=["HS256"])

    def __is_bearer(self, encoded_jwt: str) -> bool:
        return len(encoded_jwt) >= 7 and encoded_jwt.startswith("bearer ")

    def __extractTokenAndCookie(self, headers: Dict, cookies: Dict) -> Tuple[str, str]:
        token_encoded = None
        cookie_encoded = None
        try:
            token_encoded = headers.get(AUTHENTICATION_HEADER)
        except KeyError:
            raise AuthenticateException("Wrong format of headers")
        try:
            cookie_encoded = (
                parse.unquote(cookies.get(REFRESH_ID))
                if not cookies.get(REFRESH_ID) is None
                else None
            )
        except KeyError:
            raise AuthenticateException("Wrong format of cookies")
        return token_encoded, cookie_encoded
