import os
from typing import Any

from .exceptions import KeyException

AUTH_DEV_KEY = "auth-dev-key"
DEVELEOPMENT_VARIABLE = "OPENSLIDES_DEVELOPMENT"
VERBOSE_TRUE_FIELDS = ["y", "1", "yes", "true", "on"]


class Environment:
    def __init__(self, debug_fn: Any = print) -> None:
        print("Environment.__init__")
        self.debug_fn = debug_fn
        self.__load_keys()

    def __load_keys(self) -> None:
        self.debug_fn("Environment.__load_keys")
        default = AUTH_DEV_KEY if self.is_dev_mode() else None
        self.debug_fn(f"Is dev-mode {self.is_dev_mode()} with default key {default}")
        auth_token_key = os.getenv("AUTH_TOKEN_KEY", default)
        auth_cookie_key = os.getenv("AUTH_COOKIE_KEY", default)
        if not auth_token_key:
            raise KeyException("No AUTH_TOKEN_KEY defined.")

        if not auth_cookie_key:
            raise KeyException("No AUTH_COOKIE_KEY defined.")

        self.auth_token_key = auth_token_key
        self.auth_cookie_key = auth_cookie_key

    def get_token_key(self):
        return self.auth_token_key

    def get_cookie_key(self):
        return self.auth_cookie_key

    def is_dev_mode(self):
        self.debug_fn(
            f"Is DEVELOPMENT: {DEVELEOPMENT_VARIABLE} == {os.getenv(DEVELEOPMENT_VARIABLE)}"
        )
        return os.getenv(DEVELEOPMENT_VARIABLE) in VERBOSE_TRUE_FIELDS
