package org.openslides.keycloak.addons.authenticator.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record EmailHeaders(
        @JsonProperty("To") List<String> to,
        @JsonProperty("From") List<String> from,
        @JsonProperty("Subject") List<String> subject
) {}