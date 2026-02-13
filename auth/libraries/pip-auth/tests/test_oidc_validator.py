"""
OIDC Token Validation Tests

Tests for RS256 token validation and JWKS integration for OIDC/Keycloak authentication.
"""

import json
import unittest
from typing import Any, Dict, Optional
from unittest.mock import MagicMock, patch

import jwt
import pytest

from osauthlib.exceptions import AuthenticateException, InvalidCredentialsException

from .oidc_fixtures import (
    MockJWKSServer,
    OIDCKeyPair,
    OIDCTokenFactory,
    create_invalid_signature_token,
    create_test_oidc_environment,
)


class OIDCValidator:
    """
    OIDC Token Validator for RS256 signed tokens.

    This validator fetches the JWKS from the identity provider and validates
    tokens signed with RS256 algorithm.
    """

    OIDC_USER_ID_CLAIM = "openslides_user_id"

    def __init__(
        self,
        issuer: str,
        audience: str,
        jwks_uri: str,
        debug_fn: Any = print,
    ):
        self.issuer = issuer
        self.audience = audience
        self.jwks_uri = jwks_uri
        self.debug_fn = debug_fn
        self._jwks_client: Optional[jwt.PyJWKClient] = None

    @property
    def jwks_client(self) -> jwt.PyJWKClient:
        """Lazy-load JWKS client."""
        if self._jwks_client is None:
            self._jwks_client = jwt.PyJWKClient(self.jwks_uri)
        return self._jwks_client

    def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate an OIDC token and return the decoded payload.

        Args:
            token: The JWT token string (without 'bearer ' prefix)

        Returns:
            Decoded token payload

        Raises:
            InvalidCredentialsException: If token validation fails
        """
        self.debug_fn(f"OIDCValidator.validate_token")

        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self.audience,
                issuer=self.issuer,
            )
            return payload
        except jwt.exceptions.InvalidSignatureError:
            raise InvalidCredentialsException("Invalid token signature")
        except jwt.exceptions.ExpiredSignatureError:
            raise InvalidCredentialsException("Token has expired")
        except jwt.exceptions.InvalidIssuerError:
            raise InvalidCredentialsException("Invalid token issuer")
        except jwt.exceptions.InvalidAudienceError:
            raise InvalidCredentialsException("Invalid token audience")
        except jwt.exceptions.DecodeError as e:
            raise InvalidCredentialsException(f"Token decode error: {e}")
        except jwt.exceptions.PyJWKClientError as e:
            raise AuthenticateException(f"JWKS fetch error: {e}")
        except Exception as e:
            raise InvalidCredentialsException(f"Token validation failed: {e}")

    def extract_user_id(self, token: str) -> int:
        """
        Validate token and extract the OpenSlides user ID.

        Args:
            token: The JWT token string

        Returns:
            OpenSlides user ID from the token

        Raises:
            InvalidCredentialsException: If token is invalid or missing user ID
            AuthenticateException: If user ID claim is missing or invalid
        """
        payload = self.validate_token(token)

        user_id = payload.get(self.OIDC_USER_ID_CLAIM)

        if user_id is None:
            raise AuthenticateException(
                f"Missing {self.OIDC_USER_ID_CLAIM} claim in token"
            )

        if not isinstance(user_id, int):
            raise AuthenticateException(
                f"{self.OIDC_USER_ID_CLAIM} must be an integer, got {type(user_id).__name__}"
            )

        return user_id


class TestOIDCValidator(unittest.TestCase):
    """Tests for OIDC token validation."""

    @classmethod
    def setUpClass(cls):
        """Set up test OIDC environment."""
        cls.keypair, cls.token_factory, cls.jwks_server = create_test_oidc_environment()
        cls.issuer = cls.token_factory.issuer
        cls.audience = cls.token_factory.audience

    def _create_validator_with_mock_jwks(self) -> OIDCValidator:
        """Create an OIDCValidator with mocked JWKS client."""
        validator = OIDCValidator(
            issuer=self.issuer,
            audience=self.audience,
            jwks_uri="http://localhost:8080/realms/openslides/protocol/openid-connect/certs",
            debug_fn=lambda x: None,
        )

        mock_jwks_client = MagicMock(spec=jwt.PyJWKClient)

        def get_signing_key_from_jwt(token):
            jwk = self.keypair.get_jwk()
            return jwt.PyJWK.from_dict(jwk)

        mock_jwks_client.get_signing_key_from_jwt = get_signing_key_from_jwt
        validator._jwks_client = mock_jwks_client

        return validator

    def test_validate_valid_token(self):
        """Test validating a properly signed RS256 token."""
        validator = self._create_validator_with_mock_jwks()
        token = self.token_factory.create_access_token(
            openslides_user_id=1,
            email="admin@example.com",
            username="admin",
        )

        payload = validator.validate_token(token)

        self.assertEqual(payload["openslides_user_id"], 1)
        self.assertEqual(payload["email"], "admin@example.com")
        self.assertEqual(payload["preferred_username"], "admin")
        self.assertEqual(payload["iss"], self.issuer)
        self.assertEqual(payload["aud"], self.audience)

    def test_extract_user_id_success(self):
        """Test extracting user ID from valid token."""
        validator = self._create_validator_with_mock_jwks()
        token = self.token_factory.create_access_token(openslides_user_id=42)

        user_id = validator.extract_user_id(token)

        self.assertEqual(user_id, 42)

    def test_extract_user_id_for_admin(self):
        """Test extracting user ID for admin user (user_id=1)."""
        validator = self._create_validator_with_mock_jwks()
        token = self.token_factory.create_access_token(
            openslides_user_id=1,
            username="admin",
        )

        user_id = validator.extract_user_id(token)

        self.assertEqual(user_id, 1)

    def test_extract_user_id_for_testuser(self):
        """Test extracting user ID for test user (user_id=2)."""
        validator = self._create_validator_with_mock_jwks()
        token = self.token_factory.create_access_token(
            openslides_user_id=2,
            username="testuser",
            email="testuser@example.com",
        )

        user_id = validator.extract_user_id(token)

        self.assertEqual(user_id, 2)

    def test_reject_invalid_signature(self):
        """Test rejection of token with invalid signature."""
        validator = self._create_validator_with_mock_jwks()
        token = create_invalid_signature_token(self.token_factory, openslides_user_id=1)

        with self.assertRaises(InvalidCredentialsException) as context:
            validator.validate_token(token)

        self.assertIn("signature", context.exception.message.lower())

    def test_reject_expired_token(self):
        """Test rejection of expired token."""
        validator = self._create_validator_with_mock_jwks()
        token = self.token_factory.create_expired_token(openslides_user_id=1)

        with self.assertRaises(InvalidCredentialsException) as context:
            validator.validate_token(token)

        self.assertIn("expired", context.exception.message.lower())

    def test_reject_wrong_issuer(self):
        """Test rejection of token with wrong issuer."""
        validator = self._create_validator_with_mock_jwks()

        wrong_issuer_keypair = OIDCKeyPair()
        wrong_issuer_factory = OIDCTokenFactory(
            wrong_issuer_keypair,
            issuer="http://evil.example.com/realms/fake",
            audience=self.audience,
        )

        wrong_jwks_server = MockJWKSServer([wrong_issuer_keypair])

        def get_signing_key_from_wrong_issuer(token):
            jwk = wrong_issuer_keypair.get_jwk()
            return jwt.PyJWK.from_dict(jwk)

        validator._jwks_client.get_signing_key_from_jwt = (
            get_signing_key_from_wrong_issuer
        )

        token = wrong_issuer_factory.create_access_token(openslides_user_id=1)

        with self.assertRaises(InvalidCredentialsException) as context:
            validator.validate_token(token)

        self.assertIn("issuer", context.exception.message.lower())

    def test_reject_wrong_audience(self):
        """Test rejection of token with wrong audience."""
        validator = self._create_validator_with_mock_jwks()

        wrong_audience_factory = OIDCTokenFactory(
            self.keypair,
            issuer=self.issuer,
            audience="wrong-client-id",
        )

        token = wrong_audience_factory.create_access_token(openslides_user_id=1)

        with self.assertRaises(InvalidCredentialsException) as context:
            validator.validate_token(token)

        self.assertIn("audience", context.exception.message.lower())

    def test_reject_missing_user_id_claim(self):
        """Test rejection of token missing openslides_user_id claim."""
        validator = self._create_validator_with_mock_jwks()
        token = self.token_factory.create_token_without_user_id()

        with self.assertRaises(AuthenticateException) as context:
            validator.extract_user_id(token)

        self.assertIn("openslides_user_id", context.exception.message)

    def test_reject_invalid_user_id_type_string(self):
        """Test rejection of token with string user_id instead of int."""
        validator = self._create_validator_with_mock_jwks()
        token = self.token_factory.create_token_with_invalid_user_id(
            invalid_user_id="not-an-integer"
        )

        with self.assertRaises(AuthenticateException) as context:
            validator.extract_user_id(token)

        self.assertIn("integer", context.exception.message.lower())

    def test_reject_invalid_user_id_type_float(self):
        """Test rejection of token with float user_id instead of int."""
        validator = self._create_validator_with_mock_jwks()
        token = self.token_factory.create_token_with_invalid_user_id(invalid_user_id=1.5)

        with self.assertRaises(AuthenticateException) as context:
            validator.extract_user_id(token)

        self.assertIn("integer", context.exception.message.lower())

    def test_reject_invalid_user_id_type_null(self):
        """Test rejection of token with null user_id."""
        validator = self._create_validator_with_mock_jwks()
        token = self.token_factory.create_token_with_invalid_user_id(invalid_user_id=None)

        with self.assertRaises(AuthenticateException) as context:
            validator.extract_user_id(token)

        self.assertIn("openslides_user_id", context.exception.message)

    def test_handle_jwks_endpoint_error(self):
        """Test handling of JWKS endpoint connection failure."""
        validator = OIDCValidator(
            issuer=self.issuer,
            audience=self.audience,
            jwks_uri="http://localhost:8080/realms/openslides/protocol/openid-connect/certs",
            debug_fn=lambda x: None,
        )

        mock_jwks_client = MagicMock(spec=jwt.PyJWKClient)
        mock_jwks_client.get_signing_key_from_jwt.side_effect = jwt.PyJWKClientError(
            "Connection refused"
        )
        validator._jwks_client = mock_jwks_client

        token = self.token_factory.create_access_token(openslides_user_id=1)

        with self.assertRaises(AuthenticateException) as context:
            validator.validate_token(token)

        self.assertIn("JWKS", context.exception.message)

    def test_handle_malformed_token(self):
        """Test handling of malformed JWT token."""
        validator = self._create_validator_with_mock_jwks()

        with self.assertRaises(InvalidCredentialsException):
            validator.validate_token("not.a.valid.token")

    def test_handle_empty_token(self):
        """Test handling of empty token."""
        validator = self._create_validator_with_mock_jwks()

        with self.assertRaises(InvalidCredentialsException):
            validator.validate_token("")

    def test_token_contains_required_claims(self):
        """Test that created tokens contain all required OIDC claims."""
        validator = self._create_validator_with_mock_jwks()
        token = self.token_factory.create_access_token(
            openslides_user_id=1,
            subject="user-uuid-123",
            email="test@example.com",
            username="testuser",
        )

        payload = validator.validate_token(token)

        required_claims = ["iss", "aud", "sub", "exp", "iat", "email", "openslides_user_id"]
        for claim in required_claims:
            self.assertIn(claim, payload, f"Missing required claim: {claim}")


class TestOIDCKeyPair(unittest.TestCase):
    """Tests for RSA keypair generation."""

    def test_keypair_generation(self):
        """Test that keypair is properly generated."""
        keypair = OIDCKeyPair()

        self.assertIsNotNone(keypair.private_key)
        self.assertIsNotNone(keypair.public_key)

    def test_private_key_pem_format(self):
        """Test private key PEM format."""
        keypair = OIDCKeyPair()
        pem = keypair.get_private_key_pem()

        self.assertTrue(pem.startswith(b"-----BEGIN PRIVATE KEY-----"))
        self.assertTrue(pem.strip().endswith(b"-----END PRIVATE KEY-----"))

    def test_public_key_pem_format(self):
        """Test public key PEM format."""
        keypair = OIDCKeyPair()
        pem = keypair.get_public_key_pem()

        self.assertTrue(pem.startswith(b"-----BEGIN PUBLIC KEY-----"))
        self.assertTrue(pem.strip().endswith(b"-----END PUBLIC KEY-----"))

    def test_jwk_format(self):
        """Test JWK contains required fields."""
        keypair = OIDCKeyPair(key_id="my-test-key")
        jwk = keypair.get_jwk()

        self.assertEqual(jwk["kty"], "RSA")
        self.assertEqual(jwk["use"], "sig")
        self.assertEqual(jwk["alg"], "RS256")
        self.assertEqual(jwk["kid"], "my-test-key")
        self.assertIn("n", jwk)
        self.assertIn("e", jwk)


class TestMockJWKSServer(unittest.TestCase):
    """Tests for mock JWKS server."""

    def test_jwks_response_format(self):
        """Test JWKS response has correct format."""
        keypair = OIDCKeyPair()
        jwks_server = MockJWKSServer([keypair])

        response = jwks_server.get_jwks_response()

        self.assertIn("keys", response)
        self.assertEqual(len(response["keys"]), 1)
        self.assertEqual(response["keys"][0]["kty"], "RSA")

    def test_multiple_keys(self):
        """Test JWKS with multiple keys."""
        keypair1 = OIDCKeyPair(key_id="key-1")
        keypair2 = OIDCKeyPair(key_id="key-2")
        jwks_server = MockJWKSServer()
        jwks_server.add_keypair(keypair1)
        jwks_server.add_keypair(keypair2)

        response = jwks_server.get_jwks_response()

        self.assertEqual(len(response["keys"]), 2)
        key_ids = [k["kid"] for k in response["keys"]]
        self.assertIn("key-1", key_ids)
        self.assertIn("key-2", key_ids)

    def test_json_output(self):
        """Test JWKS JSON serialization."""
        keypair = OIDCKeyPair()
        jwks_server = MockJWKSServer([keypair])

        json_str = jwks_server.get_jwks_json()
        parsed = json.loads(json_str)

        self.assertIn("keys", parsed)


class TestOIDCTokenFactory(unittest.TestCase):
    """Tests for OIDC token creation."""

    def setUp(self):
        self.keypair = OIDCKeyPair()
        self.factory = OIDCTokenFactory(self.keypair)

    def test_create_valid_token(self):
        """Test creating a valid token."""
        token = self.factory.create_access_token(
            openslides_user_id=1,
            email="test@example.com",
            username="testuser",
        )

        decoded = jwt.decode(
            token,
            self.keypair.get_public_key_pem(),
            algorithms=["RS256"],
            audience=OIDCTokenFactory.DEFAULT_AUDIENCE,
            issuer=OIDCTokenFactory.DEFAULT_ISSUER,
        )

        self.assertEqual(decoded["openslides_user_id"], 1)
        self.assertEqual(decoded["email"], "test@example.com")
        self.assertEqual(decoded["preferred_username"], "testuser")

    def test_token_header_contains_kid(self):
        """Test token header contains key ID."""
        token = self.factory.create_access_token(openslides_user_id=1)

        header = jwt.get_unverified_header(token)

        self.assertEqual(header["kid"], self.keypair.key_id)
        self.assertEqual(header["alg"], "RS256")

    def test_create_expired_token(self):
        """Test creating an already-expired token."""
        token = self.factory.create_expired_token(openslides_user_id=1)

        with self.assertRaises(jwt.ExpiredSignatureError):
            jwt.decode(
                token,
                self.keypair.get_public_key_pem(),
                algorithms=["RS256"],
                audience=OIDCTokenFactory.DEFAULT_AUDIENCE,
                issuer=OIDCTokenFactory.DEFAULT_ISSUER,
            )

    def test_create_token_without_user_id(self):
        """Test creating token without user ID claim."""
        token = self.factory.create_token_without_user_id()

        decoded = jwt.decode(
            token,
            self.keypair.get_public_key_pem(),
            algorithms=["RS256"],
            audience=OIDCTokenFactory.DEFAULT_AUDIENCE,
            issuer=OIDCTokenFactory.DEFAULT_ISSUER,
        )

        self.assertNotIn("openslides_user_id", decoded)


if __name__ == "__main__":
    unittest.main()
