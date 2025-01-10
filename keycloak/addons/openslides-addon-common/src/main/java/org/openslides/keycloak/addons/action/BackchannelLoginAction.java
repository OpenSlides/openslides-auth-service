package org.openslides.keycloak.addons.action;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class BackchannelLoginAction extends OsAction<BackchannelLoginAction.BackchannelLoginActionRequestPayload, BackchannelLoginAction.BackchannelLoginActionResponse> {

    public BackchannelLoginAction(BackchannelLoginActionRequestPayload payload) {
        super("user.backchannel_login", List.of(payload));
    }

    @Override
    public Class<BackchannelLoginActionResponse> getResponseType() {
        return BackchannelLoginActionResponse.class;
    }

    public record BackchannelLoginActionRequestPayload(@JsonProperty("idp_id") String idpId) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record BackchannelLoginActionResponse(@JsonProperty("id") Long userId) {
    }
}
