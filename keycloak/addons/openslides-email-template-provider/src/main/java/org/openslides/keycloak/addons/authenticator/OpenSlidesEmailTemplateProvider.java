package org.openslides.keycloak.addons.authenticator;

import org.keycloak.crypto.Algorithm;
import org.keycloak.crypto.KeyUse;
import org.keycloak.crypto.KeyWrapper;
import org.keycloak.email.EmailException;
import org.keycloak.email.EmailTemplateProvider;
import org.keycloak.events.Event;
import org.keycloak.models.ClientModel;
import org.keycloak.models.ClientSessionContext;
import org.keycloak.models.KeyManager;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.OrganizationModel;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.protocol.oidc.TokenManager;
import org.keycloak.representations.AccessToken;
import org.keycloak.sessions.AuthenticationSessionModel;
import org.openslides.keycloak.addons.OpenSlidesActionClient;
import org.openslides.keycloak.addons.action.UserForgotPasswordAction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.interfaces.RSAPrivateKey;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class OpenSlidesEmailTemplateProvider implements EmailTemplateProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenSlidesEmailTemplateProvider.class);
    private final KeycloakSession keycloakSession;

    private RealmModel realm;
    private UserModel user;
    private AuthenticationSessionModel session;
    private Map<String, Object> attributes = new HashMap<>();

    public OpenSlidesEmailTemplateProvider(KeycloakSession session) {
        keycloakSession = session;
    }

    @Override
    public EmailTemplateProvider setAuthenticationSession(AuthenticationSessionModel authenticationSession) {
        this.session = authenticationSession;
        return this;
    }

    @Override
    public EmailTemplateProvider setRealm(RealmModel realm) {
        this.realm = realm;
        return this;
    }

    @Override
    public EmailTemplateProvider setUser(UserModel user) {
        attributes.clear();
        this.user = user;
        return this;
    }

    @Override
    public EmailTemplateProvider setAttribute(String name, Object value) {
        attributes.put(name, value);
        return this;
    }

    @Override
    public void close() {
        // Clean-up resources if necessary
    }

    @Override
    public void sendEvent(Event event) throws EmailException {
        log.info("send event");
    }

    @Override
    public void sendPasswordReset(String link, long expirationInMinutes) throws EmailException {
        String clientId = getClientIdFromAuthSession(session);

        KeyManager keyManager = keycloakSession.keys();
        KeyWrapper activeKey = keyManager.getActiveKey(realm, KeyUse.SIG, Algorithm.RS256);
        RSAPrivateKey privateKey = (RSAPrivateKey) activeKey.getPrivateKey();

        if (privateKey == null) {
            throw new IllegalStateException("Private key not found for realm: " + session.getRealm().getName());
        }

        // Access TokenManager
        TokenManager tokenManager = new TokenManager();

        // Example: Create an Access Token
        KeycloakContext keycloakContext = keycloakSession.getContext();
        RealmModel realm = keycloakContext.getRealm();
        ClientModel client = keycloakContext.getClient();

        ClientSessionContext context = (ClientSessionContext) keycloakSession.getAttribute(ClientSessionContext.class.getName());
        AccessToken token = tokenManager.createClientAccessToken(keycloakSession, realm, client, session.getAuthenticatedUser(), context.getClientSession().getUserSession(), context);


        // Create AccessToken instance
//        AccessToken accessToken = new AccessToken();
//        accessToken.setSubject(user.getId());
//        accessToken.setRealmAccess(new AccessToken.Access().addRole("user"));
//        accessToken.issuedNow();
//        accessToken.exp(((System.currentTimeMillis() / 1000) + 3600));
//        accessToken.issuer(Urls.realmIssuer(keycloakContext.getUri().getBaseUri(), realm.getName()));
//        accessToken.audience(clientId);

//        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
//                .issuer(AdminRoot.getBaseUrl(realm))
//                .subject(clientId)
//                .audience("client-id")
//                .issueTime(new Date())
//                .expirationTime(new Date(System.currentTimeMillis() + 3600 * 1000)) // 1 hour
//                .build();

        // Create the signed JWT
//        SignedJWT signedJWT = new SignedJWT(
//                new JWSHeader.Builder(JWSAlgorithm.RS256).keyID("123").build(),
//                claimsSet
//        );

        // Sign the JWT
//        JWSSigner signer = new RSASSASigner(privateKey);
//        try {
//            signedJWT.sign(signer);
//        } catch (JOSEException e) {
//            throw new RuntimeException(e);
//        }
//
//        // Serialize to compact form
//        String jwtString = signedJWT.serialize();
//        System.out.println("Signed JWT: " + jwtString);
//        System.out.println("Authenticated clientId: " + clientId);

        final var actionUrl = session.getClient().getAttribute("openslides.action.url");

        if (actionUrl != null && !actionUrl.isEmpty()) {
            new OpenSlidesActionClient(actionUrl).execute(new UserForgotPasswordAction(), new UserForgotPasswordAction.Request(link, expirationInMinutes, user.getEmail()));
        }
    }

    public static String getClientIdFromAuthSession(AuthenticationSessionModel authSession) {
        ClientModel client = authSession.getClient();
        return client != null ? client.getClientId() : null;
    }

    @Override
    public void sendSmtpTestEmail(Map<String, String> config, UserModel user) throws EmailException {
        log.info("send smtp test email");
    }

    @Override
    public void sendConfirmIdentityBrokerLink(String link, long expirationInMinutes) throws EmailException {
        log.info("send confirm identity broker link");
    }

    @Override
    public void sendExecuteActions(String link, long expirationInMinutes) throws EmailException {
        log.info("send execute actions");
    }

    @Override
    public void sendVerifyEmail(String link, long expirationInMinutes) throws EmailException {
        log.info("send verify email");
    }

    @Override
    public void sendOrgInviteEmail(OrganizationModel organizationModel, String s, long l) throws EmailException {
        log.info("send org invite email");
    }

    @Override
    public void sendEmailUpdateConfirmation(String link, long expirationInMinutes, String address) throws EmailException {
        log.info("send email update confirmation");
    }

    @Override
    public void send(String subjectFormatKey, String bodyTemplate, Map<String, Object> bodyAttributes) throws EmailException {
        log.info("send");
    }

    @Override
    public void send(String subjectFormatKey, List<Object> subjectAttributes, String bodyTemplate, Map<String, Object> bodyAttributes) throws EmailException {
        log.info("send");
    }

    private void sendPostRequest(String urlString, String jwtString) {
        try {
            HttpURLConnection connection = getHttpURLConnection(urlString, jwtString);

            int responseCode = connection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                log.info("POST request to {} succeeded.", urlString);
            } else {
                log.warn("POST request to {} failed with response code: {}", urlString, responseCode);
            }

            connection.disconnect();
        } catch (Exception e) {
            log.error("Error sending POST request to URL: " + urlString, e);
        }
    }

    private static HttpURLConnection getHttpURLConnection(String urlString, String payload) throws IOException {
        URL url = new URL(urlString);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);

        try (OutputStream os = connection.getOutputStream()) {
            byte[] input = payload.getBytes("utf-8");
            os.write(input, 0, input.length);
        }
        return connection;
    }

    // Encodes and signs a token
//    public String encodeToken(KeycloakSession session, RealmModel realm, AccessToken token) {
//        // Retrieve the current active signing key for the realm
//        KeyWrapper activeKey = session.keys().getActiveKey(realm, KeyUse.SIG, Algorithm.RS256);
//
//        // Create JWT with necessary claims
//        JWSHeader jwsHeader = new JWSHeader(Algorithm.RS256);
//        SignedJWT signedJWT = new SignedJWT(jwsHeader, token.toJWTClaimsSet());
//
//        // Sign the JWT with the private key
//        JWSSigner signer = new RSASSASigner(activeKey.getPrivateKey());
//        signedJWT.sign(signer);
//
//        // Return the signed JWT in compact form
//        return signedJWT.serialize();
//    }

//    private void sendBackchannelLogoutIfConfigured() {
//        ClientModel client = getClientInContext();
//        if (client == null) {
//            log.warn("No client found in session context");
//            return;
//        }
//
//        String backchannelLogoutUrl = client.getAttribute("backchannel.logout.url");
//        if (backchannelLogoutUrl == null || backchannelLogoutUrl.isEmpty()) {
//            log.warn("No backchannel logout URL configured for client: {}", client.getClientId());
//            return;
//        }
//
//        log.info("Sending POST request to backchannel logout URL: {}", backchannelLogoutUrl);
//        sendPostRequest(backchannelLogoutUrl, jwtString);
//    }


}
