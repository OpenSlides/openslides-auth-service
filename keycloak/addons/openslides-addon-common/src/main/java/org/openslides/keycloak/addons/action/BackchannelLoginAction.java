package org.openslides.keycloak.addons.action;

import com.fasterxml.jackson.annotation.JsonProperty;

public class BackchannelLoginAction extends OsAction<BackchannelLoginAction.BackchannelLoginActionRequestPayload, BackchannelLoginAction.BackchannelLoginActionResponse> {

    public BackchannelLoginAction(BackchannelLoginActionRequestPayload payload) {
        super("user.backchannel_login", payload);
    }

    @Override
    public Class<BackchannelLoginActionResponse> getResponseType() {
        return BackchannelLoginActionResponse.class;
    }

    public record BackchannelLoginActionRequestPayload(@JsonProperty("idp_id") String idpId) {
    }

    public record BackchannelLoginActionResponse(@JsonProperty("id") Long userId) {
    }
}
