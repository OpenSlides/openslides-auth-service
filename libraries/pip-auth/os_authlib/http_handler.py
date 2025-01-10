import os
from typing import Any

import requests

from .exceptions import AuthenticateException


class HttpHandler:
    def __init__(self, debug_fn: Any = print) -> None:
        self.debug_fn = debug_fn
        self.auth_endpoint = self.get_endpoint(debug_fn)

    def get_endpoint(self, debug_fn: Any = print) -> str:
        endpoint = os.environ.get("OPENSLIDES_KEYCLOAK_URL", "localhost")
        debug_fn(f"Auth endpoint: {endpoint}")
        return endpoint

    def send_request(
            self, path: str, payload=None, headers=None, cookies=None
    ) -> requests.Response:
        path = f"/{self.format_url(path)}"
        return self.__send_request(path, payload, headers, cookies)

    def __send_request(
            self, path: str, payload: Any, headers: Any, cookies: Any
    ) -> requests.Response:
        try:
            url = f"{self.auth_endpoint}{path}"
            response = requests.post(
                url, data=payload, headers=headers, cookies=cookies
            )
        except requests.exceptions.ConnectionError as e:
            raise AuthenticateException(
                f"Cannot reach the authentication service on {url}. Error: {e}"
            )
        return response

    def format_url(self, url: str) -> str:
        return f"/{url}" if not url.startswith("/") else url
