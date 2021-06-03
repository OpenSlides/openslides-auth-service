import os
from typing import Any

from .exceptions import KeyException

AUTH_DEV_KEY = "auth-dev-key"
DEVELEOPMENT_VARIABLE = "OPENSLIDES_DEVELOPMENT"
VERBOSE_TRUE_FIELDS = ["y", "1", "yes", "true", "on"]


class Environment:
    def __init__(self, debug_fn: Any = print) -> None:
        self.debug_fn = debug_fn
        self.debug_fn("Environment.__init__")
        self.__load_keys()

    def __load_keys(self) -> None:
        self.debug_fn("Environment.__load_keys")
        if self.is_dev_mode():
            self.auth_token_key = AUTH_DEV_KEY
            self.auth_cookie_key = AUTH_DEV_KEY
        else:
            token_secret_path = "/run/secrets/auth_token_key"
            self.auth_token_key = self.read_file(token_secret_path)
            if not self.auth_token_key:
                raise KeyException("No AUTH_TOKEN_KEY defined in " + token_secret_path)
            cookie_secret_path = "/run/secrets/auth_cookie_key"
            self.auth_cookie_key = self.read_file(cookie_secret_path)
            if not self.auth_cookie_key:
                raise KeyException("No AUTH_COOKIE_KEY defined in " + cookie_secret_path)

    def get_token_key(self):
        return self.auth_token_key

    def get_cookie_key(self):
        return self.auth_cookie_key

    def is_dev_mode(self):
        self.debug_fn(
            f"Is DEVELOPMENT: {DEVELEOPMENT_VARIABLE} == {os.getenv(DEVELEOPMENT_VARIABLE)}"
        )
        return os.getenv(DEVELEOPMENT_VARIABLE) in VERBOSE_TRUE_FIELDS

    def read_file(self, path: str) -> str:
        file = open(path, "r")
        return file.read()
