import requests

from ..http_handler import HttpHandler
from ..constants import AUTH_TEST_URL

credentials = {"username": "admin", "password": "admin"}


class FakeRequest:
    http_handler = HttpHandler(AUTH_TEST_URL)

    def test_connection(self):
        return requests.get(f"{AUTH_TEST_URL}/system/auth/")

    def login(self):
        return self.http_handler.send_request("login", payload=credentials)
