#!/bin/bash
exec /opt/keycloak/bin/kc.sh start-dev \
  --verbose \
  --http-relative-path "${KEYCLOAK_HTTP_RELATIVE_PATH}" \
  --proxy-headers xforwarded \
  --hostname "${KEYCLOAK_HOSTNAME}" \
  --hostname-admin "${KEYCLOAK_HOSTNAME}"