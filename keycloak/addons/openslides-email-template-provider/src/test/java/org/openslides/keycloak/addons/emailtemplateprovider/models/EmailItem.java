package org.openslides.keycloak.addons.emailtemplateprovider.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;


@JsonIgnoreProperties(ignoreUnknown = true)
public record EmailItem(
        @JsonProperty("ID") String id,
        @JsonProperty("Content") EmailContent content
) {}