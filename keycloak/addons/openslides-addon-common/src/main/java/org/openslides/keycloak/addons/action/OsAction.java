package org.openslides.keycloak.addons.action;

public interface OsAction<REQ, RESP> {

    String getActionName();

    Class<REQ> getRequestType();

    Class<RESP> getResponseType();
}
