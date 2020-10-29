import unittest
import requests

from ..auth_handler import AuthHandler
from ..constants import AUTH_TEST_URL
from .fake_request import FakeRequest


class BaseTestEnvironment(unittest.TestCase):
    auth_handler = AuthHandler(AUTH_TEST_URL)
    fake_request = FakeRequest()

    def get_invalid_access_token(self):
        return "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzSW4iOiIxMG0iLCJzZXNzaW9uSWQiOiI2NjUzYWMwNmJhNjVkYmQzNDE5NTQwOGQ1MDI5NjU1ZSIsInVzZXJJZCI6MSwaWF0IjoxNTk3MTQ5NDI0LCJleHAiOjE1OTcxNTAwMjR9.z21-bSIj_xZAoCbwXTqqf_ODAIEbbeSehYIE33dmYUs"

    def get_expired_access_token(self):
        return "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzSW4iOiIxMG0iLCJzZXNzaW9uSWQiOiI2NjUzYWMwNmJhNjVkYmQzNDE5NTQwOGQ1MDI5NjU1ZSIsInVzZXJJZCI6MSwiaWF0IjoxNTk3MTQ5NDI0LCJleHAiOjE1OTcxNTAwMjR9.z21-bSIj_xZAoCbwXTqqf_ODAIEbbeSehYIE33dmYUs"

    def get_malified_access_token(self):
        return "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzSW4iOiIxMG0iLCJzZXNzaW9uSWQiOiI2NjUzYWMwNmJhNjVkYmQzNDE5NTQwOGQ1MDI5NjU1ZSIsInVzZXJJZCI6MSwiaWF0IxoxNTk3MTQ5NDI0LCJleHAiOjE1OTcxNTAwMjR9.z21-bSIj_xZAoCbwXTqqf_ODAIEbbeSehYIE33dmYUs"
