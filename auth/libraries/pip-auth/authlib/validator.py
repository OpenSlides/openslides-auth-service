from typing import Any, Dict, Optional, Tuple
from urllib import parse

import jwt

from authlib.config import get_private_cookie_key, get_private_token_key

from .constants import (
    ANONYMOUS_USER,
    AUTHENTICATION_HEADER,
    REFRESH_ID,
    USER_ID_PROPERTY,
)
from .exceptions import AuthenticateException, InvalidCredentialsException
from .http_handler import HttpHandler


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
            if not isinstance(token_encoded, str) or not isinstance(cookie_encoded, str):
                return ANONYMOUS_USER, None
            return self.__verify_ticket(token_encoded, cookie_encoded), None
        except jwt.exceptions.ExpiredSignatureError:
            return self.__verify_ticket_from_auth_service(headers, cookies)

    def __extractTokenAndCookie(self, headers: Dict, cookies: Dict) -> Tuple[Optional[str], Optional[str]]:
        try:
            token_encoded = headers.get(AUTHENTICATION_HEADER)
            if not isinstance(token_encoded, str):
                raise AuthenticateException("Wrong format of headers")
        except KeyError:
            raise AuthenticateException("Wrong format of headers")
        try:
            refresh_id = cookies.get(REFRESH_ID)
            cookie_encoded = (
                parse.unquote(refresh_id) if isinstance(refresh_id, str) else None
            )
        except KeyError:
            raise AuthenticateException("Wrong format of cookies")
        return token_encoded, cookie_encoded

    def __verify_ticket(self, token_encoded: str, cookie_encoded: str) -> int:
        token_encoded, cookie_encoded = self.__assert_wellformed_token_and_cookie(
            token_encoded, cookie_encoded
        )
        # this may raise an ExpiredSignatureError. We check,
        # if the cookies signature is valid
        self.__decode(cookie_encoded, get_private_cookie_key())
        token = self.__decode(token_encoded, get_private_token_key())
        user_id = token.get(USER_ID_PROPERTY)
        if not isinstance(user_id, int):
            raise AuthenticateException("user_id is not an int")
        return user_id

    def __assert_wellformed_token_and_cookie(
        self, token: str, cookie: str
    ) -> Tuple[str, str]:
        if not self.__is_bearer(token):
            raise InvalidCredentialsException("Wrong format of access-token")
        if not self.__is_bearer(cookie):
            raise InvalidCredentialsException("Wrong format of refresh-cookie")
        return token[7:], cookie[7:]

    def __decode(self, encoded_jwt: str, secret: str) -> Dict:
        return jwt.decode(encoded_jwt, secret, algorithms=["HS256"])

    def __is_bearer(self, encoded_jwt: str) -> bool:
        return len(encoded_jwt) >= 7 and encoded_jwt.startswith("bearer ")

    def __verify_ticket_from_auth_service(
        self, headers: Dict, cookies: Dict
    ) -> Tuple[int, Optional[str]]:
        """
        Sends a request to the auth-service configured in the constructor.
        """
        response = self.http_handler.send_internal_request(
            "/api/authenticate", headers=headers, cookies=cookies
        )
        if not response.ok:
            self.debug_fn(
                "Error from auth-service: " + response.content.decode("utf-8")
            )
            raise AuthenticateException(
                f"Authentication service sends HTTP {response.status_code}. "
            )

        user_id = self.__getUserIdFromResponseBody(response.json())
        access_token = response.headers.get(AUTHENTICATION_HEADER, None)
        return user_id, access_token

    def __getUserIdFromResponseBody(self, response_body) -> int:
        try:
            return response_body[USER_ID_PROPERTY]
        except (TypeError, KeyError) as e:
            raise AuthenticateException(
                f"Empty or bad response from authentication service: {e}"
            )
