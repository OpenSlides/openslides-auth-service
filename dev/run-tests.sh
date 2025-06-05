#!/bin/bash

# Executes all tests. Should errors occur, CATCH will be set to 1, causing an erronous exit code.

echo "########################################################################"
echo "###################### Start full system tests #########################"
echo "########################################################################"

CATCH=0
PERSIST_CONTAINERS=$1

make build-test || true
echo "continue"
CONTEXT="tests" docker compose -f docker-compose.dev.yml up -d || CATCH=1
CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth ./wait-for.sh auth:9004 || CATCH=1
CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth npm run test || CATCH=1
CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth pytest || CATCH=1

if [ -z $PERSIST_CONTAINERS ]; then CONTEXT="tests" docker compose -f docker-compose.dev.yml down || CATCH=1; fi

exit $CATCH