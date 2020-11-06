from ..hashing_handler import HASH_WITH_SALT_LENGTH
from .base import BaseTestEnvironment


class TestHashing(BaseTestEnvironment):
    def test_random_salt(self):
        to_hash = "Some password to hash"
        self.assertNotEqual(
            self.auth_handler.hash(to_hash), self.auth_handler.hash(to_hash)
        )

    def test_hash_and_is_equals(self):
        to_hash = "Some pw"
        hash = self.auth_handler.hash(to_hash)
        self.assertTrue(self.auth_handler.is_equals(to_hash, hash))
        self.assertEqual(HASH_WITH_SALT_LENGTH, len(hash))

