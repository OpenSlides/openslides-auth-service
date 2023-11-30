import base64
import hashlib

import argon2


SHA512_HASHED_LENGTH = 152
ARGON2_HASH_START = "$argon2"


class HashingHandler:
    def hash(self, to_hash: str) -> str:
        ph = argon2.PasswordHasher()
        return ph.hash(to_hash)

    def is_equals(self, toHash: str, toCompare: str) -> bool:
        if not toHash or not toCompare:
            return False
        if self.is_argon2_hash(toCompare):
            ph = argon2.PasswordHasher()
            try:
                return ph.verify(toCompare, toHash)
            except (
                argon2.exceptions.VerifyMismatchError,
                argon2.exceptions.VerificationError,
                argon2.exceptions.InvalidHashError,
            ):
                return False
        elif self.is_sha512_hash(toCompare):
            return self.sha512(toHash, toCompare[0:64]) == toCompare
        else:
            return False

    def is_sha512_hash(self, hash: str) -> bool:
        return (
            not hash.startswith(ARGON2_HASH_START) and len(hash) == SHA512_HASHED_LENGTH
        )

    def is_argon2_hash(self, hash: str) -> bool:
        return hash.startswith(ARGON2_HASH_START)

    def sha512(self, to_hash: str, salt: str) -> str:
        hash = hashlib.new("sha512", to_hash.encode())
        hash.update(salt.encode())
        hashValue = base64.b64encode(hash.digest()).decode("utf-8")
        return salt + hashValue
