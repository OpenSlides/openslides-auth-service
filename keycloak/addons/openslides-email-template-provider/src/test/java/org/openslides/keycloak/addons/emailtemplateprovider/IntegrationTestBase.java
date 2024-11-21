package org.openslides.keycloak.addons.emailtemplateprovider;

import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import org.jetbrains.annotations.NotNull;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.TestInstance;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.openslides.keycloak.addons.emailtemplateprovider.util.DockerComposeRunner;
import org.openslides.keycloak.addons.emailtemplateprovider.util.KeycloakErrorLoggingFilter;
import org.openslides.keycloak.addons.emailtemplateprovider.util.ProxySettings;
import org.slf4j.Logger;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.MountableFile;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@WireMockTest
public class IntegrationTestBase {

    private static final Logger LOG = org.slf4j.LoggerFactory.getLogger(IntegrationTestBase.class);
    protected final DockerComposeRunner runner;

    protected GenericContainer<?> keycloak;
    protected Keycloak adminClient;
    protected ProxySettings proxySettings;

    IntegrationTestBase() throws Exception {
        this.runner = new DockerComposeRunner(System.getProperty("docker-compose.configfile"));
    }

    protected @NotNull GenericContainer<? extends GenericContainer<?>> setupKeycloak(boolean initOpenSlidesRealm) throws InterruptedException {
        final var keycloak = runner.createContainer("keycloak")
                .withCopyFileToContainer(
                        MountableFile.forHostPath(System.getProperty("keycloak.addon.path")),
                        "/opt/keycloak/providers/openslides-email-template-provider.jar"
                );

        keycloak.start();
        this.keycloak = keycloak;

        if(initOpenSlidesRealm) {
            final var keycloakInit = runner.createContainer("keycloak-init");
            keycloakInit.start();
            Thread.sleep(3000);
        }

        return keycloak;
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

    protected void setupProxyAndConfigureClient(DockerComposeRunner runner) {
        this.proxySettings = runner.setupProxy(keycloak);

        Client client = ClientBuilder.newClient().register(new KeycloakErrorLoggingFilter(keycloak));

        adminClient = KeycloakBuilder.builder()
                .serverUrl(proxySettings.keycloakUrl())
                .realm("master")
                .clientId("admin-cli")
                .username("admin")
                .password("admin")
                .resteasyClient(client)
                .build();
    }

    protected void setKeycloakLoginTheme(String theme, String clientId, String realmName) {
        RealmResource realmResource = adminClient.realm(realmName);

        final var clientRepresentation = realmResource.clients().findByClientId(clientId).get(0);
        clientRepresentation.setAttributes(Map.of("login_theme", theme));
        realmResource.clients().get(clientRepresentation.getId()).
                update(clientRepresentation);
    }

}
