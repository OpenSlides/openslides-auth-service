package org.openslides.keycloak.addons;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.AuthenticationManagementResource;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.AuthenticationExecutionInfoRepresentation;
import org.keycloak.representations.idm.AuthenticationExecutionRepresentation;
import org.keycloak.representations.idm.AuthenticationFlowRepresentation;
import org.keycloak.representations.idm.ClientRepresentation;
import org.keycloak.representations.idm.ClientScopeRepresentation;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.ProtocolMapperRepresentation;
import org.keycloak.representations.idm.RealmRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

import java.util.List;
import java.util.Map;

public class KeycloakConfigurator {

    private final Keycloak keycloak;

    public static void main(String[] args) {
        String serverUrl = System.getenv("KEYCLOAK_URL");
        String username = System.getenv("KEYCLOAK_ADMIN");
        String password = System.getenv("KEYCLOAK_ADMIN_PASSWORD");
        String realmName = "os";
        new KeycloakConfigurator(serverUrl, username, password).configureKeycloak(realmName);
    }
    
    KeycloakConfigurator(String serverUrl, String username, String password) {

        this.keycloak = KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm("master")
                .username(username)
                .password(password)
                .clientId("admin-cli")
                .build();
    }

    public void configureKeycloak(String realmName) {
        createOrGetRealm(realmName);
        String clientScopeName = "os";
        String clientName = "os-ui";
        List<Map<String, Object>> protocolMappers = createProtocolMappers();

        configureAuthenticator(realmName);

//        createOrGetClientScope(realmName, clientScopeName, protocolMappers);
//        createOrGetClient(realmName, clientName, clientScopeName);
//        List<Map<String, Object>> users = List.of(
//                Map.of("username", "admin", "password", "admin"),
//                Map.of("username", "user", "password", "password")
//        );
//        createOrGetUser(realmName, users);
    }

    private void createOrGetUser(String realmName, List<Map<String, Object>> users) {
        keycloak.realm(realmName);
        RealmResource realm = keycloak.realms().realm(realmName);
        for (Map<String, Object> userData : users) {
            final var existingUsers = realm.users().search(userData.get("username").toString());
            UserRepresentation userRepresentation = new UserRepresentation();
            userRepresentation.setUsername(userData.get("username").toString());
            userRepresentation.setEmail(userData.get("username") + "@localhost");
            userRepresentation.setEnabled(true);
            userRepresentation.setEmailVerified(true);
            userRepresentation.setFirstName(userData.get("username").toString());
            userRepresentation.setLastName("User");
            CredentialRepresentation credentialRepresentation = new CredentialRepresentation();
            credentialRepresentation.setType("password");
            credentialRepresentation.setValue(userData.get("password").toString());
            credentialRepresentation.setTemporary(false);
            userRepresentation.setCredentials(List.of(credentialRepresentation));

            if (existingUsers.isEmpty()) {
                realm.users().create(userRepresentation);
                System.out.println("Created user: " + userData.get("username"));
            } else {
                realm.users().get(existingUsers.get(0).getId()).update(userRepresentation);
                System.out.println("User " + userData.get("username") + " already exists.");
            }
        }
    }

    private void createOrGetRealm(String realmName) {
        try {
            keycloak.realms().realm(realmName).toRepresentation();
            System.out.println("Realm " + realmName + " already exists.");
        } catch (Exception e) {
            RealmRepresentation realm = new RealmRepresentation();
            realm.setRealm(realmName);
            realm.setEnabled(true);
            realm.setResetPasswordAllowed(true);
            realm.setSmtpServer(Map.of(
                    "host", "smtp.example.com",
                    "port", "587",
                    "from", "no-reply@example.com",
                    "auth", "true",
                    "user", "smtp_user",
                    "password", "smtp_password",
                    "ssl", "false",
                    "starttls", "true"
            ));
            keycloak.realms().create(realm);
            System.out.println("Created realm: " + realmName);
        }
    }

    private void configureAuthenticator(String realmName) {
        final var flowAlias = "openslides-browser-flow";

        RealmResource realm = keycloak.realms().realm(realmName);
        AuthenticationManagementResource realmFlows = realm.flows();

        AuthenticationFlowRepresentation existingFlow = realmFlows.getFlows().stream()
                .filter(f -> f.getAlias().equals(flowAlias))
                .findFirst()
                .orElse(null);
        if(existingFlow != null) {
            realmFlows.deleteFlow(existingFlow.getId());
        }

        realmFlows.copy("browser", Map.of("newName", flowAlias));

        List<AuthenticationFlowRepresentation> flows = realmFlows.getFlows();
        AuthenticationFlowRepresentation flow = flows.stream()
                .filter(f -> f.getAlias().equals(flowAlias))
                .findFirst()
                .orElse(null);

        List<AuthenticationExecutionInfoRepresentation> executions = realmFlows.getExecutions(flowAlias);
        int maxPriority = executions.stream()
                .mapToInt(AuthenticationExecutionInfoRepresentation::getPriority)
                .max()
                .orElse(0);

        // convert each execution to a sub-flow
        for(AuthenticationExecutionInfoRepresentation execution : executions) {
            if(execution.getLevel() > 0) {
                continue;
            }
            if(execution.getAuthenticationFlow() != null && execution.getAuthenticationFlow()) {

            } else {
                final var newFlow = new AuthenticationFlowRepresentation();
                String newFlowAlias = "openslides-subflow-" + execution.getProviderId();
                newFlow.setAlias(newFlowAlias);
                newFlow.setTopLevel(false);
                newFlow.setProviderId("basic-flow");
                newFlow.setBuiltIn(false);
                newFlow.setDescription("Sub-Flow for " + execution.getDescription());
                final var response = realmFlows.createFlow(newFlow);
//                newFlow.setAuthenticationExecutions(List.of(execution));

                final var flowExecution = new AuthenticationExecutionRepresentation();
                flowExecution.setPriority(execution.getPriority());
                flowExecution.setFlowId("newFlowId");
                flowExecution.setParentFlow(flowAlias);
                flowExecution.setAuthenticatorFlow(true);
                flowExecution.setRequirement(execution.getRequirement());
                realmFlows.addExecution(flowExecution);
                realmFlows.removeExecution(execution.getId());
            }
//            realmFlows.addExecutionFlow(flowAlias, Map.of(
//                    // random alias
//                    "alias", RandomStringUtils.randomAlphabetic(10),
//                    "type", "subFlow",
//                    "priority", execution.getPriority(),
//                    "description", execution.getDescription() != null ? execution.getDescription() : ""
//            ));
        }

        List<AuthenticationExecutionInfoRepresentation> executionsNew = realmFlows.getExecutions(flowAlias);
        System.out.printf(executionsNew.toString());
        final var authenticator = new AuthenticationExecutionRepresentation();
        authenticator.setAuthenticator("openslides-authenticator");
        authenticator.setRequirement("OPTIONAL");
        authenticator.setPriority(maxPriority + 1);
        authenticator.setParentFlow(flow.getId());
        realmFlows.addExecution(authenticator);

//        RealmRepresentation realmRepresentation = new RealmRepresentation();
//        realmRepresentation.setBrowserFlow(flowAlias);
//        realm.update(realmRepresentation);
        System.out.println("Custom authenticator added to flow: openslides-browser-flow");
    }

    private void createOrGetClientScope(String realmName, String clientScopeName, List<Map<String, Object>> protocolMappers) {
        List<ClientScopeRepresentation> clientScopes = keycloak.realms().realm(realmName).clientScopes().findAll();
        ClientScopeRepresentation clientScope = clientScopes.stream()
                .filter(cs -> cs.getName().equals(clientScopeName))
                .findFirst()
                .orElse(null);

        if (clientScope == null) {
            clientScope = new ClientScopeRepresentation();
            clientScope.setName(clientScopeName);
            clientScope.setProtocol("openid-connect");
            final var response = keycloak.realms().realm(realmName).clientScopes().create(clientScope);
            // reponse.location contains something like https://localhost:8000/idp/admin/realms/os/client-scopes/bb3fefa8-e212-4ce0-afea-9e4021da989b
            String clientScopeId = response.getLocation().getPath().substring(response.getLocation().getPath().lastIndexOf("/") + 1);
            clientScope.setId(clientScopeId);
            System.out.println("Created client scope: " + clientScopeName);
        }

        for (Map<String, Object> mapper : protocolMappers) {
            String mapperName = (String) mapper.get("name");

            String clientScopeId = clientScope.getId();
            List<ProtocolMapperRepresentation> existingMappers = keycloak.realms().realm(realmName)
                    .clientScopes().get(clientScopeId).getProtocolMappers().getMappers();

            boolean mapperExists = existingMappers.stream()
                    .anyMatch(existingMapper -> existingMapper.getName().equals(mapperName));

            if (!mapperExists) {
                // Create a new mapper
                ProtocolMapperRepresentation newMapper = new ProtocolMapperRepresentation();
                newMapper.setName(mapperName);
                newMapper.setProtocol((String) mapper.get("protocol"));
                newMapper.setProtocolMapper((String) mapper.get("protocolMapper"));
                newMapper.setConfig((Map<String, String>) mapper.get("config"));

                // Add the mapper to the client scope
                keycloak.realms().realm(realmName).clientScopes().get(clientScopeId).getProtocolMappers().createMapper(newMapper);
                System.out.println("Added protocol mapper: " + mapperName + " to client scope: " + clientScopeName);
            } else {
                System.out.println("Protocol mapper " + mapperName + " already exists in client scope: " + clientScopeName);
            }
        }
    }

    private List<Map<String, Object>> createProtocolMappers() {
        return List.of(
                // client_id is required by RFC 9068
                createProtocolMapper("client-id-mapper", "oidc-hardcoded-claim-mapper", Map.of(
                        "claim.name", "client_id",
                        "claim.value", "os",
                        "id.token.claim", "true",
                        "access.token.claim", "true",
                        "userinfo.token.claim", "true"
                )),
                // audience is required by RFC 9068
                createProtocolMapper("audience-mapper", "oidc-audience-mapper", Map.of(
                        "included.custom.audience", "os",
                        "id.token.claim", "true",
                        "access.token.claim", "true"
                )),
                createProtocolMapper("email-mapper", "oidc-usermodel-property-mapper", Map.of(
                        "user.attribute", "email",
                        "claim.name", "email",
                        "id.token.claim", "true",
                        "access.token.claim", "true",
                        "jsonType.label", "String"
                )),
                createProtocolMapper("userid-mapper", "oidc-usermodel-attribute-mapper", Map.of(
                        "user.attribute", "os-userid",
                        "claim.name", "userId",
                        "id.token.claim", "true",
                        "access.token.claim", "true",
                        "jsonType.label", "String"
                )),
                createProtocolMapper("username-mapper", "oidc-usermodel-property-mapper", Map.of(
                        "user.attribute", "username",
                        "claim.name", "username",
                        "id.token.claim", "true",
                        "access.token.claim", "true",
                        "jsonType.label", "String"
                )),
                createProtocolMapper("firstname-mapper", "oidc-usermodel-property-mapper", Map.of(
                        "user.attribute", "firstName",
                        "claim.name", "firstName",
                        "id.token.claim", "true",
                        "access.token.claim", "true",
                        "jsonType.label", "String"
                )),
                createProtocolMapper("lastname-mapper", "oidc-usermodel-property-mapper", Map.of(
                        "user.attribute", "lastName",
                        "claim.name", "lastName",
                        "id.token.claim", "true",
                        "access.token.claim", "true",
                        "jsonType.label", "String"
                ))
        );
    }

    private void createOrGetClient(String realmName, String clientName, String clientScopeName) {
        List<ClientRepresentation> clients = keycloak.realms().realm(realmName).clients().findAll();
        ClientRepresentation client = clients.stream()
                .filter(c -> c.getClientId().equals(clientName))
                .findFirst()
                .orElse(null);

        if (client == null) {
            ClientRepresentation newClient = new ClientRepresentation();
            newClient.setClientId(clientName);
            newClient.setProtocol("openid-connect");
            newClient.setDefaultClientScopes(List.of(clientScopeName, "profile", "email"));
            newClient.setDirectAccessGrantsEnabled(true);
            newClient.setPublicClient(true);
            newClient.setRedirectUris(List.of("https://localhost:8000/*"));
            newClient.setAttributes(Map.of(
                    "login_theme", "os",
                    "openslides.action.url", "http://backend:9002/system/action/handle_request",
                    "backchannel.logout.url", "http://backend:9002/system/action/logout",
                    "post.logout.redirect.uris", "https://localhost:8000/*",
                    "backchannel.logout.session.required", "true"
            ));
            keycloak.realms().realm(realmName).clients().create(newClient);
            System.out.println("Created client: " + clientName);
        } else {
            System.out.println("Client " + clientName + " already exists.");
        }
    }

    private Map<String, Object> createProtocolMapper(String name, String protocolMapper, Map<String, String> config) {
        return Map.of(
                "name", name,
                "protocol", "openid-connect",
                "protocolMapper", protocolMapper,
                "config", config
        );
    }
}
