package org.openslides.keycloak.addons;

import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import org.jetbrains.annotations.NotNull;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.TestInstance;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.openslides.keycloak.addons.util.DockerComposeRunner;
import org.openslides.keycloak.addons.util.KeycloakErrorLoggingFilter;
import org.openslides.keycloak.addons.util.ProxySettings;
import org.slf4j.Logger;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.MountableFile;

import java.util.List;
import java.util.Map;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@WireMockTest
public class IntegrationTestBase {

    public static final String DEFAULT_KEYCLOAK_THEME = "keycloak";
    private static final Logger LOG = org.slf4j.LoggerFactory.getLogger(IntegrationTestBase.class);
    protected final DockerComposeRunner runner;

    protected GenericContainer<?> keycloak;
    protected Keycloak adminClient;
    protected ProxySettings proxySettings;

    public IntegrationTestBase() throws Exception {
        this.runner = new DockerComposeRunner(System.getProperty("docker-compose.configfile"));
    }

    protected @NotNull GenericContainer<? extends GenericContainer<?>> setupKeycloak() throws InterruptedException {
        String keycloakHostname = "https://localhost:8000/idp/";
        String keycloakRelativePath = "/idp/";
        final var keycloak = runner.createContainerFromImage("quay.io/keycloak/keycloak:26.0.2")
                .withEnv("KC_BOOTSTRAP_ADMIN_USERNAME", "admin")
                .withEnv("KC_BOOTSTRAP_ADMIN_PASSWORD", "admin")
                .withEnv("KEYCLOAK_HOSTNAME", keycloakHostname)
                .withEnv("JAVA_OPTS", "-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005")
                // expose debug port and bind to 15005
                .withExposedPorts(5005)
                .withEnv("KEYCLOAK_HTTP_RELATIVE_PATH", keycloakRelativePath)
                .withCreateContainerCmdModifier(cmd -> {
                    cmd.withEntrypoint("/bin/sh")
                            .withCmd("/opt/keycloak/bin/kc.sh", "start-dev", "--verbose",
                                    "--http-relative-path", keycloakRelativePath, "--proxy-headers", "xforwarded", "--hostname", keycloakHostname, "--hostname-admin", keycloakHostname);
                })
                //"--spi-email-template-provider=openslides-email-template-provider", "--spi-email-template-openslides-email-template-provider-enabled=true")
                .withNetworkAliases("keycloak")
                .withCopyFileToContainer(
                        MountableFile.forHostPath(System.getProperty("keycloak.addon.path")),
                        "/opt/keycloak/providers/openslides-authenticator.jar"
                );
        keycloak.setPortBindings(List.of("15005:5005"));
        runner.addService("keycloak");
        keycloak.start();
        this.keycloak = keycloak;

        return keycloak;
    }

    protected void configureKeycloakRealm(String realmName) {
        new KeycloakConfigurator(proxySettings.keycloakUrl(), "admin", "admin").configureKeycloak(realmName);
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

    protected void setupProxyAndConfigureClient() {
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
