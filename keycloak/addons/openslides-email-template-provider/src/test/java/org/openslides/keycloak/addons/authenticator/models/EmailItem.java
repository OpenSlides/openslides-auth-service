package org.openslides.keycloak.addons.authenticator.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;


@JsonIgnoreProperties(ignoreUnknown = true)
public record EmailItem(
        @JsonProperty("ID") String id,
        @JsonProperty("Content") EmailContent content
) {}