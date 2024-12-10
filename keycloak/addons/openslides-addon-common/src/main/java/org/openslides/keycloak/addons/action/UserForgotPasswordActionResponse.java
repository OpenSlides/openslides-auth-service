package org.openslides.keycloak.addons.action;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UserForgotPasswordActionResponse(@JsonProperty("id") Long userId, @JsonProperty("last_email_sent") Integer lastEmailSent) {
}
