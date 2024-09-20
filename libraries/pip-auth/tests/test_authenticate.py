from datetime import datetime
from time import sleep

import jwt
import pytest

from os_authlib.config import Environment
from os_authlib.constants import USER_ID_PROPERTY
from os_authlib.exceptions import AuthenticateException, InvalidCredentialsException

from .base import BaseTestEnvironment


class TestAuthenticate(BaseTestEnvironment):
    environment = Environment()

    def test_authenticate(self):
        access_token, cookie = self.fake_request.login()
        user_id = self.auth_handler.authenticate(access_token, cookie)[0]
        self.assertEqual(1, user_id)

    def test_authenticate_without_cookie(self):
        access_token = self.fake_request.login()[0]
        user_id = self.auth_handler.authenticate(access_token, None)[0]
        self.assertEqual(0, user_id)

    def test_authenticate_without_access_token(self):
        cookie = self.fake_request.login()[1]
        user_id = self.auth_handler.authenticate(None, cookie)[0]
        self.assertEqual(0, user_id)

    def test_authenticate_with_malified_access_token(self):
        cookie = self.fake_request.login()[1]
        with self.assertRaises(InvalidCredentialsException):
            self.auth_handler.authenticate(self.get_malified_access_token(), cookie)

    def test_authenticate_with_wrong_access_token(self):
        cookie = self.fake_request.login()[1]
        with self.assertRaises(InvalidCredentialsException):
            self.auth_handler.authenticate(self.get_invalid_access_token(), cookie)

    def test_authenticate_with_expired_access_token(self):
        cookie_encoded = self.fake_request.login()[1]
        assert cookie_encoded
        cookie = cookie_encoded[7:]

        session_id = jwt.decode(
            cookie, self.environment.get_cookie_secret(), algorithms=["HS256"]
        )["sessionId"]
        expired_token_payload = {
            "sessionId": session_id,
            USER_ID_PROPERTY: 1,
            "exp": datetime.utcfromtimestamp(0),
        }
        raw_token = jwt.encode(
            expired_token_payload,
            self.environment.get_token_secret(),
            algorithm="HS256",
        )
        expired_token = f"bearer {raw_token}"

        user_id, access_token = self.auth_handler.authenticate(
            expired_token, cookie_encoded
        )
        self.assertEqual(1, user_id)
        self.assertIsNotNone(access_token)

    def test_authenticate_after_logout(self):
        token, cookie = self.fake_request.login()
        assert token and cookie
        self.auth_handler.authenticate(token, cookie)
        self.fake_request.logout(token, cookie)
        sleep(0.01)  # to avoid timing issues with redis
        with pytest.raises(AuthenticateException):
            self.auth_handler.authenticate(token, cookie)

    def test_clear_sessions(self):
        token, cookie = self.fake_request.login()
        assert token and cookie
        self.auth_handler.clear_all_sessions(token, cookie)
        with pytest.raises(AuthenticateException):
            self.auth_handler.authenticate(token, cookie)
