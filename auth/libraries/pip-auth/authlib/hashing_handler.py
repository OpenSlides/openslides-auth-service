import base64
import hashlib
import secrets
from typing import Optional

import argon2

HASH_WITH_SALT_LENGTH = 152


class HashingHandler:
    def hash(self, to_hash: str, hash_reference: Optional[str] = None) -> str:
        ph = argon2.PasswordHasher()
        return ph.hash(to_hash)

    def verify(self, hash: str, password: str) -> bool:
        ph = argon2.PasswordHasher()
        return ph.verify(hash, password)
