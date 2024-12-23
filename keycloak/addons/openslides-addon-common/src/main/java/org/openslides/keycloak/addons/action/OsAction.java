package org.openslides.keycloak.addons.action;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public abstract class OsAction<PAYLOAD, RESP> {

    private final String action;
    private final PAYLOAD payload;

    @JsonCreator
    public OsAction(@JsonProperty("action") String action, @JsonProperty("data") PAYLOAD payload) {
        this.action = action;
        this.payload = payload;
    }

    @JsonProperty
    public String getAction() {
        return action;
    }

    @JsonProperty("data")
    public PAYLOAD getPayload() {
        return payload;
    }

    public abstract Class<RESP> getResponseType();
}
