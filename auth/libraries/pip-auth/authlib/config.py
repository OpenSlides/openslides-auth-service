import os
from typing import Any

from .exceptions import SecretException

AUTH_DEV_TOKEN_SECRET = "auth-dev-token-key"
AUTH_DEV_COOKIE_SECRET = 'auth-dev-cookie-key'
DEVELEOPMENT_VARIABLE = "OPENSLIDES_DEVELOPMENT"
VERBOSE_TRUE_FIELDS = ["y", "1", "yes", "true", "on"]


class Environment:
    def __init__(self, debug_fn: Any = print) -> None:
        self.debug_fn = debug_fn
        self.debug_fn("Environment.__init__")
        self.__load_secrets()

    def __load_secrets(self) -> None:
        self.debug_fn("Environment.__load_secrets")
        if self.is_dev_mode():
            self.auth_token_secret = AUTH_DEV_TOKEN_SECRET
            self.auth_cookie_secret = AUTH_DEV_COOKIE_SECRET
        else:
            token_secret_path = "/run/secrets/auth_token_key"
            self.auth_token_secret = self.read_file(token_secret_path)
            if not self.auth_token_secret:
                raise SecretException("No AUTH_TOKEN_SECRET defined in " + token_secret_path)
            cookie_secret_path = "/run/secrets/auth_cookie_key"
            self.auth_cookie_secret = self.read_file(cookie_secret_path)
            if not self.auth_cookie_secret:
                raise SecretException("No AUTH_COOKIE_SECRET defined in " + cookie_secret_path)

    def get_token_secret(self):
        return self.auth_token_secret

    def get_cookie_secret(self):
        return self.auth_cookie_secret

    def is_dev_mode(self):
        self.debug_fn(
            f"Is DEVELOPMENT: {DEVELEOPMENT_VARIABLE} == {os.getenv(DEVELEOPMENT_VARIABLE)}"
        )
        return os.getenv(DEVELEOPMENT_VARIABLE) in VERBOSE_TRUE_FIELDS

    def read_file(self, path: str) -> str:
        file = open(path, "r")
        return file.read()
