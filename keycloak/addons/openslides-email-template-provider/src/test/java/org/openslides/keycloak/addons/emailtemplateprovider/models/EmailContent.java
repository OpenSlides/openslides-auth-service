package org.openslides.keycloak.addons.emailtemplateprovider.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record EmailContent(
        @JsonProperty("Body") String body,
        @JsonProperty("Headers") EmailHeaders headers
) {}