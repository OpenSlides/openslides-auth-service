package org.openslides.keycloak.addons.authenticator;

import org.keycloak.events.Event;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventType;
import org.keycloak.events.admin.AdminEvent;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.openslides.keycloak.addons.OpenSlidesActionClient;
import org.openslides.keycloak.addons.action.BackchannelLogoutAction;

public class OpenSlidesLogoutListener implements EventListenerProvider {

    private final KeycloakSession session;

    public OpenSlidesLogoutListener(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public void onEvent(Event event) {
        if (event.getType() == EventType.LOGOUT) {
            String sessionId = event.getSessionId();
            RealmModel realm = session.realms().getRealm(event.getRealmId());
            try {
                new OpenSlidesActionClient(session, new OpenSlidesActionClient.SessionData() {
                    @Override
                    public ClientModel getClient() {
                        return session.clients().getClientByClientId(realm, event.getClientId());
                    }

                    @Override
                    public String getRealmName() {
                        return realm.getName();
                    }
                }).execute(new BackchannelLogoutAction(new BackchannelLogoutAction.BackchannelLogoutActionRequest(sessionId)));
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }

    @Override
    public void onEvent(AdminEvent event, boolean includeRepresentation) {
    }

    @Override
    public void close() {
    }
}
