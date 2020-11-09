import requests
from typing import Optional, Tuple, Dict, Any, Callable

from .exceptions import AuthenticateException
import os

class HttpHandler:
    def __init__(self, debug_fn: Any=print) -> None:
        self.auth_endpoint = self.get_endpoint(debug_fn)

    def get_endpoint(self, debug_fn: Any=print) -> str:
        host = os.environ.get("AUTH_HOST", "localhost")
        port = int(os.environ.get("AUTH_PORT", 9004))
        endpoint = f"http://{host}:{port}"
        debug_fn(f"Auth endpoint: {endpoint}")
        return endpoint

    def send_request(self, path: str, headers=None, payload=None) -> requests.Response:
        response = None
        try:
            url = f"{self.auth_endpoint}/system/auth{self.format_url(path)}"
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
            url = f"{self.auth_endpoint}/internal/auth{self.format_url(path)}"
            response = requests.post(url, headers=headers, cookies=cookies)
        except requests.exceptions.ConnectionError as e:
            raise AuthenticateException(
                f"Cannot reach the authentication service on {url}. Error: {e}"
            )
        return response

    def format_url(self, url: str) -> str:
        return f"/{url}" if not url.startswith("/") else url
