import requests
from typing import Optional, Tuple, Dict, Any, Callable


class HttpHandler:
    auth_url = ""

    def __init__(self, auth_url: str) -> None:
        self.auth_url = auth_url

    def send_request(self, path: str, headers) -> requests.Response:
        response = None
        try:
            url = f"{self.auth_url}{path}"
            response = requests.post(url, headers=headers)
        except requests.exceptions.ConnectionError as e:
            raise f"Cannot reach the authentication service on {url}. Error: {e}"
        return response
