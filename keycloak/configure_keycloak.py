import logging
from os import environ
from keycloak import KeycloakAdmin

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log_environment_variables():
    logger.info("Configuring Keycloak...")
    logger.debug(f"KEYCLOAK_URL: {environ.get('KEYCLOAK_URL')}")
    logger.debug(f"KEYCLOAK_ADMIN: {environ.get('KEYCLOAK_ADMIN')}")
    logger.debug(f"KEYCLOAK_ADMIN_PASSWORD: {environ.get('KEYCLOAK_ADMIN_PASSWORD')}")

# Function to create or get realm
def create_or_get_realm(keycloak_admin, realm_name):
    realms = keycloak_admin.get_realms()
    if not any(realm.get('realm') == realm_name for realm in realms):
        keycloak_admin.create_realm(payload={
            "realm": realm_name,
            "enabled": True,
            "resetPasswordAllowed": True,
            "smtpServer": {
                "host": "smtp.example.com",
                "port": "587",
                "from": "no-reply@example.com",
                "auth": "true",
                "user": "smtp_user",
                "password": "smtp_password",
                "ssl": "false",
                "starttls": "true"
            }
        })
        logger.info(f"Created realm: {realm_name}")
    else:
        logger.info(f"Realm {realm_name} already exists.")

# Function to create or get client scope with protocol mappers
def create_or_get_client_scope(keycloak_admin, realm_name, client_scope_name, protocol_mappers):
    keycloak_admin.connection.realm_name = realm_name
    client_scopes = keycloak_admin.get_client_scopes()
    client_scope_id = None

    for scope in client_scopes:
        if scope.get('name') == client_scope_name:
            client_scope_id = scope['id']
            break

    if client_scope_id is None:
        client_scope_id = keycloak_admin.create_client_scope(
            payload={"name": client_scope_name, "protocol": "openid-connect"})
        logger.info(f"Created client scope: {client_scope_name}")

    existing_mappers = keycloak_admin.get_mappers_from_client_scope(client_scope_id)

    for mapper in protocol_mappers:
        if not any(em['name'] == mapper['name'] for em in existing_mappers):
            keycloak_admin.add_mapper_to_client_scope(client_scope_id=client_scope_id, payload=mapper)
            logger.info(f"Added protocol mapper: {mapper['name']} to client scope: {client_scope_name}")
        else:
            logger.info(f"Protocol mapper {mapper['name']} already exists in client scope: {client_scope_name}")

# Function to create or get client
def create_or_get_client(keycloak_admin, realm_name, client_name, client_scope_name):
    keycloak_admin.connection.realm_name = realm_name
    clients = keycloak_admin.get_clients()
    if not any(client.get('clientId') == client_name for client in clients):
        result = keycloak_admin.create_client(
            payload={
                "clientId": client_name,
                "protocol": "openid-connect",
                "defaultClientScopes": [client_scope_name],
                "directAccessGrantsEnabled": True,
                "publicClient": True,
                "baseUrl": "https://localhost:8000",
                "attributes": {
                    "login_theme": "os",
                    "openslides.action.url": "http://backend:9002/system/action/handle_request",
                    "backchannel.logout.url": "http://backend:9002/system/action/logout",
                    "post.logout.redirect.uris": "https://localhost:8000/*",
                    "backchannel.logout.session.required": "true"
                },
                "redirectUris": ["https://localhost:8000/*"]
            })
        logger.info(f"Created client: {client_name}")
    else:
        logger.info(f"Client {client_name} already exists.")

# Function to create or get user
def create_or_get_user(keycloak_admin, realm_name, users):
    keycloak_admin.connection.realm_name = realm_name
    for user_data in users:
        existing_users = keycloak_admin.get_users(query={"username": user_data[0]})
        user_representation = {
            "username": user_data[0],
            "email": f"{user_data[0]}@localhost",
            "enabled": True,
            "emailVerified": True,
            "firstName": user_data[0],
            "lastName": "User",
            "attributes": {"os-userid": user_data[1]},
            "credentials": [{"type": "password", "value": user_data[2], "temporary": False}]
        }
        if not existing_users:
            keycloak_admin.create_user(user_representation)
            logger.info(f"Created user: {user_data[0]}")
        else:
            keycloak_admin.update_user(user_id=existing_users[0]['id'], payload=user_representation)
            logger.info(f"Updated user: {user_data[0]}")

if __name__ == '__main__':
    keycloak_admin = KeycloakAdmin(
        server_url=environ.get("KEYCLOAK_URL"),
        username=environ.get("KEYCLOAK_ADMIN"),
        password=environ.get("KEYCLOAK_ADMIN_PASSWORD"),
        realm_name="master",
        verify=False
    )
    log_environment_variables()
    configure_keycloak(keycloak_admin)
