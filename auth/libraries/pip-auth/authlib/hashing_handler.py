from typing import Optional

import argon2


class HashingHandler:
    def hash(self, to_hash: str, hash_reference: Optional[str] = None) -> str:
        ph = argon2.PasswordHasher()
        return ph.hash(to_hash)

    def verify(self, hash: str, password: str) -> bool:
        ph = argon2.PasswordHasher()
        try:
            return ph.verify(hash, password)
        except (
            argon2.exceptions.VerifyMismatchError,
            argon2.exceptions.VerificationError,
            argon2.exceptions.InvalidHashError,
        ):
            return False
