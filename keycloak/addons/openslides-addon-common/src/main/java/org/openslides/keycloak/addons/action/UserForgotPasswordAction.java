package org.openslides.keycloak.addons.action;

public class UserForgotPasswordAction implements OsAction<UserForgotPasswordActionRequest, UserForgotPasswordActionResponse> {
    @Override
    public String getActionName() {
        return "user.send_invitation_email";
    }

    @Override
    public Class<UserForgotPasswordActionRequest> getRequestType() {
        return UserForgotPasswordActionRequest.class;
    }

    @Override
    public Class<UserForgotPasswordActionResponse> getResponseType() {
        return UserForgotPasswordActionResponse.class;
    }
}
