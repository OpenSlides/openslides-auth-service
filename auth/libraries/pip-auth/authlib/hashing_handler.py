import base64
import hashlib
import secrets
from typing import Optional

HASH_WITH_SALT_LENGTH = 152


class HashingHandler:
    def hash(self, to_hash: str, hash_reference: Optional[str] = None) -> str:
        salt = self.__getSalt(hash_reference)
        hash = hashlib.new("sha512", to_hash.encode())
        hash.update(salt.encode())
        hashValue = base64.b64encode(hash.digest()).decode("utf-8")
        return salt + hashValue

    def __getSalt(self, hash_reference: Optional[str] = None) -> str:
        if isinstance(hash_reference, str) and len(hash_reference) == HASH_WITH_SALT_LENGTH:
            return hash_reference[0:64]
        else: 
            return secrets.token_hex(32)
