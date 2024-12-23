package org.openslides.keycloak.addons;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.keycloak.crypto.Algorithm;
import org.keycloak.crypto.KeyUse;
import org.keycloak.crypto.KeyWrapper;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeyManager;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.openslides.keycloak.addons.action.HttpResponse;
import org.openslides.keycloak.addons.action.OsAction;

import java.io.IOException;
import java.security.interfaces.RSAPrivateKey;
import java.util.Date;

public class OpenSlidesActionClient {

    private final KeycloakSession keycloakSession;
    private final SessionData session;
    private final String actionUrl;

    public interface SessionData {
        ClientModel getClient();
        String getRealmName();
    }

    public OpenSlidesActionClient(KeycloakSession keycloakSession, SessionData session) {
        this.keycloakSession = keycloakSession;
        this.session = session;
        String actionUrl = session.getClient().getAttribute("openslides.action.url");
        if(actionUrl == null) {
            throw new IllegalStateException("Missing openslides-action-url in client attributes");
        }
        this.actionUrl= actionUrl;
    }


    public <PAYLOAD, RESP, ACTION extends OsAction<PAYLOAD, RESP>> HttpResponse<RESP> execute(ACTION osAction) throws Exception {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {

            ObjectMapper objectMapper = new ObjectMapper();
            String jsonPayload = objectMapper.writeValueAsString(osAction);

            String encodedToken = createAccessToken();

            HttpPost post = new HttpPost(actionUrl);
            post.setHeader("Authorization", "Bearer " + encodedToken);
            post.setHeader("Content-Type", "application/json");
            post.setEntity(new StringEntity(jsonPayload));

            try (CloseableHttpResponse response = httpClient.execute(post)) {
                // Check the response and parse JSON
                String responseString = EntityUtils.toString(response.getEntity());
                return new HttpResponse<>(objectMapper.readValue(responseString, osAction.getResponseType()));
            }
        }
    }

    private String createAccessToken() throws IOException {
        KeyManager keyManager = keycloakSession.keys();
        KeycloakContext keycloakContext = keycloakSession.getContext();
        RealmModel realm = keycloakContext.getRealm();
        ClientModel client = keycloakContext.getClient();
        KeyWrapper activeKey = keyManager.getActiveKey(realm, KeyUse.SIG, Algorithm.RS256);
        RSAPrivateKey privateKey = (RSAPrivateKey) activeKey.getPrivateKey();

        if (privateKey == null) {
            throw new IllegalStateException("Private key not found for realm: " + session.getRealmName());
        }

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .issuer("https://example.com")
                .subject("keycloak")
                .claim("role", "admin")
                .expirationTime(new Date(System.currentTimeMillis() + 60 * 1000))
                .build();

        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(activeKey.getKid()).customParam("b2b", "1").build(),
                claimsSet
        );

        JWSSigner signer = new RSASSASigner(privateKey);

        try {
            signedJWT.sign(signer);
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }

        return signedJWT.serialize();
    }
}
