import jwt

from .base import BaseTestEnvironment
from ..exceptions import AuthenticateException


class TestAuthenticate(BaseTestEnvironment):
    def test_authenticate(self):
        response = self.fake_request.login()
        user_id = self.auth_handler.authenticate(response.headers, response.cookies)[0]
        self.assertEqual(1, user_id)

    def test_authenticate_without_cookie(self):
        response = self.fake_request.login()
        user_id = self.auth_handler.authenticate(response.headers, None)[0]
        self.assertEqual(0, user_id)

    def test_authenticate_without_access_token(self):
        response = self.fake_request.login()
        user_id = self.auth_handler.authenticate(None, response.cookies)[0]
        self.assertEqual(0, user_id)

    def test_authenticate_with_malified_access_token(self):
        response = self.fake_request.login()
        with self.assertRaises(jwt.exceptions.InvalidSignatureError):
            self.auth_handler.authenticate(
                {"Authentication": self.get_malified_access_token()}, response.cookies
            )

    def test_authenticate_with_wrong_access_token(self):
        response = self.fake_request.login()
        with self.assertRaises(jwt.exceptions.InvalidSignatureError):
            self.auth_handler.authenticate(
                {"Authentication": self.get_invalid_access_token()}, response.cookies
            )

    def test_authenticate_with_expired_access_token(self):
        response = self.fake_request.login()
        answer = self.auth_handler.authenticate(
            {"Authentication": self.get_expired_access_token()}, response.cookies
        )
        self.assertEqual(1, answer[0])
        self.assertIsNotNone(answer[1])
