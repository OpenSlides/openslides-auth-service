package org.openslides.keycloak.addons;

import jakarta.ws.rs.core.Response;

public class Utils {
    public static final String SESSION_NOTE_OPENSLIDES_USER_ID = "os_uid";

    public static String getObjectId(Response response) {
        if(response.getLocation() == null) {
            throw new RuntimeException("Location header is missing in response, code: " + response.getStatus() + " ... " + response.readEntity(String.class));
        }
        return response.getLocation().getPath().substring(response.getLocation().getPath().lastIndexOf("/") + 1);
    }
}
