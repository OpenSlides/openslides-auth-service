package org.openslides.keycloak.addons.authenticator;

import org.keycloak.Config;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventListenerProviderFactory;
import org.keycloak.models.KeycloakSession;

public class OpenSlidesLogoutListenerFactory implements EventListenerProviderFactory {

    @Override
    public EventListenerProvider create(KeycloakSession session) {
        return new OpenSlidesLogoutListener(session);
    }

    @Override
    public void init(Config.Scope config) {
    }

    @Override
    public void postInit(org.keycloak.models.KeycloakSessionFactory factory) {
    }

    @Override
    public void close() {
    }

    @Override
    public String getId() {
        return "openslides-logout-listener";
    }
}
