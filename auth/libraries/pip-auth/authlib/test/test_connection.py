from .base import BaseTestEnvironment


class TestConnection(BaseTestEnvironment):
    def test_service_is_available(self):
        response = self.fake_request.test_connection()
        response_body = response.json()
        self.assertEqual(200, response.status_code)
        self.assertEqual(
            "Authentication service is available", response_body["message"]
        )

    def test_login(self):
        response = self.fake_request.login()
        response_body = response.json()
        self.assertEqual(200, response.status_code)
        self.assertEqual("Authentication successful!", response_body["message"])
