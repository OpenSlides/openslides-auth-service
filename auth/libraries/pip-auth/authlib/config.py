import os

from .exceptions import KeyException

AUTH_DEV_KEY = "auth-dev-key"
DEVELEOPMENT_VARIABLE = "OPENSLIDES_DEVELOPMENT"


class Environment:
    def __init__(self) -> None:
        self.__load_keys()

    def __load_keys(self) -> None:
        default = AUTH_DEV_KEY if self.is_dev_mode() else None
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
        return os.getenv(DEVELEOPMENT_VARIABLE) == "1"
