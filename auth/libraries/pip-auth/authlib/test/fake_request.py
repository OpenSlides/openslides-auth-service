import requests

from ..http_handler import HttpHandler

credentials = {"username": "admin", "password": "admin"}


class FakeRequest:
    http_handler = HttpHandler()

    def test_connection(self):
        return requests.get(f"{self.http_handler.auth_endpoint}/system/auth/")

    def login(self):
        return self.http_handler.send_request("login", payload=credentials)
