package org.openslides.keycloak.addons.action;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class BackchannelLogoutAction extends OsAction<BackchannelLogoutAction.BackchannelLogoutActionRequest, BackchannelLogoutAction.BackchannelLogoutActionResponse> {

    public BackchannelLogoutAction(BackchannelLogoutActionRequest payload) {
        super("user.backchannel_logout", List.of(payload));
    }

    @Override
    public Class<BackchannelLogoutActionResponse> getResponseType() {
        return BackchannelLogoutActionResponse.class;
    }

    public record BackchannelLogoutActionRequest(@JsonProperty("session_id") String sessionId) {
    }

    public record BackchannelLogoutActionResponse() {
    }
}
