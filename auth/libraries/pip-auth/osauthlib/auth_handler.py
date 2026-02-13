from typing import Any, Callable, Dict, Optional, Tuple

from requests import Response

from .constants import ANONYMOUS_USER, AUTHENTICATION_HEADER, COOKIE_NAME
from .database import Database
from .exceptions import AuthorizationException
from .hashing_handler import HashingHandler
from .http_handler import HttpHandler
from .oidc_authenticator import OidcAuthenticator
from .session_handler import SessionHandler
from .token_factory import TokenFactory
from .validator import Validator


class AuthHandler:
    """
    A handler to verify tickets from auth-service and authenticates users. It refreshes
    also access-tokens, if they are expired. It is necessary to pass a url to the
    auth-service for requests to that service. A function to print debug-messages can
    optionally be passed.

    For OIDC/Keycloak authentication, the handler can be configured with OIDC settings
    to validate RS256 tokens directly.
    """

    TOKEN_DB_KEY = "tokens"

    def __init__(
        self,
        debug_fn: Any = print,
        oidc_issuer: Optional[str] = None,
        oidc_audience: Optional[str] = None,
        user_lookup_fn: Optional[Callable[[str], Optional[Dict[str, Any]]]] = None,
    ) -> None:
        self.debug_fn = debug_fn
        self.http_handler = HttpHandler(debug_fn)
        self.validator = Validator(self.http_handler, debug_fn)
        self.token_factory = TokenFactory(self.http_handler, debug_fn)
        self.hashing_handler = HashingHandler()
        self.database = Database(AuthHandler.TOKEN_DB_KEY, debug_fn)
        self.session_handler = SessionHandler(debug_fn)

        # OIDC configuration
        self.oidc_issuer = oidc_issuer
        self.oidc_audience = oidc_audience
        self._oidc_authenticator: Optional[OidcAuthenticator] = None
        # User lookup function for keycloak_id resolution
        self.user_lookup_fn = user_lookup_fn

    @property
    def oidc_authenticator(self) -> Optional[OidcAuthenticator]:
        """Lazy-load OIDC authenticator if configured."""
        if self._oidc_authenticator is None and self.oidc_issuer and self.oidc_audience:
            self._oidc_authenticator = OidcAuthenticator(
                issuer=self.oidc_issuer,
                audience=self.oidc_audience,
                debug_fn=self.debug_fn,
            )
        return self._oidc_authenticator

    def configure_oidc(
        self,
        issuer: str,
        audience: str,
        user_lookup_fn: Optional[Callable[[str], Optional[Dict[str, Any]]]] = None,
    ) -> None:
        """
        Configure OIDC authentication settings.

        Args:
            issuer: The OIDC token issuer URL (Keycloak realm URL)
            audience: The expected audience (client_id)
            user_lookup_fn: Optional function to lookup user by keycloak_id.
                           Takes keycloak_id string, returns user dict or None.
        """
        self.oidc_issuer = issuer
        self.oidc_audience = audience
        self._oidc_authenticator = None  # Reset to force re-creation
        if user_lookup_fn is not None:
            self.user_lookup_fn = user_lookup_fn

    def set_user_lookup_fn(
        self, user_lookup_fn: Callable[[str], Optional[Dict[str, Any]]]
    ) -> None:
        """
        Set the user lookup function for keycloak_id resolution.

        Args:
            user_lookup_fn: Function that takes a keycloak_id string and returns
                           a user dict with at least 'id' and optionally 'is_active',
                           or None if user not found.
        """
        self.user_lookup_fn = user_lookup_fn

    def authenticate(
        self, access_token: Optional[str], refresh_id: Optional[str]
    ) -> Tuple[int, Optional[str]]:
        """
        Tries to check and read a user_id from a given access_token and refresh_id.

        Supports both OpenSlides tokens (HS256) and OIDC/Keycloak tokens (RS256).
        OIDC tokens are detected by their algorithm and validated via JWKS.
        """
        self.debug_fn("Try to authenticate with")
        self.debug_fn(f"AccessToken: {access_token}")
        self.debug_fn(f"RefreshId: {refresh_id}")

        if not access_token:
            self.debug_fn("No access_token")
            return ANONYMOUS_USER, None

        # Check if this is an OIDC token (RS256)
        raw_token = self._extract_bearer_token(access_token)
        if raw_token and self.oidc_authenticator:
            if self.oidc_authenticator.is_oidc_token(raw_token):
                self.debug_fn("Detected OIDC token, validating via JWKS")
                if self.user_lookup_fn:
                    # Use keycloak_id lookup to resolve user
                    self.debug_fn("Using keycloak_id lookup to resolve user")
                    user_id = self.oidc_authenticator.resolve_user_by_keycloak_id(
                        raw_token, self.user_lookup_fn
                    )
                else:
                    # Fallback to extracting user_id from token claim
                    self.debug_fn("Extracting user_id from token claim")
                    user_id = self.oidc_authenticator.extract_user_id(raw_token)
                # OIDC tokens don't have a new access token to return
                return user_id, None

        # Fall back to standard OpenSlides authentication
        if not refresh_id:
            self.debug_fn("No refresh_id for standard auth")
            return ANONYMOUS_USER, None
        return self.validator.verify(access_token, refresh_id)

    def _extract_bearer_token(self, token: str) -> Optional[str]:
        """Extract the token from 'bearer <token>' format."""
        if token and len(token) > 7 and token.lower().startswith("bearer "):
            return token[7:]
        return None

    def authenticate_only_refresh_id(self, refresh_id: Optional[str]) -> int:
        """
        This tries to check and read a user_id from a given refresh_id. It only returns
        an int or raises an error.

        Use this with caution, because using only a refresh_id to verify a valid
        authentication is vulnerable for CSRF-attacks.
        """
        self.debug_fn("Try to authenticate only with")
        self.debug_fn(f"RefreshId: {refresh_id}")
        if not refresh_id:
            self.debug_fn("No refresh_id given")
            return ANONYMOUS_USER
        return self.validator.verify_only_cookie(refresh_id)

    def hash(self, to_hash: str) -> str:
        self.debug_fn(f"Hash {to_hash}: {self.hashing_handler.hash(to_hash)}")
        return self.hashing_handler.hash(to_hash)

    def is_equal(self, to_hash: str, to_compare: str) -> bool:
        return self.hashing_handler.is_equal(to_hash, to_compare)

    def create_authorization_token(self, user_id: int, email: str) -> Response:
        return self.token_factory.create(user_id, email)

    def verify_authorization_token(self, authorization_token: str) -> Tuple[int, str]:
        if self.database.get(authorization_token):
            raise AuthorizationException("Token is already used")
        result = self.validator.verify_authorization_token(authorization_token)
        self.database.set(authorization_token, True, True)
        return result

    def clear_all_sessions(self, access_token: str, refresh_id: str) -> None:
        return self.session_handler.clear_all_sessions(access_token, refresh_id)

    def clear_sessions_by_user_id(self, user_id: int) -> None:
        return self.session_handler.clear_sessions_by_user_id(user_id)

    def sso_login(self, user_id: int) -> Tuple[str, str]:
        """
        Create a session for a user via SSO (OIDC/SAML) login.

        Calls the internal auth service endpoint to create a session for the given user ID.
        Returns the access token and refresh cookie for the session.

        Args:
            user_id: The OpenSlides user ID to create a session for.

        Returns:
            Tuple of (access_token, refresh_cookie)

        Raises:
            AuthenticateException: If session creation fails.
        """
        from .exceptions import AuthenticateException

        self.debug_fn(f"SSO login for user_id: {user_id}")
        response = self.http_handler.send_internal_request(
            "sso-login", {"userId": user_id}
        )
        if response.status_code != 200:
            raise AuthenticateException(
                f"Failed to create SSO session: HTTP {response.status_code}"
            )

        access_token = response.headers.get(AUTHENTICATION_HEADER, "")
        # Extract cookie from Set-Cookie header
        refresh_cookie = ""
        set_cookie = response.headers.get("Set-Cookie", "")
        if set_cookie:
            # Parse refreshId cookie from Set-Cookie header
            for part in set_cookie.split(";"):
                part = part.strip()
                if part.startswith(f"{COOKIE_NAME}="):
                    refresh_cookie = part[len(f"{COOKIE_NAME}=") :]
                    break

        self.debug_fn(f"SSO login successful: access_token={access_token[:20]}...")
        return access_token, refresh_cookie
