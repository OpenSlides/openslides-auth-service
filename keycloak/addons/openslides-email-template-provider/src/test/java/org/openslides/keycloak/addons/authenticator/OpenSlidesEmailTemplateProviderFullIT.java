package org.openslides.keycloak.addons.authenticator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.keycloak.admin.client.Keycloak;
import org.openslides.keycloak.addons.IntegrationTestBase;
import org.openslides.keycloak.addons.authenticator.models.EmailItem;
import org.openslides.keycloak.addons.authenticator.models.MailHogResponse;
import org.openslides.keycloak.addons.authenticator.snippets.KeycloakAuthUrlGenerator;
import org.openslides.keycloak.addons.util.KeycloakPage;
import org.slf4j.Logger;
import org.testcontainers.containers.GenericContainer;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@WireMockTest
public class OpenSlidesEmailTemplateProviderFullIT extends IntegrationTestBase {

    private static final Logger LOG = org.slf4j.LoggerFactory.getLogger(OpenSlidesEmailTemplateProviderFullIT.class);

    private GenericContainer<?> keycloak;
    private Keycloak adminClient;
    private GenericContainer<?> backend;
    private GenericContainer<?> mailhog;

    OpenSlidesEmailTemplateProviderFullIT() throws Exception {
    }

    @BeforeAll
    public void startKeycloakAndConfigureRealm() throws Exception {
        this.mailhog = runner.createContainer("mailhog");
        mailhog.start();
        setupKeycloak();

        runner.createContainer("redis").start();
        runner.createContainer("postgres").start();
        runner.createContainer("datastore-reader").start();
        runner.createContainer("datastore-writer").start();

        this.backend = runner.createContainer("backend");
        backend.start();

        setupProxyAndConfigureClient(runner);
        setKeycloakLoginTheme(DEFAULT_KEYCLOAK_THEME, "os-ui", "os");
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
        checkEmailSent();
    }

    private void checkEmailSent() {
        String ipAddress = mailhog.getHost();
        Integer httpPort = mailhog.getMappedPort(8025);
        final var mailHogBaseUrl = String.format("http://%s:%d/api/v2/messages", ipAddress, httpPort);

        final var client = HttpClient.newHttpClient();
        final var objectMapper = new ObjectMapper();

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mailHogBaseUrl))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            MailHogResponse mailHogResponse = objectMapper.readValue(response.body(), MailHogResponse.class);

            // Assertions to verify email content
            assertNotNull(mailHogResponse);
            assertThat(mailHogResponse.total()).isGreaterThan(0);

            EmailItem email = mailHogResponse.items().get(0);
            assertThat(email).isNotNull();
            assertThat(email.content().body()).contains("Hello, this is a test email.");
            assertThat(email.content().headers().to().stream()).anyMatch(to -> to.contains("user@example.com"));

        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
    }
}
