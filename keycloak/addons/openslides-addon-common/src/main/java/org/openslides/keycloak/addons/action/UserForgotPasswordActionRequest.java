package org.openslides.keycloak.addons.action;

import java.util.Optional;

public record UserForgotPasswordActionRequest(Optional<Long> meetingId) {
}
