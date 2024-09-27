from typing import Any, Optional, Tuple
from urllib import parse

import requests

from os_authlib.constants import AUTHENTICATION_HEADER, COOKIE_NAME
from os_authlib.http_handler import HttpHandler


class FakeRequest:
    http_handler = HttpHandler()

    def test_connection(self):
        return requests.get(f"{self.http_handler.auth_endpoint}/system/auth/")

    def raw_login(self) -> Any:
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

    def logout(self, token: str, cookie: str) -> None:
        response = self.http_handler.send_secure_request("logout", token, cookie)
        assert response.status_code == 200
