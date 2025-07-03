#!/bin/bash

# Executes all linters. Should errors occur, CATCH will be set to 1, causing an erroneous exit code.

echo "########################################################################"
echo "###################### Run Linters #####################################"
echo "########################################################################"

# Parameters
while getopts "lscp" FLAG; do
    case "${FLAG}" in
    l) LOCAL=true ;;
    s) SKIP_BUILD=true ;;
    c) SKIP_CONTAINER_UP=true ;;
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
DC_AUTH="$DC exec -T auth"
DC_PIP="$DC exec -w /app/libraries/pip-auth/"

# Optionally build & start
if [ -z "$SKIP_BUILD" ]; then make build-tests || CATCH=1; fi
if [ -z "$SKIP_CONTAINER_UP" ]; then eval "$DC up -d" || CATCH=1; fi

# Execution
eval "$( [ -z "$LOCAL" ] && echo "$DC_AUTH ")npm run lint-check" || CATCH=1
eval "$( [ -z "$LOCAL" ] && echo "$DC_AUTH ")auth npm run prettify-check" || CATCH=1
eval "$( [ -z "$LOCAL" ] && echo "$DC_PIP ")-T auth black --check --diff authlib/ tests/" || CATCH=1
eval "$( [ -z "$LOCAL" ] && echo "$DC_PIP ")-T auth isort --check-only --diff authlib/ tests/" || CATCH=1
eval "$( [ -z "$LOCAL" ] && echo "$DC_PIP ")-T auth flake8 authlib/ tests/" || CATCH=1
eval "$( [ -z "$LOCAL" ] && echo "$DC_PIP ")-T auth mypy authlib/ tests/" || CATCH=1

if [ -z "$PERSIST_CONTAINERS" ] && [ -z "$SKIP_CONTAINER_UP" ]; then eval "$DC down || CATCH=1"; fi

exit $CATCH