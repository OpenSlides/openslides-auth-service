package org.openslides.keycloak.addons.emailtemplateprovider.snippets;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Testcontainers
public class WireMockVerificationTest {

    private static Network network;

    @Container
    private static GenericContainer<?> wireMockContainer = new GenericContainer<>("wiremock/wiremock:latest")
            .withNetworkAliases("wiremock")
            .withExposedPorts(8080);

    @BeforeAll
    public static void setup() {
        network = Network.newNetwork();
        wireMockContainer.withNetwork(network);
        wireMockContainer.start();

        configureFor(wireMockContainer.getHost(), wireMockContainer.getFirstMappedPort());
        stubFor(get(urlEqualTo("/mock-endpoint"))
                .willReturn(aResponse()
                        .withHeader("Content-Type", "application/json")
                        .withBody("{ \"message\": \"Hello from WireMock\" }")));
    }

    @Test
    public void testWireMockCall() {
        // Simulate a client making a request to the WireMock server
        String wireMockUrl = "http://" + wireMockContainer.getHost() + ":" + wireMockContainer.getFirstMappedPort() + "/mock-endpoint";
        
        // use your preferred HTTP client library to make the request. Here's an example using HttpClient.
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(wireMockUrl))
                .build();

        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            assertEquals(200, response.statusCode());
            assertEquals("{ \"message\": \"Hello from WireMock\" }", response.body());

            // Verify that the WireMock server was called exactly once with the expected URL
            verify(1, getRequestedFor(urlEqualTo("/mock-endpoint")));
        } catch (Exception e) {
            fail("HTTP request to WireMock failed: " + e.getMessage());
        }
    }
}