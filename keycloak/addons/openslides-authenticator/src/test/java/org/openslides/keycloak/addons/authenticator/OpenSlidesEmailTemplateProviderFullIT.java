package org.openslides.keycloak.addons.authenticator;

import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.keycloak.admin.client.Keycloak;
import org.openslides.keycloak.addons.IntegrationTestBase;
import org.openslides.keycloak.addons.authenticator.snippets.KeycloakAuthUrlGenerator;
import org.openslides.keycloak.addons.util.KeycloakPage;
import org.slf4j.Logger;
import org.testcontainers.containers.GenericContainer;

import static org.assertj.core.api.Assertions.assertThat;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@WireMockTest
public class OpenSlidesEmailTemplateProviderFullIT extends IntegrationTestBase {

    private static final Logger LOG = org.slf4j.LoggerFactory.getLogger(OpenSlidesEmailTemplateProviderFullIT.class);

    private GenericContainer<?> keycloak;
    private Keycloak adminClient;
    private GenericContainer<?> backend;
    private GenericContainer<?> mailhog;

    public OpenSlidesEmailTemplateProviderFullIT() throws Exception {
    }

    @BeforeAll
    public void startKeycloakAndConfigureRealm() throws Exception {
        this.mailhog = runner.createContainer("mailhog");
        mailhog.start();
        setupKeycloak(true);

        runner.createContainer("redis").start();
        runner.createContainer("postgres").start();
        runner.createContainer("datastore-reader").start();
        runner.createContainer("datastore-writer").start();

        this.backend = runner.createContainer("backend");
        backend.start();

        setupProxyAndConfigureClient(runner);
        setKeycloakLoginTheme("keycloak", "os-ui", "os");
    }

    @AfterAll
    public void stopKeycloakContainer() {
        if (adminClient != null) {
            adminClient.close();
        }
        if (keycloak != null) {
            keycloak.stop();
        }
    }

    @Test
    public void checkIfAddonsInstalled() {
        assertThat(keycloak.getLogs()).contains("Initializing OpenSlidesEmailTemplateProviderFactory");
    }

    @Test
    public void testProviderFunctionality() {
        String loginUrl = KeycloakAuthUrlGenerator.generate("os", "os-ui", proxySettings.keycloakUrl());
        new KeycloakPage("https://localhost:8000/idp/").triggerAccountPasswordReset(loginUrl, "admin@localhost");
    }

}
