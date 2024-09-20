from datetime import datetime

import jwt

from authlib.config import Environment
from authlib.constants import USER_ID_PROPERTY
from authlib.exceptions import InvalidCredentialsException

from .base import BaseTestEnvironment


class TestAuthenticateOnlyCookie(BaseTestEnvironment):
    environment = Environment()

    def test_authenticate_with_cookie(self):
        _, cookie = self.fake_request.login()
        user_id = self.auth_handler.authenticate_only_refresh_id(cookie)
        self.assertEqual(1, user_id)

    def test_authenticate_without_cookie(self):
        user_id = self.auth_handler.authenticate_only_refresh_id(None)
        self.assertEqual(0, user_id)

    def test_authenticate_without_cookie_but_token(self):
        access_token, _ = self.fake_request.login()
        with self.assertRaises(InvalidCredentialsException):
            self.auth_handler.authenticate_only_refresh_id(access_token)

    def test_authenticate_without_cookie_but_request(self):
        self.fake_request.login()
        user_id = self.auth_handler.authenticate_only_refresh_id(None)
        self.assertEqual(0, user_id)

    def test_authenticate_with_expired_cookie(self):
        _, cookie = self.fake_request.login()
        assert cookie
        cookie = cookie[7:]

        session_id = jwt.decode(
            cookie, self.environment.get_cookie_secret(), algorithms=["HS256"]
        )["sessionId"]
        expired_cookie_payload = {
            "sessionId": session_id,
            USER_ID_PROPERTY: 1,
            "exp": datetime.utcfromtimestamp(0),
        }
        raw_cookie = jwt.encode(
            expired_cookie_payload,
            self.environment.get_cookie_secret(),
            algorithm="HS256",
        )
        expired_cookie = f"bearer {raw_cookie}"
        with self.assertRaises(InvalidCredentialsException):
            self.auth_handler.authenticate_only_refresh_id(expired_cookie)
