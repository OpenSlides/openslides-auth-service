"""
OIDC Test Fixtures

Provides RSA keypair generation and mock JWT token creation for OIDC/Keycloak testing.
"""

import json
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from unittest.mock import MagicMock

import jwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


class OIDCKeyPair:
    """Generates and manages RSA keypair for OIDC token signing."""

    def __init__(self, key_id: str = "test-key-1"):
        self.key_id = key_id
        self._private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend(),
        )
        self._public_key = self._private_key.public_key()

    @property
    def private_key(self) -> rsa.RSAPrivateKey:
        return self._private_key

    @property
    def public_key(self) -> rsa.RSAPublicKey:
        return self._public_key

    def get_private_key_pem(self) -> bytes:
        """Get private key in PEM format."""
        return self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )

    def get_public_key_pem(self) -> bytes:
        """Get public key in PEM format."""
        return self._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

    def get_jwk(self) -> Dict[str, Any]:
        """Get public key as JWK (JSON Web Key)."""
        public_numbers = self._public_key.public_numbers()

        def int_to_base64url(n: int, length: Optional[int] = None) -> str:
            """Convert integer to base64url-encoded string."""
            import base64

            byte_length = length or (n.bit_length() + 7) // 8
            data = n.to_bytes(byte_length, byteorder="big")
            return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

        return {
            "kty": "RSA",
            "use": "sig",
            "alg": "RS256",
            "kid": self.key_id,
            "n": int_to_base64url(public_numbers.n),
            "e": int_to_base64url(public_numbers.e),
        }


class OIDCTokenFactory:
    """Creates OIDC/JWT tokens for testing."""

    DEFAULT_ISSUER = "http://localhost:8080/realms/openslides"
    DEFAULT_AUDIENCE = "openslides"

    def __init__(
        self,
        keypair: OIDCKeyPair,
        issuer: str = DEFAULT_ISSUER,
        audience: str = DEFAULT_AUDIENCE,
    ):
        self.keypair = keypair
        self.issuer = issuer
        self.audience = audience

    def create_access_token(
        self,
        openslides_user_id: int,
        subject: str = "test-user-uuid",
        email: str = "testuser@example.com",
        username: str = "testuser",
        expires_in: int = 300,
        extra_claims: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Create a mock OIDC access token.

        Args:
            openslides_user_id: The OpenSlides user ID mapped from Keycloak
            subject: The Keycloak user UUID (sub claim)
            email: User email
            username: Keycloak username
            expires_in: Token expiry in seconds
            extra_claims: Additional claims to include

        Returns:
            Encoded JWT token string
        """
        now = datetime.now(timezone.utc)
        payload = {
            "exp": now + timedelta(seconds=expires_in),
            "iat": now,
            "nbf": now,
            "jti": f"token-{int(time.time())}",
            "iss": self.issuer,
            "aud": self.audience,
            "sub": subject,
            "typ": "Bearer",
            "azp": self.audience,
            "scope": "openid email profile",
            "email_verified": True,
            "name": username,
            "preferred_username": username,
            "email": email,
            "openslides_user_id": openslides_user_id,
        }

        if extra_claims:
            payload.update(extra_claims)

        return jwt.encode(
            payload,
            self.keypair.get_private_key_pem(),
            algorithm="RS256",
            headers={"kid": self.keypair.key_id},
        )

    def create_expired_token(
        self,
        openslides_user_id: int,
        **kwargs: Any,
    ) -> str:
        """Create a token that has already expired."""
        now = datetime.now(timezone.utc)
        expired_claims = {
            "exp": now - timedelta(hours=1),
            "iat": now - timedelta(hours=2),
            "nbf": now - timedelta(hours=2),
        }
        return self.create_access_token(
            openslides_user_id,
            extra_claims=expired_claims,
            **kwargs,
        )

    def create_token_with_wrong_issuer(
        self,
        openslides_user_id: int,
        wrong_issuer: str = "http://evil.com/realms/fake",
        **kwargs: Any,
    ) -> str:
        """Create a token with incorrect issuer."""
        now = datetime.now(timezone.utc)
        return self.create_access_token(
            openslides_user_id,
            extra_claims={"iss": wrong_issuer},
            **kwargs,
        )

    def create_token_without_user_id(
        self,
        subject: str = "test-user-uuid",
        email: str = "testuser@example.com",
        **kwargs: Any,
    ) -> str:
        """Create a token missing the openslides_user_id claim."""
        now = datetime.now(timezone.utc)
        payload = {
            "exp": now + timedelta(seconds=300),
            "iat": now,
            "nbf": now,
            "iss": self.issuer,
            "aud": self.audience,
            "sub": subject,
            "email": email,
        }
        return jwt.encode(
            payload,
            self.keypair.get_private_key_pem(),
            algorithm="RS256",
            headers={"kid": self.keypair.key_id},
        )

    def create_token_with_invalid_user_id(
        self,
        invalid_user_id: Any = "not-an-integer",
        **kwargs: Any,
    ) -> str:
        """Create a token with an invalid openslides_user_id type."""
        return self.create_access_token(
            openslides_user_id=1,
            extra_claims={"openslides_user_id": invalid_user_id},
            **kwargs,
        )


class MockJWKSServer:
    """Mock JWKS endpoint response."""

    def __init__(self, keypairs: Optional[List[OIDCKeyPair]] = None):
        self.keypairs = keypairs or []

    def add_keypair(self, keypair: OIDCKeyPair) -> None:
        self.keypairs.append(keypair)

    def get_jwks_response(self) -> Dict[str, Any]:
        """Get JWKS response containing all public keys."""
        return {"keys": [kp.get_jwk() for kp in self.keypairs]}

    def get_jwks_json(self) -> str:
        """Get JWKS response as JSON string."""
        return json.dumps(self.get_jwks_response())


def create_test_oidc_environment(
    user_id: int = 1,
    issuer: str = OIDCTokenFactory.DEFAULT_ISSUER,
) -> Tuple[OIDCKeyPair, OIDCTokenFactory, MockJWKSServer]:
    """
    Create a complete OIDC test environment.

    Returns:
        Tuple of (keypair, token_factory, jwks_server)
    """
    keypair = OIDCKeyPair()
    token_factory = OIDCTokenFactory(keypair, issuer=issuer)
    jwks_server = MockJWKSServer([keypair])
    return keypair, token_factory, jwks_server


def create_invalid_signature_token(
    token_factory: OIDCTokenFactory,
    openslides_user_id: int = 1,
) -> str:
    """
    Create a token signed with a different key (invalid signature).
    """
    different_keypair = OIDCKeyPair(key_id="different-key")
    different_factory = OIDCTokenFactory(
        different_keypair,
        issuer=token_factory.issuer,
        audience=token_factory.audience,
    )
    return different_factory.create_access_token(openslides_user_id)
