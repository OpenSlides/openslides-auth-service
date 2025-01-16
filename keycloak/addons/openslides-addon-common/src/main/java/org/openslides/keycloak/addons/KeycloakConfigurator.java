package org.openslides.keycloak.addons;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.ClientRepresentation;
import org.keycloak.representations.idm.ClientScopeRepresentation;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.ProtocolMapperRepresentation;
import org.keycloak.representations.idm.RealmEventsConfigRepresentation;
import org.keycloak.representations.idm.RealmRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.keycloak.representations.userprofile.config.UPAttribute;
import org.keycloak.representations.userprofile.config.UPAttributePermissions;
import org.keycloak.representations.userprofile.config.UPAttributeRequired;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class KeycloakConfigurator {

    private final Keycloak keycloak;

    public static void main(String[] args) throws IOException {
        String serverUrl = System.getenv("KEYCLOAK_URL");
        String username = System.getenv("KC_BOOTSTRAP_ADMIN_USERNAME");
        String password = System.getenv("KC_BOOTSTRAP_ADMIN_PASSWORD");
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

    public void configureKeycloak(String realmName) throws IOException {
        createOrGetRealm(realmName);
        String clientScopeName = "os";
        String clientName = "os-ui";
        List<Map<String, Object>> protocolMappers = createProtocolMappers();

        configureAuthenticator(realmName);
        createOrGetClientScope(realmName, clientScopeName, protocolMappers);
        createOrGetClient(realmName, clientName, clientScopeName);
        List<Map<String, Object>> users = List.of(
                Map.of("username", "admin", "password", "admin", "osUserId", "1"),
                Map.of("username", "a", "password", "a", "osUserId", "2"),
                Map.of("username", "b", "password", "jKwSLGCk", "osUserId", "3")
        );
        createOrGetUser(realmName, users);

        configureLogoutListener(realmName);
    }

    private void configureLogoutListener(String realmName) {
        RealmEventsConfigRepresentation eventsConfig = keycloak.realm(realmName).getRealmEventsConfig();

        final var listeners = eventsConfig.getEventsListeners();
        listeners.add("openslides-logout-listener");
        eventsConfig.setEventsListeners(eventsConfig.getEventsListeners());
        eventsConfig.setEnabledEventTypes(eventsConfig.getEnabledEventTypes());
        eventsConfig.setEventsEnabled(true);

        keycloak.realm(realmName).updateRealmEventsConfig(eventsConfig);
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
            userRepresentation.setAttributes(Map.of("osUserId", List.of(userData.get("osUserId").toString())));
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

        final var realm = keycloak.realms().realm(realmName);
        final var userProfile = realm.users().userProfile().getConfiguration();
        final var username = userProfile.getAttribute("username");
        username.setValidations(username.getValidations().entrySet().stream().filter(e -> !e.getKey().equals("length")).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)));

        final var osUserId = new UPAttribute();
        osUserId.setName("osUserId");
        osUserId.setRequired(new UPAttributeRequired(Set.of("admin", "user"), null));
        osUserId.addValidation("integer", Map.of("min", "1"));
        osUserId.setPermissions(new UPAttributePermissions(Set.of("user", "admin"), Set.of("admin")));
        userProfile.addOrReplaceAttribute(osUserId);

        realm.users().userProfile().update(userProfile);
    }

    private void configureAuthenticator(String realmName) throws IOException {
        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        NestedAuthFlowCreator.AuthFlowConfig config = mapper.readValue(NestedAuthFlowCreator.class.getResourceAsStream("/flow.yaml"), NestedAuthFlowCreator.AuthFlowConfig.class);

        new NestedAuthFlowCreator(keycloak, realmName).createFlowWithExecutions(config);

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
            String clientScopeId = Utils.getObjectId(response);
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
                )),
                /*
                lightweight.claim	"false"
                access.tokenResponse.claim	"false"
                 */
//                createProtocolMapper("openslides-user-id-mapper", "oidc-usersessionmodel-note-mapper", Map.of(
//                        "claim.name", "os_uid",
//                        "user.session.note", Utils.SESSION_NOTE_OPENSLIDES_USER_ID,
//                        "id.token.claim", "true",
//                        "access.token.claim", "true",
//                        "userinfo.token.claim", "true",
//                        "jsonType.label", "long"
//                )),
                createProtocolMapper("openslides-user-id-mapper", "oidc-usermodel-property-mapper", Map.of(
                        "user.attribute", "osUserId",
                        "claim.name", "os_uid",
                        "id.token.claim", "true",
                        "access.token.claim", "true",
                        "jsonType.label", "long"
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
            newClient.setDefaultClientScopes(List.of(clientScopeName, "profile", "email", "offline_access"));
            newClient.setDirectAccessGrantsEnabled(true);
            newClient.setPublicClient(true);
            newClient.setRedirectUris(List.of("https://localhost:8000/*"));
            newClient.setAttributes(Map.of(
                    "login_theme", "os",
                    "openslides.action.url", "http://backend:9002/system/action/handle_request",
                    "post.logout.redirect.uris", "https://localhost:8000/*"
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
