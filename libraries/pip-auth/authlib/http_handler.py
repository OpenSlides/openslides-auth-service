import os
from typing import Any
from urllib import parse

import requests

from .constants import AUTHENTICATION_HEADER, COOKIE_NAME
from .exceptions import AuthenticateException


class HttpHandler:
    def __init__(self, debug_fn: Any = print) -> None:
        self.debug_fn = debug_fn
        self.auth_endpoint = self.get_endpoint(debug_fn)

    def get_endpoint(self, debug_fn: Any = print) -> str:
        host = os.environ.get("AUTH_HOST", "localhost")
        port = int(os.environ.get("AUTH_PORT", 9004))
        endpoint = f"http://{host}:{port}"
        debug_fn(f"Auth endpoint: {endpoint}")
        return endpoint

    def send_request(
        self, path: str, payload=None, headers=None, cookies=None
    ) -> requests.Response:
        path = f"/system/auth{self.format_url(path)}"
        return self.__send_request(path, payload, headers, cookies)

    def send_internal_request(
        self, path: str, payload=None, headers=None, cookies=None
    ) -> requests.Response:
        path = f"/internal/auth{self.format_url(path)}"
        return self.__send_request(path, payload, headers, cookies)

    def send_secure_request(
        self, path: str, token: str, cookie: str, payload=None
    ) -> requests.Response:
        path = f"/system/auth/secure{self.format_url(path)}"
        return self.__send_request(
            path,
            payload,
            {AUTHENTICATION_HEADER: token},
            {COOKIE_NAME: parse.quote(cookie)},
        )

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
