package org.openslides.keycloak.addons.util;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@JsonIgnoreProperties("version")
class DockerCompose {
    public Map<String, Service> services;

    @JsonIgnoreProperties({"logging", "depends_on"})
    public static class Service {
        public String image;
        public List<String> ports;
        public List<PortMapping> portMappings = new ArrayList<>();
        public Object environment;
        public Map<String, String> environmentMap = new HashMap<>();
        public List<String> volumes;
        public List<VolumeMapping> volumeMappings = new ArrayList<>();
        public Object command;
        public String commandString;
        @JsonProperty("env_file")
        public Object envFile;
        @JsonProperty("pull_policy")
        public String pullPolicy;
    }

    public static class PortMapping {
        public int hostPort;
        public int containerPort;

        public PortMapping(int hostPort, int containerPort) {
            this.hostPort = hostPort;
            this.containerPort = containerPort;
        }

        @Override
        public String toString() {
            return hostPort + ":" + containerPort;
        }
    }

    public static class VolumeMapping {
        public String hostPath;
        public String containerPath;

        public VolumeMapping(String hostPath, String containerPath) {
            this.hostPath = hostPath;
            this.containerPath = containerPath;
        }
    }
}
