package org.openslides.keycloak.addons;

import org.apache.commons.lang3.StringUtils;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class KeycloakAuthUrlGenerator {
    public static String generate(String realmName, String clientId, String keycloakBaseUrl) {
        try {
            String redirectUri = "https://localhost:8000/";
            String responseType = "code";
            String scopes = "openid profile email";

            String encodedRedirectUri = URLEncoder.encode(redirectUri, StandardCharsets.UTF_8.toString());
            String encodedScopes = URLEncoder.encode(scopes, StandardCharsets.UTF_8.toString());

            String authUrl = String.format(
                "%s/realms/%s/protocol/openid-connect/auth?client_id=%s&redirect_uri=%s&response_type=%s&scope=%s",
                    StringUtils.stripEnd(keycloakBaseUrl.stripLeading(), "/"), realmName, clientId, encodedRedirectUri, responseType, encodedScopes
            );

            return authUrl;
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to encode URL", e);
        }
    }
}