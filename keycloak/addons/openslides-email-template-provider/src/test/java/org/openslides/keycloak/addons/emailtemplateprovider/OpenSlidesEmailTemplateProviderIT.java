package org.openslides.keycloak.addons.emailtemplateprovider;

import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import org.junit.jupiter.api.Test;
import org.openslides.keycloak.addons.emailtemplateprovider.snippets.KeycloakAuthUrlGenerator;
import org.openslides.keycloak.addons.emailtemplateprovider.util.KeycloakPage;
import org.testcontainers.containers.GenericContainer;

import java.util.List;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;

public class OpenSlidesEmailTemplateProviderIT extends IntegrationTestBase {

    OpenSlidesEmailTemplateProviderIT() throws Exception {
    }

    @Test
    public void sendEmailVerification_test() throws Exception {

        setupKeycloak(true);
        setupProxyAndConfigureClient(runner);
        setKeycloakLoginTheme(proxySettings.keycloakUrl(), "os-ui", "os");

        GenericContainer<?> mockBackend = runner.createWireMockContainer("backend", 9002);
        mockBackend.start();

        final var backendMock = WireMock.create().host(mockBackend.getHost()).port(mockBackend.getFirstMappedPort()).build();
        backendMock.stubFor(get(urlPathEqualTo("/system/action/email"))
                .willReturn(aResponse()
                        .withHeader("Content-Type", "application/json")
                        .withBody("{ \"message\": \"Hello from WireMock\" }")));

        String loginUrl = KeycloakAuthUrlGenerator.generate("os", "os-ui", proxySettings.keycloakUrl());
        new KeycloakPage(proxySettings.keycloakUrl()).triggerAccountPasswordReset(loginUrl, "admin@localhost");
        List<LoggedRequest> requests = backendMock.findAllUnmatchedRequests();
        assertThat(requests).hasSize(1);
    }

}