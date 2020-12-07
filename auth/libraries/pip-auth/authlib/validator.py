from typing import Any, Dict, Optional, Tuple
from urllib import parse

import jwt

from .config import Environment

from .constants import (
    ANONYMOUS_USER,
    COOKIE_NAME,
    HEADER_NAME,
    USER_ID_PROPERTY,
)
from .exceptions import (
    AuthenticateException,
    InvalidCredentialsException,
    InstanceError,
)
from .http_handler import HttpHandler


class Validator:
    """
    The validator verifies a given ticket if it is valid.
    """

    def __init__(self, http_handler: HttpHandler, debug_fn: Any = print) -> None:
        debug_fn("Validator.__init__")
        self.http_handler = http_handler
        self.debug_fn = debug_fn
        self.environment = Environment(debug_fn)

    def verify(
        self, token_encoded: str, cookie_encoded: str
    ) -> Tuple[int, Optional[str]]:
        self.debug_fn("Validator.verify")
        try:
            self.__assert_instance_of_encoded_jwt(token_encoded, "Token")
            self.__assert_instance_of_encoded_jwt(cookie_encoded, "Cookie")
            return self.__verify_ticket(token_encoded, cookie_encoded), None
        except jwt.exceptions.ExpiredSignatureError:
            return self.__verify_ticket_from_auth_service(token_encoded, cookie_encoded)

    def __verify_ticket(self, token_encoded: str, cookie_encoded: str) -> int:
        self.debug_fn("Validator.__verify_ticket")
        token_encoded = self.__get_jwt_from_bearer_jwt(token_encoded, "token")
        cookie_encoded = self.__get_jwt_from_bearer_jwt(cookie_encoded, "cookie")
        # this may raise an ExpiredSignatureError. We check,
        # if the cookies signature is valid
        self.__decode(cookie_encoded, self.environment.get_cookie_key())
        token = self.__decode(token_encoded, self.environment.get_token_key())
        user_id = token.get(USER_ID_PROPERTY)
        if not isinstance(user_id, int):
            raise AuthenticateException("user_id is not an int")
        return user_id

    def __assert_instance_of_encoded_jwt(self, jwt: str, name: str = "jwt") -> None:
        self.debug_fn("Validator.__assert_instance_of_encoded_jwt")
        if not isinstance(jwt, str):
            error_message = f"{jwt} is from type {type(jwt)} -- expected: string"
            self.debug_fn(f"Throw Error\n{error_message}")
            raise InstanceError(error_message)

    def __get_jwt_from_bearer_jwt(self, string: str, name: str = "jwt") -> str:
        self.debug_fn("Validator.__get_jwt_from_bearer_jwt")
        if not self.__is_bearer(string):
            raise InvalidCredentialsException(f"Wrong format of {name}: {string}")
        return string[7:]

    def __decode(self, encoded_jwt: str, secret: str) -> Dict:
        self.debug_fn("Validator.__decode")
        return jwt.decode(encoded_jwt, secret, algorithms=["HS256"])

    def __is_bearer(self, encoded_jwt: str) -> bool:
        self.debug_fn("Validator.__is_bearer")
        return len(encoded_jwt) >= 7 and encoded_jwt.startswith("bearer ")

    def __verify_ticket_from_auth_service(
        self, token_encoded: str, cookie_encoded: str
    ) -> Tuple[int, Optional[str]]:
        """
        Sends a request to the auth-service configured in the constructor.
        """
        self.debug_fn("Validator.__verify_ticket_from_auth_service")
        headers = {HEADER_NAME: token_encoded}
        cookies = {COOKIE_NAME: cookie_encoded}
        response = self.http_handler.send_internal_request(
            "/authenticate", headers=headers, cookies=cookies
        )
        if not response.ok:
            self.debug_fn(
                "Error from auth-service: " + response.content.decode("utf-8")
            )
            raise AuthenticateException(
                f"Authentication service sends HTTP {response.status_code}. "
            )

        user_id = self.__get_user_id_from_response_body(response.json())
        access_token = response.headers.get(HEADER_NAME, None)
        return user_id, access_token

    def __get_user_id_from_response_body(self, response_body) -> int:
        self.debug_fn("Validator.__get_user_id_from_response_body")
        try:
            return response_body[USER_ID_PROPERTY]
        except (TypeError, KeyError) as e:
            raise AuthenticateException(
                f"Empty or bad response from authentication service: {e}"
            )
