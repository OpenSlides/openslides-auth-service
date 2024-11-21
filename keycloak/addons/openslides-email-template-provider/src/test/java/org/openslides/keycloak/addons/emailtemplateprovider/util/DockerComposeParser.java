package org.openslides.keycloak.addons.emailtemplateprovider.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

class DockerComposeParser {

    public static DockerCompose parseComposeFile(String filePath) throws Exception {
        final var composeFileDir = Path.of(filePath).getParent();
        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        DockerCompose compose = mapper.readValue(new File(filePath), DockerCompose.class);

        for (DockerCompose.Service service : compose.services.values()) {
            if (service.ports != null) {
                List<DockerCompose.PortMapping> parsedPorts = new ArrayList<>();
                for (String port : service.ports) {
                    parsedPorts.add(parsePortMapping(port));
                }
                service.portMappings = parsedPorts;
            }

            if (service.volumes != null) {
                List<DockerCompose.VolumeMapping> parsedVolumes = new ArrayList<>();
                for (String volume : service.volumes) {
                    parsedVolumes.add(parseVolumeMapping(volume, composeFileDir));
                }
                service.volumeMappings = parsedVolumes;
            }

            Object environment = service.environment;
            if (environment instanceof Map<?, ?> envMap) {
                service.environmentMap = (Map<String, String>) envMap;
            } else if (environment instanceof List<?> envList) {
                final var envMap = new HashMap<String, String>();
                for (Object envVar : envList) {
                    String[] parts = envVar.toString().split("=", 2);
                    if (parts.length == 2) {
                        envMap.put(parts[0], parts[1]);
                    }
                }
                service.environmentMap = envMap;
            }

            Object command = service.command;
            if (command instanceof List<?> commandList) {
                service.commandString = commandList.stream().map(Object::toString).collect(Collectors.joining(" "));
            } else if (command instanceof String commandString) {
                service.commandString = commandString;
            }

            if (service.envFile != null) {
                if(service.envFile instanceof String) {
                    service.environmentMap.putAll(parseEnvFile(composeFileDir.resolve((String) service.envFile).toString()));
                } else if (service.envFile instanceof List<?> envFileList) {
                    for (Object envFile : envFileList) {
                        service.environmentMap.putAll(parseEnvFile(composeFileDir.resolve((String) envFile).toString()));
                    }
                }
            }
        }

        return compose;
    }

    private static DockerCompose.PortMapping parsePortMapping(String port) {
        String[] parts = port.split(":");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid port mapping: " + port);
        }
        int hostPort = Integer.parseInt(parts[0]);
        int containerPort = Integer.parseInt(parts[1]);
        return new DockerCompose.PortMapping(hostPort, containerPort);
    }

    private static DockerCompose.VolumeMapping parseVolumeMapping(String volume, Path volumeDir) {
        String[] parts = volume.split(":");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid volume mapping: " + volume);
        }
        String hostPath = volumeDir.resolve(parts[0]).toAbsolutePath().toString();
        String containerPath = parts[1];
        return new DockerCompose.VolumeMapping(hostPath, containerPath);
    }

    private static Map<String, String> parseEnvFile(String filePath) throws IOException {
        Map<String, String> envMap = new HashMap<>();
        List<String> lines = Files.readAllLines(Paths.get(filePath));
        for (String line : lines) {
            line = line.trim();
            if (!line.startsWith("#") && line.contains("=")) {
                String[] parts = line.split("=", 2);
                envMap.put(parts[0].trim(), parts[1].trim());
            }
        }
        return envMap;
    }
}
