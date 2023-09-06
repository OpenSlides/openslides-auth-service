import os
from typing import Any

from .exceptions import SecretException


AUTH_DEV_TOKEN_SECRET = "auth-dev-token-key"
AUTH_DEV_COOKIE_SECRET = "auth-dev-cookie-key"
DEVELOPMENT_VARIABLE = "OPENSLIDES_DEVELOPMENT"
AUTH_COOKIE_KEY_FILE = "AUTH_COOKIE_KEY_FILE"
AUTH_TOKEN_KEY_FILE = "AUTH_TOKEN_KEY_FILE"
VERBOSE_TRUE_FIELDS = ["1", "true", "on"]


class Environment:
    def __init__(self, debug_fn: Any = print) -> None:
        self.debug_fn = debug_fn
        self.debug_fn("Environment.__init__")
        self.load_secrets()

    def load_secrets(self) -> None:
        self.debug_fn("Environment.load_secrets")
        if self.is_dev_mode():
            self.auth_token_secret = AUTH_DEV_TOKEN_SECRET
            self.auth_cookie_secret = AUTH_DEV_COOKIE_SECRET
        else:
            self.auth_token_secret = self.get_secret(
                AUTH_TOKEN_KEY_FILE, "/run/secrets/auth_token_key"
            )
            self.auth_cookie_secret = self.get_secret(
                AUTH_COOKIE_KEY_FILE, "/run/secrets/auth_cookie_key"
            )

    def get_secret(self, var: str, default: str) -> str:
        path = os.getenv(var, default)
        if not path:
            raise SecretException(f"{var} is not defined")
        with open(path, "r") as file:
            secret = file.read()
        if not secret:
            raise SecretException(f"No secret defined in {path} ({var})")
        return secret

    def get_token_secret(self):
        return self.auth_token_secret

    def get_cookie_secret(self):
        return self.auth_cookie_secret

    def is_dev_mode(self):
        dev_mode = os.getenv(DEVELOPMENT_VARIABLE, "")
        self.debug_fn(f"DEVELOPMENT: {DEVELOPMENT_VARIABLE} == {dev_mode}")
        return dev_mode.lower() in VERBOSE_TRUE_FIELDS
