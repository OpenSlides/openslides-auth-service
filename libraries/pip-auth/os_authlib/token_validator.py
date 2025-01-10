import base64
import json
import os

import requests
from authlib.jose import jwt, JsonWebKey
from authlib.jose.errors import DecodeError
from authlib.oauth2.rfc6750.errors import InvalidTokenError
from authlib.oauth2.rfc9068 import JWTBearerTokenValidator
from authlib.oidc.discovery import OpenIDProviderMetadata, get_well_known_url

from .claims import OpenSlidesAccessTokenClaims, BackchannelTokenClaims
from .session_handler import SessionHandler

def decode_base64url(segment: str) -> bytes:
    pad = 4 - (len(segment) % 4)
    print("adding padding", pad)
    if pad < 4:
        segment += "=" * pad

    print("decoding", segment, len(segment))
    return base64.b64decode(segment)

class JWTBearerOpenSlidesTokenValidator(JWTBearerTokenValidator):
    # Cache the JWKS keys to avoid fetching them repeatedly
    jwk_set = None

    def __init__(self, session_handler: SessionHandler, issuer, issuer_internal,
                 certs_uri,
                 resource_server, *args, **kwargs):
        self.certs_uri = certs_uri
        self.issuerInternal = issuer_internal
        self.session_handler = session_handler
        super().__init__(issuer, resource_server,*args, **kwargs)

    def get_jwks(self):
        if self.jwk_set is None:
            # oidc_configuration = OpenIDProviderMetadata(requests.get(get_well_known_url(self.issuerInternal, True)).json())
            response = requests.get(self.certs_uri)
            response.raise_for_status()
            jwks_keys = response.json()
            self.jwk_set = JsonWebKey.import_key_set(jwks_keys)
        return self.jwk_set

    def authenticate_logout_token(self, token_string):
        claims_options = {
            'iss': {'essential': True, 'validate': self.validate_iss},
            'exp': {'essential': True},
            'aud': {'essential': True, 'value': self.resource_server},
            'sub': {'essential': True},
            'iat': {'essential': True},
            'jti': {'essential': True},
            'acr': {'essential': False},
            'amr': {'essential': False},
            'scope': {'essential': False},
            'groups': {'essential': False},
            'roles': {'essential': False},
            'entitlements': {'essential': False},
            'sid': {'essential': True, 'validate': self.validate_sid},
        }
        jwks = self.get_jwks()

        try:
            return jwt.decode(
                token_string,
                key=jwks,
                claims_cls=BackchannelTokenClaims,
                claims_options=claims_options,
            )
        except DecodeError:
            raise InvalidTokenError(
                realm=self.realm, extra_attributes=self.extra_attributes
            )

    def authenticate_token(self, token_string):
        claims_options = {
            'iss': {'essential': True, 'validate': self.validate_iss},
            'exp': {'essential': True},
            'aud': {'essential': True, 'value': self.resource_server},
            'sub': {'essential': True},
            'client_id': {'essential': True},
            'iat': {'essential': True},
            'jti': {'essential': True},
            'auth_time': {'essential': False},
            'acr': {'essential': False},
            'amr': {'essential': False},
            'scope': {'essential': False},
            'groups': {'essential': False},
            'roles': {'essential': False},
            'entitlements': {'essential': False},
            'sid': {'essential': True, 'validate': self.validate_sid },
            'os_uid': {'essential': True, 'validate': self.validate_os_uid },
        }
        jwks = self.get_jwks()

        # If the JWT access token is encrypted, decrypt it using the keys and algorithms
        # that the resource server specified during registration. If encryption was
        # negotiated with the authorization server at registration time and the incoming
        # JWT access token is not encrypted, the resource server SHOULD reject it.

        # The resource server MUST validate the signature of all incoming JWT access
        # tokens according to [RFC7515] using the algorithm specified in the JWT 'alg'
        # Header Parameter. The resource server MUST reject any JWT in which the value
        # of 'alg' is 'none'. The resource server MUST use the keys provided by the
        # authorization server.

        header_encoded = token_string.split('.')[0]

        # Decode the header (Base64Url decoding)
        header_bytes = decode_base64url(header_encoded)
        header = json.loads(header_bytes)

        claims_cls=OpenSlidesAccessTokenClaims

        # Check if the token is a backchannel token
        if header.get('b2b') is '1':
            claims_options = {
            }
            claims_cls=BackchannelTokenClaims

        try:
            return jwt.decode(
                token_string,
                key=jwks,
                claims_cls=claims_cls,
                claims_options=claims_options,
            )
        except DecodeError:
            raise InvalidTokenError(
                realm=self.realm, extra_attributes=self.extra_attributes
            )

    def validate_sid(self, claims, sid: 'str') -> bool:
        return not self.session_handler.is_session_invalid(sid)

    def validate_os_uid(self, claims, os_uid: 'str') -> bool:
        return os_uid.isdigit()

KEYCLOAK_REALM = os.environ.get("OPENSLIDES_AUTH_REALM")
KEYCLOAK_URL = os.environ.get("OPENSLIDES_KEYCLOAK_URL")
ISSUER_REAL = os.environ.get("OPENSLIDES_TOKEN_ISSUER")
CLIENT_ID = os.environ.get("OPENSLIDES_AUTH_CLIENT_ID")

assert ISSUER_REAL is not None, "OPENSLIDES_TOKEN_ISSUER must be set in environment"
assert KEYCLOAK_REALM is not None, "OPENSLIDES_AUTH_REALM must be set in environment"
assert KEYCLOAK_URL is not None, "OPENSLIDES_KEYCLOAK_URL must be set in environment"
assert CLIENT_ID is not None, "OPENSLIDES_AUTH_CLIENT_ID must be set in environment"

ISSUER_INTERNAL = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"

CERTS_URI = f"{ISSUER_INTERNAL}/protocol/openid-connect/certs"

def create_openslides_token_validator():
    return JWTBearerOpenSlidesTokenValidator(SessionHandler(), ISSUER_REAL, ISSUER_INTERNAL, CERTS_URI,'os')