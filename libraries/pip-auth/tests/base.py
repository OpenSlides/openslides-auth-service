import unittest

from authlib.auth_handler import AuthHandler
from authlib.message_bus import MessageBus

from .fake_request import FakeRequest


class BaseTestEnvironment(unittest.TestCase):
    auth_handler = AuthHandler()
    fake_request = FakeRequest()
    message_bus = MessageBus()

    def setUp(self) -> None:
        self.message_bus.redis.flushall()

    def get_invalid_access_token(self):
        return "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzSW4iOiIxMG0iLCJzZXNzaW9uSWQiOiI2NjUzYWMwNmJhNjVkYmQzNDE5NTQwOGQ1MDI5NjU1ZSIsInVzZXJJZCI6MSwaWF0IjoxNTk3MTQ5NDI0LCJleHAiOjE1OTcxNTAwMjR9.z21-bSIj_xZAoCbwXTqqf_ODAIEbbeSehYIE33dmYUs"  # noqa

    def get_malified_access_token(self):
        return "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzSW4iOiIxMG0iLCJzZXNzaW9uSWQiOiI2NjUzYWMwNmJhNjVkYmQzNDE5NTQwOGQ1MDI5NjU1ZSIsInVzZXJJZCI6MSwiaWF0IxoxNTk3MTQ5NDI0LCJleHAiOjE1OTcxNTAwMjR9.z21-bSIj_xZAoCbwXTqqf_ODAIEbbeSehYIE33dmYUs"  # noqa
