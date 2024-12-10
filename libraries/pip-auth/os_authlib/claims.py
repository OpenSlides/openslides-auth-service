from authlib.jose import JWTClaims
from authlib.jose.errors import InvalidClaimError
from authlib.oauth2.rfc9068.claims import JWTAccessTokenClaims
from os_authlib.constants import USER_ID_PROPERTY, SESSION_ID_PROPERTY

def validate_typ(typValue: str):
    # The resource server MUST verify that the 'typ' header value is 'at+jwt'
    # or 'application/at+jwt' and reject tokens carrying any other value.
    # -- Added jwt for keycloak compatibility
    if typValue.lower() not in ('at+jwt', 'application/at+jwt', 'jwt'):
        raise InvalidClaimError('typ')

class OpenSlidesAccessTokenClaims(JWTAccessTokenClaims):
    REGISTERED_CLAIMS = JWTAccessTokenClaims.REGISTERED_CLAIMS + [
        SESSION_ID_PROPERTY,
        USER_ID_PROPERTY
    ]

    def validate(self, **kwargs):
        super().validate(**kwargs)
        self._validate_claim_value(SESSION_ID_PROPERTY)
        self._validate_claim_value(USER_ID_PROPERTY)

    def validate_typ(self):
        validate_typ(self.header['typ'])

class BackchannelLogoutTokenClaims(JWTClaims):
    REGISTERED_CLAIMS = JWTClaims.REGISTERED_CLAIMS + [
        SESSION_ID_PROPERTY,
    ]

    def validate(self, **kwargs):
        super().validate(**kwargs)
        self._validate_claim_value(SESSION_ID_PROPERTY)

    def validate_typ(self):
        validate_typ(self.header['typ'])
