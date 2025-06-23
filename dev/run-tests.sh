#!/bin/bash

# Executes all tests. Should errors occur, CATCH will be set to 1, causing an erroneous exit code.

echo "########################################################################"
echo "###################### Run Tests and Linters ###########################"
echo "########################################################################"

# Parameters
PERSIST_CONTAINERS=$1

# Setup
IMAGE_TAG=openslides-auth-tests
CATCH=0

# Helpers
USER_ID=$(id -u)
GROUP_ID=$(id -g)
DC="CONTEXT=tests USER_ID=$USER_ID GROUP_ID=$GROUP_ID docker compose -f docker-compose.dev.yml"

# Execution
if [ "$(docker images -q $IMAGE_TAG)" = "" ]; then make build-test || CATCH=1; fi
eval "$DC up -d || CATCH=1"
eval "$DC exec -T auth ./wait-for.sh auth:9004 || CATCH=1"
eval "$DC exec -T auth npm run test || CATCH=1"
eval "$DC exec -T auth pytest || CATCH=1"

# Linters
eval "$DC exec -T auth npm run lint-check || CATCH=1"
eval "$DC exec -T auth npm run prettify-check || CATCH=1"
eval "$DC exec -w /app/libraries/pip-auth/ -T auth black --check --diff authlib/ tests/ || CATCH=1"
eval "$DC exec -w /app/libraries/pip-auth/ -T auth isort --check-only --diff authlib/ tests/ || CATCH=1"
eval "$DC exec -w /app/libraries/pip-auth/ -T auth flake8 authlib/ tests/ || CATCH=1"
eval "$DC exec -w /app/libraries/pip-auth/ -T auth mypy authlib/ tests/ || CATCH=1"

if [ -z "$PERSIST_CONTAINERS" ]; then eval "$DC down || CATCH=1"; fi

exit $CATCH