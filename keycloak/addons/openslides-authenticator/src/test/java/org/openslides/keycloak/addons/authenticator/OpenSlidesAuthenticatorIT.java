package org.openslides.keycloak.addons.authenticator;

import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import jakarta.ws.rs.client.ClientBuilder;
import org.junit.jupiter.api.Test;
import org.openslides.keycloak.addons.IntegrationTestBase;
import org.openslides.keycloak.addons.KeycloakAuthUrlGenerator;
import org.openslides.keycloak.addons.util.KeycloakPage;
import org.testcontainers.containers.GenericContainer;

import java.util.List;
import java.util.concurrent.ExecutionException;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

public class OpenSlidesAuthenticatorIT extends IntegrationTestBase {

    OpenSlidesAuthenticatorIT() throws Exception {
    }

    @Test
    public void sendEmailVerification_test() throws Exception {
        setupKeycloak();
        setupProxyAndConfigureClient();
        waitForKeycloak();
        configureKeycloakRealm("os");
        setKeycloakLoginTheme(DEFAULT_KEYCLOAK_THEME, "os-ui", "os");

        GenericContainer<?> mockBackend = runner.createWireMockContainer("backend", 9002);
        mockBackend.start();

        final var backendMock = WireMock.create().host(mockBackend.getHost()).port(mockBackend.getFirstMappedPort()).build();
        backendMock.stubFor(get(urlPathEqualTo("/system/action/handle_request"))
                .willReturn(aResponse()
                        .withHeader("Content-Type", "application/json")
                        .withBody("{ \"message\": \"Hello from WireMock\" }")));

        String loginUrl = KeycloakAuthUrlGenerator.generate("os", "os-ui", proxySettings.keycloakUrl());
        new KeycloakPage(proxySettings.keycloakUrl()).triggerLogin(loginUrl, "admin", "admin");
        List<LoggedRequest> requests = backendMock.findAllUnmatchedRequests();
        assertThat(requests).hasSize(1);
    }

    private void waitForKeycloak() {
        for (int i = 0; i < 20; i++) {
            try {
                makeGetRequestToKeycloak();
                break;
            } catch (Exception e) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException ex) {
                    throw new RuntimeException(ex);
                }
            }
        }
    }

    private void makeGetRequestToKeycloak() throws ExecutionException, InterruptedException {
        final var client = ClientBuilder.newClient();
        final var request = client.target(proxySettings.keycloakUrl()).path("realms/master/").request().buildGet();
        if(request.submit().get().getStatus() > 299) {
            System.out.println("Keycloak not ready: " + request.submit().get().getStatus());
            throw new RuntimeException("Keycloak not ready");
        }
    }

}