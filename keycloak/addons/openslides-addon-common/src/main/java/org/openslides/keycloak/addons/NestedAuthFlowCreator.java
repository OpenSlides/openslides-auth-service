package org.openslides.keycloak.addons;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import org.apache.commons.lang3.RandomStringUtils;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.AuthenticationManagementResource;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.AuthenticationExecutionRepresentation;
import org.keycloak.representations.idm.AuthenticationFlowRepresentation;
import org.keycloak.representations.idm.RealmRepresentation;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

public class NestedAuthFlowCreator {

    private final Keycloak keycloak;
    private final AuthenticationManagementResource flowsResource;

    private final String realmName;

    public static void main(String[] args) throws IOException {
        // Connect to Keycloak
        Keycloak keycloak = KeycloakBuilder.builder()
                .serverUrl("https://localhost:8000/idp/")
                .realm("master")
                .clientId("admin-cli")
                .username("admin")
                .password("admin")
                .build();

        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        AuthFlowConfig config = mapper.readValue(NestedAuthFlowCreator.class.getResourceAsStream("/flow.yaml"), AuthFlowConfig.class);
        new NestedAuthFlowCreator(keycloak, "os").createFlowWithExecutions(config);

//        final var config = new NestedAuthFlowCreator(keycloak, "os").convertConfigurationForAlias("browser");
//        System.out.println(mapper.writeValueAsString(config));
    }

    public NestedAuthFlowCreator(Keycloak keycloak, String realm) {
        this.keycloak = keycloak;
        this.realmName = realm;
        this.flowsResource = keycloak.realm(realm).flows();
    }

    public AuthFlowConfig convertConfigurationForAlias(String flowAlias) {
        final var flow = flowsResource.getFlows().stream().filter(f -> f.getAlias().equals(flowAlias)).findFirst().orElseThrow();
        return convertConfiguration(flow.getId());
    }

    public AuthFlowConfig convertConfiguration(String flowId) {
        final var flow = flowsResource.getFlow(flowId);
        final var executions = flowsResource.getExecutions(flow.getAlias()).stream().filter(exec -> exec.getLevel() == 0)
                .map(execution -> new Execution(
                        execution.getProviderId(),
                        execution.getRequirement(),
                        execution.getPriority(),
                        execution.getFlowId() != null ? convertConfiguration(execution.getFlowId()) : null
                ))
                .toList();

        return new AuthFlowConfig(
                flow.getAlias(),
                flow.getDescription(),
                flow.getProviderId(),
                executions
        );
    }

    /**
     * Create a new flow with the given configuration.
     * @param config
     * @return The ID of the created flow
     */
    public String createFlowWithExecutions(AuthFlowConfig config) {
        Optional<AuthenticationFlowRepresentation> existingFlow = flowsResource.getFlows().stream().filter(f -> f.getAlias().equals(config.alias())).findFirst();

        if(existingFlow.isPresent()) {
            System.out.println("Flow already exists... deleting: " + config.alias());
            setFlowInRealm("browser");
            flowsResource.deleteFlow(existingFlow.get().getId());
        }


        String flowId = createFlowWithExecutions(config, null);
        setFlowInRealm("openslides-browser");
        return flowId;
    }

    private void setFlowInRealm(String browser) {
        final var realmResource = keycloak.realms().realm(realmName);
        RealmRepresentation realmRepresentation = new RealmRepresentation();
        realmRepresentation.setBrowserFlow(browser);
        realmResource.update(realmRepresentation);
    }

    private String createFlowWithExecutions(AuthFlowConfig config, String parentFlowId) {

        AuthenticationFlowRepresentation flow = new AuthenticationFlowRepresentation();
        flow.setAlias(config.alias()  + (parentFlowId != null ? "-" + RandomStringUtils.insecure().nextAlphabetic(10) : ""));
        flow.setDescription(config.description());
        flow.setProviderId(config.providerId());
        flow.setTopLevel(parentFlowId == null);
        flow.setBuiltIn(false);

        final var flowId = Utils.getObjectId(flowsResource.createFlow(flow));
        System.out.println("Flow created: " + config.alias() + " with ID: " + flowId);

        for (Execution executionConfig : config.executions()) {
            if (executionConfig.isFlow()) {
                final var subFlowId = createFlowWithExecutions(executionConfig.flow(), flowId);

                // Add the sub-flow as an execution
                AuthenticationExecutionRepresentation subFlowExecution = new AuthenticationExecutionRepresentation();
                subFlowExecution.setParentFlow(flowId);
                subFlowExecution.setFlowId(subFlowId);
                subFlowExecution.setAuthenticatorFlow(true);
                subFlowExecution.setRequirement(executionConfig.requirement());
                subFlowExecution.setPriority(executionConfig.priority());

                flowsResource.addExecution(subFlowExecution);
                System.out.println("Sub-flow execution added: " + executionConfig.flow);
            } else {
                // Add a normal authenticator execution
                AuthenticationExecutionRepresentation execution = new AuthenticationExecutionRepresentation();
                execution.setParentFlow(flowId);
                execution.setAuthenticator(executionConfig.authenticator());
                execution.setRequirement(executionConfig.requirement());
                execution.setPriority(executionConfig.priority());
                execution.setAuthenticatorFlow(false);
                flowsResource.addExecution(execution);
                System.out.println("Execution added: " + executionConfig.authenticator());
            }
        }

        return flowId;
    }

    // Record for AuthFlowConfig
    public record AuthFlowConfig(
            String alias,
            String description,
            String providerId,
            List<Execution> executions
    ) {}

    // Record for Execution
    public record Execution(
            String authenticator,
            String requirement,
            int priority,
            AuthFlowConfig flow
    ) {
        boolean isAuthenticator() {
            return authenticator != null;
        }

        boolean isFlow() {
            return flow != null;
        }
    }
}
