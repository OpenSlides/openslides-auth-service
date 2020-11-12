import jwt

from .base import BaseTestEnvironment
from ..config import Environment
from urllib import parse
from ..constants import USER_ID_PROPERTY
from datetime import datetime


class TestAuthenticate(BaseTestEnvironment):
    environment = Environment()

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
        cookie = parse.unquote(response.cookies["refreshId"])[7:]

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
            {"Authentication": expired_token}, response.cookies
        )
        self.assertEqual(1, user_id)
        self.assertIsNotNone(access_token)
