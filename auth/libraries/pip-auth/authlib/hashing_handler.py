import secrets
from Crypto.Hash import SHA512
from typing import Optional, Tuple, Dict, Any, Callable


class HashingHandler:
    def sha512(self, to_hash: str, salt: Optional[str] = None) -> str:
        salt = secrets.token_hex(64) if salt is None else salt
        hash = SHA512.new(to_hash)
        hash.update(salt)
        hashValue = hash.digest("base64")
        return f"{salt}{hashValue}"
