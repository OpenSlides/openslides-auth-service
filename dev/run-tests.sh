#!/bin/bash

# Executes all tests. Should errors occur, CATCH will be set to 1, causing an erronous exit code.

echo "########################################################################"
echo "###################### Run Tests and Linters ###########################"
echo "########################################################################"

IMAGE_TAG=openslides-auth-tests
CATCH=0
PERSIST_CONTAINERS=$1

if [ "$(docker images -q $IMAGE_TAG)" = "" ]; then make build-test || CATCH=1; fi
CONTEXT="tests" docker compose -f docker-compose.dev.yml up -d || CATCH=1
CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth ./wait-for.sh auth:9004 || CATCH=1
CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth npm run test || CATCH=1
CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth pytest || CATCH=1

# Linters
CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth npm run lint-check || CATCH=1
CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth npm run prettify-check || CATCH=1
CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -w /app/libraries/pip-auth/ -T auth black --check --diff authlib/ tests/ || CATCH=1
CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -w /app/libraries/pip-auth/ -T auth isort --check-only --diff authlib/ tests/ || CATCH=1
CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -w /app/libraries/pip-auth/ -T auth flake8 authlib/ tests/ || CATCH=1
CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -w /app/libraries/pip-auth/ -T auth mypy authlib/ tests/ || CATCH=1

if [ -z $PERSIST_CONTAINERS ]; then CONTEXT="tests" docker compose -f docker-compose.dev.yml down || CATCH=1; fi

exit $CATCH