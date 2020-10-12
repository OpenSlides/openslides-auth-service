import requests
from typing import Optional, Tuple, Dict, Any, Callable

from .exceptions import AuthenticateException


class HttpHandler:
    auth_url = ""

    def __init__(self, auth_url: str) -> None:
        self.auth_url = auth_url

    def send_request(self, path: str, headers=None, payload=None) -> requests.Response:
        response = None
        try:
            url = f"{self.auth_url}/system/auth{self.format_url(path)}"
            response = requests.post(url, data=payload, headers=headers)
        except requests.exceptions.ConnectionError as e:
            raise AuthenticateException(
                f"Cannot reach the authentication service on {url}. Error: {e}"
            )
        return response

    def send_internal_request(
        self, path: str, headers=None, cookies=None
    ) -> requests.Response:
        response = None
        try:
            url = f"{self.auth_url}/internal/auth{self.format_url(path)}"
            response = requests.post(url, headers=headers, cookies=cookies)
        except requests.exceptions.ConnectionError as e:
            raise AuthenticateException(
                f"Cannot reach the authentication service on {url}. Error: {e}"
            )
        return response

    def format_url(self, url: str) -> str:
        return f"/{url}" if not url.startswith("/") else url
