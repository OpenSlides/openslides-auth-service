import unittest

import jwt

from ..auth_handler import AuthHandler
from .fake_request import FakeRequest
from ..constants import USER_ID_PROPERTY
from datetime import datetime


class BaseTestEnvironment(unittest.TestCase):
    auth_handler = AuthHandler()
    fake_request = FakeRequest()

    def get_invalid_access_token(self):
        return "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzSW4iOiIxMG0iLCJzZXNzaW9uSWQiOiI2NjUzYWMwNmJhNjVkYmQzNDE5NTQwOGQ1MDI5NjU1ZSIsInVzZXJJZCI6MSwaWF0IjoxNTk3MTQ5NDI0LCJleHAiOjE1OTcxNTAwMjR9.z21-bSIj_xZAoCbwXTqqf_ODAIEbbeSehYIE33dmYUs"  # noqa

    def get_malified_access_token(self):
        return "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzSW4iOiIxMG0iLCJzZXNzaW9uSWQiOiI2NjUzYWMwNmJhNjVkYmQzNDE5NTQwOGQ1MDI5NjU1ZSIsInVzZXJJZCI6MSwiaWF0IxoxNTk3MTQ5NDI0LCJleHAiOjE1OTcxNTAwMjR9.z21-bSIj_xZAoCbwXTqqf_ODAIEbbeSehYIE33dmYUs"  # noqa
