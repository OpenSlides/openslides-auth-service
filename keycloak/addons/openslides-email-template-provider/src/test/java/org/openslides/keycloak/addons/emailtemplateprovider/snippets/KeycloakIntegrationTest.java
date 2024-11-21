package org.openslides.keycloak.addons.emailtemplateprovider.snippets;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.github.tomakehurst.wiremock.http.RequestMethod;
import com.github.tomakehurst.wiremock.matching.RequestPatternBuilder;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static com.github.tomakehurst.wiremock.client.WireMock.*;

// Use Testcontainers annotation to set up environment
@Testcontainers
public class KeycloakIntegrationTest {

    private static Network network;
    private static GenericContainer<?> wireMockContainer;
    private static GenericContainer<?> keycloakContainer;

    @BeforeAll
    public static void setUp() {
        // Create a shared network
        network = Network.newNetwork();
        
        // Set up WireMock container
        wireMockContainer = new GenericContainer<>("wiremock/wiremock:latest")
            .withNetwork(network)
            .withExposedPorts(8080)
            .waitingFor(Wait.forHttp("/__admin").forStatusCode(200));
        
        wireMockContainer.start();

        configureFor(wireMockContainer.getHost(), wireMockContainer.getFirstMappedPort());
        stubFor(get(urlEqualTo("/mock-endpoint"))
                .willReturn(aResponse()
                        .withHeader("Content-Type", "application/json")
                        .withBody("{ \"message\": \"Hello from WireMock\" }")));
        
        // Get the WireMock URL to use
        String wireMockUrl = "http://" + wireMockContainer.getContainerIpAddress() + ":" + wireMockContainer.getFirstMappedPort();
        
        // Set up Keycloak container
        keycloakContainer = new GenericContainer<>("jboss/keycloak:latest")
            .withNetwork(network)
            .withExposedPorts(8080)
            .withEnv("MOCK_SERVICE_URL", wireMockUrl)
            .waitingFor(Wait.forHttp("/auth").forStatusCode(200));
        
        keycloakContainer.start();
        
        // Additional code to configure Keycloak, etc.
    }

    @Test
    void testProviderFunctionality() {
        // Your test code here
    }

    private static void setupBackendMock() {
        // Start WireMock server
        WireMockServer wireMockServer = new WireMockServer(WireMockConfiguration.wireMockConfig().port(8089));
        wireMockServer.start();

        // Configure WireMock to expect a POST request to /backchannel/logout
        wireMockServer.stubFor(post(urlEqualTo("/backchannel/logout"))
                .willReturn(aResponse().withStatus(200)));

        // Verify that the request was received
        List<LoggedRequest> requests = wireMockServer.findRequestsMatching(RequestPatternBuilder.newRequestPattern(RequestMethod.POST, urlPathEqualTo("/backchannel/logout")).build()).getRequests();

        assert requests.size() == 1 : "Expected one backchannel logout request";

        // Stop WireMock server
        wireMockServer.stop();
    }

}