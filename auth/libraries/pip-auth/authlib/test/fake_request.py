import requests

AUTH_TEST_URL = "http://localhost:9004"

from ..http_handler import HttpHandler


class FakeRequest:
    http_handler = HttpHandler()

    def test_connection(self):
        return requests.get(f"{self.http_handler.auth_endpoint}/system/auth/")

    def login(self):
        return self.http_handler.send_request(
            "login", payload={"username": "admin", "password": "admin"}
        )
