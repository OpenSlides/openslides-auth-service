package org.openslides.keycloak.addons.authenticator.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MailHogResponse(
        @JsonProperty("total") int total,
        @JsonProperty("count") int count,
        @JsonProperty("start") int start,
        @JsonProperty("items") List<EmailItem> items
) {}


