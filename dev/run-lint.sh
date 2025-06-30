#!/bin/bash

# Executes all linters. Should errors occur, CATCH will be set to 1, causing an erroneous exit code.

echo "########################################################################"
echo "###################### Run Linters #####################################"
echo "########################################################################"

# Parameters
while getopts "lbp" FLAG; do
    case "${FLAG}" in
    l) LOCAL=true ;;
    b) BUILD=true ;;
    p) PERSIST_CONTAINERS=true ;;
    *) echo "Can't parse flag ${FLAG}" && break ;;
    esac
done

# Setup
IMAGE_TAG=openslides-auth-tests
CATCH=0

# Helpers
USER_ID=$(id -u)
GROUP_ID=$(id -g)
DC="CONTEXT=tests USER_ID=$USER_ID GROUP_ID=$GROUP_ID docker compose -f docker-compose.dev.yml"

# Optionally build & start
if [ -n "$BUILD" ]
then
    if [ "$(docker images -q $IMAGE_TAG)" = "" ]; then make build-test || CATCH=1; fi
    eval "$DC up -d || CATCH=1"
fi

# Execution
if [ -n "$LOCAL" ]
then
    npm run lint-check || CATCH=1
    auth npm run prettify-check || CATCH=1
    -T auth black --check --diff authlib/ tests/ || CATCH=1
    -T auth isort --check-only --diff authlib/ tests/ || CATCH=1
    -T auth flake8 authlib/ tests/ || CATCH=1
    -T auth mypy authlib/ tests/ || CATCH=1
else
    eval "$DC exec -T auth npm run lint-check || CATCH=1"
    eval "$DC exec -T auth npm run prettify-check || CATCH=1"
    eval "$DC exec -w /app/libraries/pip-auth/ -T auth black --check --diff authlib/ tests/ || CATCH=1"
    eval "$DC exec -w /app/libraries/pip-auth/ -T auth isort --check-only --diff authlib/ tests/ || CATCH=1"
    eval "$DC exec -w /app/libraries/pip-auth/ -T auth flake8 authlib/ tests/ || CATCH=1"
    eval "$DC exec -w /app/libraries/pip-auth/ -T auth mypy authlib/ tests/ || CATCH=1"
fi

if [ -z "$PERSIST_CONTAINERS" ] && [ -n "$BUILD" ]; then eval "$DC down || CATCH=1"; fi

exit $CATCH