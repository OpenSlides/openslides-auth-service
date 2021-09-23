import requests
from typing import Optional, Tuple
from urllib import parse

from ..http_handler import HttpHandler
from ..constants import COOKIE_NAME, AUTHENTICATION_HEADER


class FakeRequest:
    http_handler = HttpHandler()

    def test_connection(self):
        return requests.get(f"{self.http_handler.auth_endpoint}/system/auth/")

    def raw_login(self) -> any:
        return self.http_handler.send_request(
            "login", payload={"username": "admin", "password": "admin"}
        )

    def login(self) -> Tuple[Optional[str], Optional[str]]:
        response = self.raw_login()
        cookie = response.cookies.get(COOKIE_NAME, "")
        return (
            response.headers.get(AUTHENTICATION_HEADER, None),
            parse.unquote(cookie),
        )
