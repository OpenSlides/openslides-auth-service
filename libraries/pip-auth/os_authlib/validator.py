import os
from typing import Any, Callable, Dict, Optional, Tuple

import authlib
import requests
from authlib.jose import KeySet, JsonWebKey
from authlib.jose import jwt
from jose.exceptions import *
from jwt import ExpiredSignatureError
import jwt as jwtAlt

from .config import Environment
from .constants import USER_ID_PROPERTY, SESSION_ID_PROPERTY
from .exceptions import (
    AuthenticateException,
    InstanceError,
    InvalidCredentialsException,
)
from .http_handler import HttpHandler
from .session_handler import SessionHandler

OS_REALM = os.environ.get("OPENSLIDES_AUTH_REALM", "os")
KEYCLOAK_URL = os.environ.get("OPENSLIDES_KEYCLOAK_URL", 'http://keycloak:8080')

class Validator:
    """
    The validator verifies a given ticket if it is valid.
    """
    key_set: KeySet
    oidc_config: Dict[str, Any]

    def __init__(self, http_handler: HttpHandler, debug_fn: Any = print) -> None:
        debug_fn("Validator.__init__")
        self.http_handler = http_handler
        self.debug_fn = debug_fn
        self.environment = Environment(debug_fn)
        self.session_handler = SessionHandler(debug_fn)

        # OIDC provider's discovery URL (replace with your provider's URL)
        discovery_url = f'{KEYCLOAK_URL}/realms/{OS_REALM}/.well-known/openid-configuration'
        # Discover OIDC configuration
        response = self.__get_with_root_cert(discovery_url)
        self.oidc_config = response.json()
        # Extract JWKS URL
        jwks_url = self.oidc_config['jwks_uri']
        # Fetch JWKS
        response = self.__get_with_root_cert(jwks_url)
        jwks = response.json()
        # Parse JWKS
        self.key_set = JsonWebKey.import_key_set(jwks)

    def verify(
            self, access_token_encoded: str
    ) -> Tuple[int, Optional[str]]:
        """
        This receives encoded jwts contained in a cookie and a token. Then, it verifies,
        that the jwts are wellformed and still valid. Afterwards, this returns a user_id
        read from the decoded jwt contained in the token.
        """
        self.debug_fn("Validator.verify")
        self.__assert_instance_of_encoded_jwt(access_token_encoded)
        # TODO: ab--handle possible exceptions
        claims = self.__decode_access_token(access_token_encoded)

        self.debug_fn("Get userId from claims from = " + claims.get(USER_ID_PROPERTY))
        self.debug_fn("Get sessionId from claims from = " + claims.get(SESSION_ID_PROPERTY))

        to_execute = lambda: (self.__validate_and_extract_user_id(claims), access_token_encoded)
        result = self.__exception_handler(to_execute)
        return result

    def __validate_and_extract_user_id(self, claims):
        # TODO: ab--make sure that the user_id is an int, handle parse error (ValueError)
        to_execute = lambda: int(claims.get(USER_ID_PROPERTY))
        result = self.__exception_handler(to_execute)
        return result

    def __decode_access_token(self, access_token_encoded):
        return jwt.decode(self.__get_jwt_from_bearer_jwt(access_token_encoded), self.key_set)

    def verify_authorization_token(self, access_token: str) -> Tuple[int, str]:
        self.debug_fn("Validator.verify_authorization_token")
        self.__assert_instance_of_encoded_jwt(access_token)
        access_token = self.__get_jwt_from_bearer_jwt(access_token)
        get_token = lambda: self.__decode_access_token(access_token)
        claims = self.__exception_handler(get_token)
        session_id = claims.get(SESSION_ID_PROPERTY)
        if self.session_handler.is_session_invalid(session_id):
            raise AuthenticateException("The session is invalid")
        user_id = claims.get(USER_ID_PROPERTY)
        email = claims.get("email")
        if not isinstance(user_id, str):
            raise AuthenticateException(f"user_id is not a str: {type(user_id)}")
        if not isinstance(email, str):
            raise AuthenticateException(f"email is not a str: {type(email)}")
        return int(user_id), email

    def __verify_ticket(self, token_encoded: str, cookie_encoded: str) -> int:
        self.debug_fn("Validator.__verify_ticket")
        token_encoded = self.__get_jwt_from_bearer_jwt(token_encoded, "token")
        cookie_encoded = self.__get_jwt_from_bearer_jwt(cookie_encoded, "cookie")
        # check whether the cookie signature is valid
        self.decode(cookie_encoded, self.environment.get_cookie_secret())
        token = self.decode(token_encoded, self.environment.get_token_secret())
        session_id = token["sessionId"]
        if self.session_handler.is_session_invalid(session_id):
            raise AuthenticateException("The session is invalid")
        user_id = token.get(USER_ID_PROPERTY)
        if not isinstance(user_id, int):
            raise AuthenticateException("user_id is not an int")
        return user_id

    def __assert_instance_of_encoded_jwt(self, jwt: str) -> None:
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

    def decode(self, encoded_jwt: str, secret: str) -> Dict:
        self.debug_fn("Validator.__decode")
        return jwt.decode(encoded_jwt, secret)

    def __is_bearer(self, encoded_jwt: str) -> bool:
        self.debug_fn("Validator.__is_bearer")
        return len(encoded_jwt) >= 7 and encoded_jwt.lower().startswith("bearer ")

    def __get_with_root_cert(self, discovery_url):
        # TODO: ab--use http handler
        return requests.get(discovery_url, verify=os.path.expanduser("~/.local/share/mkcert/rootCA.pem"))

    def __post_with_root_cert(self, discovery_url, data):
        # TODO: ab--use http handler
        return requests.post(discovery_url, data, verify=os.path.expanduser("~/.local/share/mkcert/rootCA.pem"))

    def __exception_handler(
            self, expression: Callable, except_handlers: Dict[Any, Callable] = {}
    ) -> Any:
        self.debug_fn("Validator.__exception_handler")
        try:
            return expression()
        except authlib.jose.errors.JoseError as e:
            raise AuthenticateException(e.description or e.error)
        except Exception as e:
            return self.__handle_exception(e, except_handlers)

    def __handle_exception(
            self, exception: Exception, except_handlers: Dict[Any, Callable]
    ) -> Any:
        self.debug_fn("Validator.__handle_exception: " + type(exception).__name__)
        for key in except_handlers:
            if isinstance(exception, key):
                return except_handlers[key]()
        self.__handle_unhandled_exception(exception)

    def __handle_unhandled_exception(self, exception: Any) -> None:
        self.debug_fn("Validator.__handle_unhandled_exception: " + str(exception))

        # TODO: ab--use authlib exceptions
        if isinstance(exception, ExpiredSignatureError):
            raise InvalidCredentialsException("The jwt is expired")
        elif isinstance(exception, JWEParseError):
            raise InvalidCredentialsException("Could not parse the JWE string provided")
        elif isinstance(exception, JWEInvalidAuth):
            raise InvalidCredentialsException("The authentication tag did not match the protected sections of the JWE string provided")
        elif isinstance(exception, JWEAlgorithmUnsupportedError):
            raise InvalidCredentialsException("The JWE algorithm is not supported by the backend")
        elif isinstance(exception, JWSSignatureError):
            raise InvalidCredentialsException("The signature of the jwt is invalid")
        elif isinstance(exception, JWSAlgorithmError):
            raise InvalidCredentialsException("Invalid algorithm in the jwt")
        else:
            raise exception
