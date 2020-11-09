from ..auth_handler import AuthHandler
from .base import BaseTestEnvironment
from ..constants import HASHED_LENGTH


class TestHashing(BaseTestEnvironment):
    def test_hash(self):
        to_hash = "helloworld"
        to_compare = b"316af7b2ddc20ead599c38541fbe87e9a9e4e960d4017d6e59de188b41b2758fww7VCxnNrYsz6Z38Fv+Wf6o4Ait5IkAE21CyknNS05lHSIzwF5AAObWhjzkeqV+oQ/Xc1y7FPsPg+n8cZnZy6w=="
        self.assertEqual(HASHED_LENGTH, len(self.auth_handler.hash(to_hash)))
        self.assertEqual(to_compare, self.auth_handler.hash(to_hash, to_compare))

    def test_is_equals(self):
        to_hash = "helloworld"
        to_compare = b"316af7b2ddc20ead599c38541fbe87e9a9e4e960d4017d6e59de188b41b2758fww7VCxnNrYsz6Z38Fv+Wf6o4Ait5IkAE21CyknNS05lHSIzwF5AAObWhjzkeqV+oQ/Xc1y7FPsPg+n8cZnZy6w=="
        self.assertEqual(True, self.auth_handler.is_equals(to_hash, to_compare))
        self.assertEqual(
            True, self.auth_handler.is_equals("x", self.auth_handler.hash("x"))
        )
