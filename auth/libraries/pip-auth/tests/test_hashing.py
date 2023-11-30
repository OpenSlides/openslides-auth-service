from authlib.hashing_handler import ARGON2_HASH_START

from .base import BaseTestEnvironment


DEPRECATED_PW_HASH = "316af7b2ddc20ead599c38541fbe87e9a9e4e960d4017d6e59de188b41b2758flD5BVZAZ8jLy4nYW9iomHcnkXWkfk3PgBjeiTSxjGG7+fBjMBxsaS1vIiAMxYh+K38l0gDW4wcP+i8tgoc4UBg=="  # noqa: E501


class TestHashing(BaseTestEnvironment):
    def test_random_salt(self):
        to_hash = "Some password to hash"
        self.assertNotEqual(
            self.auth_handler.hash(to_hash), self.auth_handler.hash(to_hash)
        )

    def test_hash_and_is_equals(self):
        to_hash = "Some pw"
        hash = self.auth_handler.hash(to_hash)
        self.assertEqual(hash[0:7], ARGON2_HASH_START)
        self.assertTrue(self.auth_handler.is_equals(to_hash, hash))

    def test_deprecated_pw(self):
        self.assertTrue(self.auth_handler.is_equals("admin", DEPRECATED_PW_HASH))
