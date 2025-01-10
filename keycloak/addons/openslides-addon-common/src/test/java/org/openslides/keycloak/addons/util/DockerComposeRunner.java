package org.openslides.keycloak.addons.util;

import org.apache.commons.collections4.MultiValuedMap;
import org.apache.commons.collections4.multimap.ArrayListValuedHashMap;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class DockerComposeRunner {

    private final Network network;
    private final DockerCompose compose;
    private List<String> services = new ArrayList<>();
    private GenericContainer<?> proxy;

    private Map<String, Collection<String>> serviceToEnvVarPrefixMapping = new HashMap<>();

    public GenericContainer<?> createContainer(String name) {
        if (proxy != null) {
            throw new IllegalStateException("Proxy must be set up last");
        }
        services.add(name);
        final var serviceConfig = compose.services.get(name);

        try (GenericContainer<?> container = new GenericContainer<>(serviceConfig.image)) {
            container.withNetworkAliases(name);
            container.withNetwork(network);

            container.withEnv(serviceConfig.environmentMap);

            for (DockerCompose.PortMapping portMapping : serviceConfig.portMappings) {
                container.addExposedPort(portMapping.containerPort);
            }

            container.setPortBindings(serviceConfig.portMappings.stream()
                    .map(DockerCompose.PortMapping::toString)
                    .collect(Collectors.toList()));

            for (DockerCompose.VolumeMapping volumeMapping : serviceConfig.volumeMappings) {
                container.withFileSystemBind(volumeMapping.hostPath, volumeMapping.containerPath);
            }

            if (serviceConfig.command != null) {
                container.withCommand(serviceConfig.commandString);
            }

            return container;
        }
    }

    public void addService(String name) {
        services.add(name);
    }

    public DockerComposeRunner(String composeConfigPath) throws Exception {
        this.network = Network.newNetwork();
        this.compose = DockerComposeParser.parseComposeFile(composeConfigPath);
        MultiValuedMap<String, String> serviceToEnvVarPrefixMapping = new ArrayListValuedHashMap<>();
        for (Map.Entry<String, String> entry : compose.services.get("proxy").environmentMap.entrySet()) {
            if (entry.getValue().matches("\\d+")) {
                continue;
            }
            serviceToEnvVarPrefixMapping.put(entry.getValue(), entry.getKey().split("_")[0]);
        }
        this.serviceToEnvVarPrefixMapping = serviceToEnvVarPrefixMapping.asMap();
    }

    public GenericContainer<?> createWireMockContainer(String networkAlias, int port) {
        return new GenericContainer<>("wiremock/wiremock:3.9.2")
                .withNetwork(network)
                .withNetworkAliases(networkAlias)
                .withExposedPorts(port)
                .withCommand( "--port", port + "")
                .waitingFor(Wait.forHttp("/__admin").forStatusCode(200));
    }

    public ProxySettings setupProxy(GenericContainer<? extends GenericContainer<?>> container) {
        proxy = createContainer("proxy");
        final var wantedPrefixes = services.stream().
                filter(service -> serviceToEnvVarPrefixMapping.containsKey(service)).flatMap(service -> serviceToEnvVarPrefixMapping.get(service).stream()).toList();
        List<Map.Entry<String, String>> entryStream = compose.services.get("proxy").environmentMap.entrySet().stream().filter(entry -> {
            String prefix = entry.getKey().split("_")[0];
            return wantedPrefixes.contains(prefix);
        }).toList();
        final var env = entryStream.stream().collect(Collectors.toMap(e -> e.getKey(), entry -> entry.getValue()));
        proxy.withEnv(env);
        proxy.start();

        String keycloakUrl = "https://" + proxy.getHost() + ":" + proxy.getFirstMappedPort() + "/idp/";
        return new ProxySettings(keycloakUrl);
    }

    public GenericContainer<?> createContainerFromImage(String imageName) {
        return new GenericContainer<>(imageName)
                .withNetwork(network);
    }
}
