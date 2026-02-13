"""
OIDC Authenticator for per-request authentication.

Validates Keycloak/OIDC access tokens and looks up the corresponding OpenSlides user.
"""

from typing import Any, Callable, Dict, Optional, Tuple

import jwt
from jwt import PyJWKClient

from .exceptions import AuthenticateException, InvalidCredentialsException


class OidcAuthenticator:
    """
    OIDC Token Authenticator for RS256 signed tokens.

    Validates tokens from Keycloak/OIDC providers using JWKS and looks up
    the OpenSlides user by keycloak_id.
    """

    OIDC_USER_ID_CLAIM = "openslides_user_id"

    def __init__(
        self,
        issuer: str,
        audience: str,
        jwks_uri: Optional[str] = None,
        debug_fn: Any = print,
    ):
        """
        Initialize the OIDC authenticator.

        Args:
            issuer: The token issuer URL (Keycloak realm URL)
            audience: The expected audience (client_id)
            jwks_uri: The JWKS endpoint URL (defaults to issuer + /protocol/openid-connect/certs)
            debug_fn: Debug logging function
        """
        self.issuer = issuer
        self.audience = audience
        self.jwks_uri = jwks_uri or f"{issuer}/protocol/openid-connect/certs"
        self.debug_fn = debug_fn
        self._jwks_client: Optional[PyJWKClient] = None

    @property
    def jwks_client(self) -> PyJWKClient:
        """Lazy-load JWKS client."""
        if self._jwks_client is None:
            self._jwks_client = PyJWKClient(self.jwks_uri)
        return self._jwks_client

    def is_oidc_token(self, token: str) -> bool:
        """
        Check if the token looks like an OIDC JWT token.

        OIDC tokens are typically RS256 signed JWTs with a specific issuer.
        OpenSlides tokens are HS256 signed.

        Args:
            token: The token string (without 'bearer ' prefix)

        Returns:
            True if this appears to be an OIDC token
        """
        try:
            # Try to get the header without verification
            header = jwt.get_unverified_header(token)
            # OIDC tokens use RS256, OpenSlides tokens use HS256
            return header.get("alg") == "RS256"
        except jwt.exceptions.DecodeError:
            return False
        except Exception:
            return False

    def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate an OIDC access token and return the decoded payload.

        Args:
            token: The JWT token string (without 'bearer ' prefix)

        Returns:
            Decoded token payload

        Raises:
            InvalidCredentialsException: If token validation fails
            AuthenticateException: If there's a system error (e.g., JWKS fetch)
        """
        self.debug_fn("OidcAuthenticator.validate_token")

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

        The token must contain an 'openslides_user_id' claim that was added
        by Keycloak via a protocol mapper.

        Args:
            token: The JWT access token

        Returns:
            OpenSlides user ID from the token

        Raises:
            InvalidCredentialsException: If token is invalid
            AuthenticateException: If user ID claim is missing or invalid
        """
        payload = self.validate_token(token)

        user_id = payload.get(self.OIDC_USER_ID_CLAIM)

        if user_id is None:
            raise AuthenticateException(
                f"Missing {self.OIDC_USER_ID_CLAIM} claim in token. "
                "Ensure Keycloak has a protocol mapper for OpenSlides user ID."
            )

        if not isinstance(user_id, int):
            raise AuthenticateException(
                f"{self.OIDC_USER_ID_CLAIM} must be an integer, got {type(user_id).__name__}"
            )

        return user_id

    def extract_keycloak_id(self, token: str) -> str:
        """
        Validate token and extract the Keycloak user ID (sub claim).

        Args:
            token: The JWT access token

        Returns:
            The 'sub' claim from the token (Keycloak user UUID)

        Raises:
            InvalidCredentialsException: If token is invalid
            AuthenticateException: If sub claim is missing
        """
        payload = self.validate_token(token)

        keycloak_id = payload.get("sub")
        if not keycloak_id:
            raise AuthenticateException("Missing 'sub' claim in token")

        if not isinstance(keycloak_id, str):
            raise AuthenticateException(
                f"'sub' claim must be a string, got {type(keycloak_id).__name__}"
            )

        return keycloak_id

    def authenticate(self, token: str) -> Tuple[int, Dict[str, Any]]:
        """
        Validate token and return user ID and token payload.

        This method is for use with tokens that contain the openslides_user_id claim.

        Args:
            token: The JWT access token

        Returns:
            Tuple of (user_id, token_payload)

        Raises:
            InvalidCredentialsException: If token is invalid
            AuthenticateException: If user ID claim is missing or invalid
        """
        payload = self.validate_token(token)
        user_id = self.extract_user_id(token)
        return user_id, payload

    def resolve_user_by_keycloak_id(
        self,
        token: str,
        user_lookup_fn: "Callable[[str], Optional[Dict[str, Any]]]",
    ) -> int:
        """
        Validate token, extract keycloak_id (sub claim), and lookup user.

        This method validates the OIDC token, extracts the 'sub' claim as the
        keycloak_id, and uses the provided lookup function to find the
        corresponding OpenSlides user.

        Args:
            token: The JWT access token
            user_lookup_fn: Function that takes a keycloak_id string and returns
                           a user dict with at least 'id' and optionally 'is_active',
                           or None if user not found.

        Returns:
            OpenSlides user ID

        Raises:
            InvalidCredentialsException: If token is invalid
            AuthenticateException: If user not found or user is deactivated
        """
        self.debug_fn("OidcAuthenticator.resolve_user_by_keycloak_id")

        # Validate token and extract keycloak_id (sub claim)
        keycloak_id = self.extract_keycloak_id(token)
        self.debug_fn(f"Looking up user with keycloak_id: {keycloak_id}")

        # Lookup user by keycloak_id
        user = user_lookup_fn(keycloak_id)
        if user is None:
            raise AuthenticateException(f"No user found with keycloak_id: {keycloak_id}")

        # Check if user is active
        if not user.get("is_active", True):
            raise AuthenticateException("User is deactivated")

        user_id = user.get("id")
        if user_id is None:
            raise AuthenticateException("User lookup returned user without id")

        self.debug_fn(f"Resolved keycloak_id {keycloak_id} to user_id {user_id}")
        return user_id
