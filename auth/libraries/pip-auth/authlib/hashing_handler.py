import secrets
import base64
import hashlib
from typing import Optional, Tuple, Dict, Any, Callable

from .constants import HASHED_LENGTH


class HashingHandler:
    def sha512(self, to_hash: str, hash_reference: Optional[str] = None) -> str:
        salt = self.__getSalt(hash_reference)
        salt = self.__encodeString(salt)
        to_hash = self.__encodeString(to_hash)
        hash = hashlib.new("sha512", to_hash)
        hash.update(salt)
        hashValue = base64.b64encode(hash.digest())
        return salt + hashValue

    def __encodeString(self, string: str) -> str:
        try:
            string = string.encode("utf-8")
        except AttributeError:
            pass
        return string

    def __getSalt(self, hash_reference: Optional[str] = None) -> str:
        return (
            hash_reference[0:64]
            if hash_reference is not None and len(hash_reference) == HASHED_LENGTH
            else secrets.token_hex(64)
        )
