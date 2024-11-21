package org.openslides.keycloak.addons.emailtemplateprovider.util;

import jakarta.ws.rs.client.ClientRequestContext;
import jakarta.ws.rs.client.ClientRequestFilter;
import jakarta.ws.rs.client.ClientResponseContext;
import jakarta.ws.rs.client.ClientResponseFilter;
import org.testcontainers.containers.GenericContainer;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class KeycloakErrorLoggingFilter implements ClientRequestFilter, ClientResponseFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(KeycloakErrorLoggingFilter.class);

    private final GenericContainer<? extends GenericContainer<?>> keycloak;

    public KeycloakErrorLoggingFilter(GenericContainer<? extends GenericContainer<?>> keycloak) {
        this.keycloak = keycloak;
    }

    @Override
    public void filter(ClientRequestContext requestContext) {
    }

    @Override
    public void filter(ClientRequestContext requestContext, ClientResponseContext responseContext) {
        if (responseContext.getStatus() >= 400) { // Check for error status codes
            try (BufferedReader br = new BufferedReader(new InputStreamReader(responseContext.getEntityStream()))) {
                String errorBody = br.lines().collect(Collectors.joining("\n"));
                System.err.println("Error Response: " + errorBody);
                responseContext.setEntityStream(new ByteArrayInputStream(errorBody.getBytes(StandardCharsets.UTF_8)));
                logger.warn(keycloak.getLogs());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}