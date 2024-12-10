package org.openslides.keycloak.addons.authenticator;

import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.Authenticator;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.authentication.AuthenticationFlowError;

import jakarta.ws.rs.core.Response;

public class OpenSlidesAuthenticator implements Authenticator {

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        UserModel user = context.getUser();
        try {
            // Beispiel: Externe Daten abrufen
            String externalData = fetchExternalData(user.getId());

            if (externalData == null) {
                // Abbruch bei Fehler
                context.failure(AuthenticationFlowError.INTERNAL_ERROR,
                        Response.status(Response.Status.BAD_REQUEST).entity("External system failed").build());
                return;
            }

            // Daten in die Session-Notizen schreiben
            context.getAuthenticationSession().setUserSessionNote("external_data", externalData);

            // Login fortsetzen
            context.success();

        } catch (Exception e) {
            context.failure(AuthenticationFlowError.INTERNAL_ERROR,
                    Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("Unexpected error").build());
        }
    }

    private String fetchExternalData(String userId) {
        // Simulierter externer API-Call
        return "External data for user: " + userId;
    }

    @Override
    public void action(AuthenticationFlowContext context) {
        // Nicht benötigt für einfache Authenticator-Implementierungen
    }

    @Override
    public boolean requiresUser() {
        return true;
    }

    @Override
    public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
        return true;
    }

    @Override
    public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
        // Nicht erforderlich
    }

    @Override
    public void close() {
        // Ressourcen freigeben, falls nötig
    }
}
