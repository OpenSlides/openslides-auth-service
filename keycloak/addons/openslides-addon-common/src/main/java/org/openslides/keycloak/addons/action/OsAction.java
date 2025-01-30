package org.openslides.keycloak.addons.action;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public abstract class OsAction<PAYLOAD, RESP> {

    private final String action;
    private final List<PAYLOAD> payload;

    @JsonCreator
    public OsAction(@JsonProperty("action") String action, @JsonProperty("data") List<PAYLOAD> payload) {
        this.action = action;
        this.payload = payload;
    }

    @JsonProperty
    public String getAction() {
        return action;
    }

    @JsonProperty("data")
    public List<PAYLOAD> getPayload() {
        return payload;
    }

    @JsonIgnore
    public abstract Class<RESP> getResponseType();
}
