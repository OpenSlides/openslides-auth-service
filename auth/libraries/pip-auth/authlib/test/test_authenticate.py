import jwt

from .base import BaseTestEnvironment
from ..config import Environment
from urllib import parse
from ..constants import COOKIE_NAME, HEADER_NAME, USER_ID_PROPERTY
from datetime import datetime
from ..exceptions import InvalidCredentialsException


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
        cookie = cookie_encoded[7:]

        session_id = jwt.decode(
            cookie, self.environment.get_cookie_key(), algorithms=["HS256"]
        )["sessionId"]
        expired_token_payload = {
            "sessionId": session_id,
            USER_ID_PROPERTY: 1,
            "exp": datetime.utcfromtimestamp(0),
        }
        raw_token = jwt.encode(
            expired_token_payload, self.environment.get_token_key(), algorithm="HS256"
        )
        expired_token = "bearer " + raw_token.decode("utf-8")

        user_id, access_token = self.auth_handler.authenticate(
            expired_token, cookie_encoded
        )
        self.assertEqual(1, user_id)
        self.assertIsNotNone(access_token)
