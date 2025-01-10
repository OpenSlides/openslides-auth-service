package org.openslides.keycloak.addons.authenticator;

import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.Authenticator;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.authentication.AuthenticationFlowError;

import jakarta.ws.rs.core.Response;
import org.openslides.keycloak.addons.OpenSlidesActionClient;
import org.openslides.keycloak.addons.Utils;
import org.openslides.keycloak.addons.action.BackchannelLoginAction;

public class OpenSlidesAuthenticator implements Authenticator {

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        UserModel user = context.getUser();
        String actionUrl = context.getAuthenticationSession().getClient().getAttribute("openslides.action.url");
        if(actionUrl == null) {
            return;
        }
        try {
            final var response = new OpenSlidesActionClient(context.getSession(), new OpenSlidesActionClient.SessionData() {
                @Override
                public ClientModel getClient() {
                    return context.getAuthenticationSession().getClient();
                }

                @Override
                public String getRealmName() {
                    return context.getRealm().getName();
                }
            }).execute(new BackchannelLoginAction(new BackchannelLoginAction.BackchannelLoginActionRequestPayload(user.getId())));

            if(response == null || response.resp() == null) {
                context.failure(AuthenticationFlowError.INTERNAL_ERROR,
                        Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("OpenSlides backend cannot be reached").build());
                return;
            }
            Long userId = response.resp().userId();
            if(userId == null) {
                context.failure(AuthenticationFlowError.INTERNAL_ERROR,
                        Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("Unexpected error").build());
                return;
            }
            context.getAuthenticationSession().setUserSessionNote(Utils.SESSION_NOTE_OPENSLIDES_USER_ID, userId.toString());

            context.success();

        } catch (Exception e) {
            context.failure(AuthenticationFlowError.INTERNAL_ERROR,
                    Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("Unexpected exception").build());
        }
    }

    @Override
    public void action(AuthenticationFlowContext context) {
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
    }

    @Override
    public void close() {
    }
}
