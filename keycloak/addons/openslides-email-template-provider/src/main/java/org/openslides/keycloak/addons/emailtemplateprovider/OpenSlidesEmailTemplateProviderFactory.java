package org.openslides.keycloak.addons.emailtemplateprovider;

import org.keycloak.email.EmailTemplateProvider;
import org.keycloak.email.EmailTemplateProviderFactory;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OpenSlidesEmailTemplateProviderFactory  implements EmailTemplateProviderFactory {
    private static final Logger log = LoggerFactory.getLogger(OpenSlidesEmailTemplateProviderFactory.class);

    @Override
    public EmailTemplateProvider create(KeycloakSession session) {
        log.info("Creating OpenSlidesEmailTemplateProvider");
        return new OpenSlidesEmailTemplateProvider(session);
    }

    @Override
    public void init(org.keycloak.Config.Scope config) {
        log.info("Initializing OpenSlidesEmailTemplateProviderFactory");
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
    }

    @Override
    public void close() {
        log.info("Closing OpenSlidesEmailTemplateProviderFactory");
    }

    @Override
    public String getId() {
        return "openslides-email-template-provider";
    }
}
