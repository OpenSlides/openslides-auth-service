package org.openslides.keycloak.addons.authenticator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.stubbing.ServeEvent;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import jakarta.ws.rs.client.ClientBuilder;
import org.junit.jupiter.api.Test;
import org.openslides.keycloak.addons.IntegrationTestBase;
import org.openslides.keycloak.addons.action.BackchannelLoginAction;
import org.openslides.keycloak.addons.action.BackchannelLogoutAction;
import org.openslides.keycloak.addons.util.KeycloakPage;
import org.testcontainers.containers.GenericContainer;

import java.util.List;
import java.util.concurrent.ExecutionException;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.configureFor;
import static com.github.tomakehurst.wiremock.client.WireMock.getAllServeEvents;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.shutdownServer;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

public class OpenSlidesKeycloakExtensionsIT extends IntegrationTestBase {

    OpenSlidesKeycloakExtensionsIT() throws Exception {
    }

    @Test
    public void login_and_logout_test() throws Exception {
        setupKeycloak();
        setupProxyAndConfigureClient();
        waitForKeycloak();
        String realmName = "os";
        String clientId = "os-ui";
        configureKeycloakRealm(realmName);
        setKeycloakLoginTheme(DEFAULT_KEYCLOAK_THEME, clientId, realmName);

        GenericContainer<?> mockBackend = runner.createWireMockContainer("backend", 9002);
        mockBackend.start();

        // http://backend:9002/system/action/handle_request
        configureFor(mockBackend.getHost(), mockBackend.getFirstMappedPort());
        final var mapper = new ObjectMapper();
        final Long userId = 1L;
        stubFor(post(urlPathEqualTo("/system/action/handle_request"))
                .willReturn(aResponse()
                        .withHeader("Content-Type", "application/json")
                        .withBody(mapper.writeValueAsString(new BackchannelLoginAction.BackchannelLoginActionResponse(userId)))));

        KeycloakPage keycloakPage = new KeycloakPage(proxySettings.keycloakUrl(), realmName, clientId);
        final var loginClaims = keycloakPage.triggerLogin("admin", "admin");
        assertThat(loginClaims.getClaim("os_user_id")).isEqualTo(userId.toString());
        List<ServeEvent> serveEvents = getAllServeEvents();
        assertThat(serveEvents).hasSize(1);
        LoggedRequest backchannelLoginRequest = serveEvents.get(0).getRequest();
        final var authHeader = backchannelLoginRequest.getHeader("Authorization");
        assertThat(authHeader).startsWith("Bearer ");

        keycloakPage.doLogoutRequest();

        serveEvents = getAllServeEvents();
        assertThat(serveEvents).hasSize(2);
        final var rawLogoutRequest = mapper.readTree(serveEvents.get(0).getRequest().getBody());
        final var logoutRequest = mapper.treeToValue(rawLogoutRequest.get("data"), BackchannelLogoutAction.BackchannelLogoutActionRequest.class);
        assertThat(logoutRequest.sessionId()).isNotBlank();

        shutdownServer();
    }

    private void waitForKeycloak() {
        for (int i = 0; i < 20; i++) {
            try {
                checkKeycloakAvailable();
                break;
            } catch (Exception e) {
                try {
                    Thread.sleep(500);
                } catch (InterruptedException ex) {
                    throw new RuntimeException(ex);
                }
            }
        }
    }

    private void checkKeycloakAvailable() throws ExecutionException, InterruptedException {
        final var client = ClientBuilder.newClient();
        final var request = client.target(proxySettings.keycloakUrl()).path("realms/master/").request().buildGet();
        if(request.submit().get().getStatus() > 299) {
            System.out.println("Keycloak not ready: " + request.submit().get().getStatus());
            throw new RuntimeException("Keycloak not ready");
        }
    }

}