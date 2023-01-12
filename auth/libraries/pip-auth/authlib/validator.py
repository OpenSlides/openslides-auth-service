from typing import Any, Callable, Dict, Optional, Tuple

import jwt

from .config import Environment
from .constants import AUTHENTICATION_HEADER, COOKIE_NAME, USER_ID_PROPERTY
from .exceptions import (
    AuthenticateException,
    InstanceError,
    InvalidCredentialsException,
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
        """
        This receives encoded jwts contained in a cookie and a token. Then, it verifies,
        that the jwts are wellformed and still valid. Afterwards, this returns a user_id
        read from the decoded jwt contained in the token.
        """
        self.debug_fn("Validator.verify")
        self.__assert_instance_of_encoded_jwt(token_encoded, "Token")
        self.__assert_instance_of_encoded_jwt(cookie_encoded, "Cookie")
        to_execute = lambda: [self.__verify_ticket(token_encoded, cookie_encoded), None]
        to_fallback = lambda: self.__verify_ticket_from_auth_service(
            token_encoded, cookie_encoded
        )
        return self.__exception_handler(
            to_execute, {jwt.exceptions.ExpiredSignatureError: to_fallback}
        )

    def verify_only_cookie(self, cookie_encoded: str) -> int:
        """
        This receives only an encoded jwt contained in a cookie and verifies, that the
        jwt is wellformed and still valid. Afterwards, this returns a user_id read from
        the decoded jwt contained in the cookie. It only returns an int or raises an
        error.

        Use this with caution, because using only a cookie to verify a valid
        authentication is vulnerable for CSRF-attacks.
        """
        self.debug_fn("Validator.verify_only_cookie")
        cookie_encoded = self.__get_jwt_from_bearer_jwt(cookie_encoded, "cookie")
        get_cookie = lambda: self.__decode(
            cookie_encoded, self.environment.get_cookie_secret()
        )
        cookie = self.__exception_handler(get_cookie)
        user_id = cookie.get(USER_ID_PROPERTY)
        if not isinstance(user_id, int):
            raise AuthenticateException("user_id is not an int")
        return user_id

    def verify_authorization_token(self, authorization_token: str) -> Tuple[int, str]:
        self.debug_fn("Validator.verify_authorization_token")
        self.__assert_instance_of_encoded_jwt(authorization_token)
        authorization_token = self.__get_jwt_from_bearer_jwt(authorization_token)
        get_token = lambda: self.__decode(
            authorization_token, self.environment.get_token_secret()
        )
        token = self.__exception_handler(get_token)
        user_id = token.get(USER_ID_PROPERTY)
        email = token.get("email")
        if not isinstance(user_id, str):
            raise AuthenticateException(f"user_id is not a str: {type(user_id)}")
        if not isinstance(email, str):
            raise AuthenticateException(f"email is not a str: {type(email)}")
        return int(user_id), email

    def __verify_ticket(self, token_encoded: str, cookie_encoded: str) -> int:
        self.debug_fn("Validator.__verify_ticket")
        token_encoded = self.__get_jwt_from_bearer_jwt(token_encoded, "token")
        cookie_encoded = self.__get_jwt_from_bearer_jwt(cookie_encoded, "cookie")
        # this may raise an ExpiredSignatureError. We check,
        # if the cookies signature is valid
        self.__decode(cookie_encoded, self.environment.get_cookie_secret())
        token = self.__decode(token_encoded, self.environment.get_token_secret())
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
        headers = {AUTHENTICATION_HEADER: token_encoded}
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
        access_token = response.headers.get(AUTHENTICATION_HEADER, None)
        return user_id, access_token

    def __get_user_id_from_response_body(self, response_body) -> int:
        self.debug_fn("Validator.__get_user_id_from_response_body")
        try:
            return response_body[USER_ID_PROPERTY]
        except (TypeError, KeyError) as e:
            raise AuthenticateException(
                f"Empty or bad response from authentication service: {e}"
            )

    def __exception_handler(
        self, expression: Callable, except_handlers: Dict[Any, Callable] = {}
    ) -> Any:
        self.debug_fn("Validator.__exception_handler")
        try:
            return expression()
        except Exception as e:
            return self.__handle_exception(e, except_handlers)

    def __handle_exception(
        self, exception: Exception, except_handlers: Dict[Any, Callable]
    ) -> Any:
        self.debug_fn("Validator.__handle_exception")
        for key in except_handlers:
            if isinstance(exception, key):
                return except_handlers[key]()
        self.__handle_unhandled_exception(exception)

    def __handle_unhandled_exception(self, exception: Any) -> None:
        self.debug_fn("Validator.__handle_unhandled_exception")
        if isinstance(exception, jwt.exceptions.ExpiredSignatureError):
            raise InvalidCredentialsException("The jwt is expired")
        if isinstance(exception, jwt.exceptions.InvalidSignatureError):
            raise InvalidCredentialsException("The signature of the jwt is invalid")
        if isinstance(exception, jwt.exceptions.InvalidTokenError):
            raise InvalidCredentialsException("The jwt is invalid")
        if isinstance(exception, jwt.exceptions.DecodeError):
            raise InvalidCredentialsException("The jwt is invalid")
        if isinstance(exception, jwt.exceptions.InvalidAudienceError):
            raise InvalidCredentialsException("The audience of the jwt is invalid")
        if isinstance(exception, jwt.exceptions.InvalidAlgorithmError):
            raise InvalidCredentialsException("Unsupported algorithm detected")
        if isinstance(exception, jwt.exceptions.InvalidIssuerError):
            raise InvalidCredentialsException("Wrong issuer detected")
        if isinstance(exception, jwt.exceptions.InvalidIssuedAtError):
            raise InvalidCredentialsException("The 'iat'-timestamp is in the future")
        if isinstance(exception, jwt.exceptions.ImmatureSignatureError):
            raise InvalidCredentialsException("The 'nbf'-timestamp is in the future")
        if isinstance(exception, jwt.exceptions.MissingRequiredClaimError):
            raise InvalidCredentialsException(
                "The jwt does not contain the required fields"
            )
        if isinstance(exception, jwt.exceptions.InvalidKeyError):
            raise InvalidCredentialsException(
                "The specified key for the jwt has a wrong format"
            )
