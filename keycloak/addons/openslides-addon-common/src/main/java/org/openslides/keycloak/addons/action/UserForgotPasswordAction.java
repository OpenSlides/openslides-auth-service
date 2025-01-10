package org.openslides.keycloak.addons.action;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Optional;

public class UserForgotPasswordAction extends OsAction<UserForgotPasswordAction.UserForgotPasswordActionRequestPayload, UserForgotPasswordAction.UserForgotPasswordActionResponse> {

    public UserForgotPasswordAction(UserForgotPasswordActionRequestPayload payload) {
        super("user.send_invitation_email", List.of(payload));
    }

    @Override
    public Class<UserForgotPasswordActionResponse> getResponseType() {
        return UserForgotPasswordActionResponse.class;
    }

    public static record UserForgotPasswordActionRequestPayload(Optional<Long> meetingId) {
    }

    public static record UserForgotPasswordActionResponse(@JsonProperty("id") Long userId, @JsonProperty("last_email_sent") Integer lastEmailSent) {
    }
}
