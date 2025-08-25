#!/bin/bash

# Executes all linters. Should errors occur, CATCH will be set to 1, causing an erroneous exit code.

echo "########################################################################"
echo "###################### Run Linters #####################################"
echo "########################################################################"

# Parameters
while getopts "l" FLAG; do
    case "${FLAG}" in
    l) LOCAL=true ;;
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

# Safe Exit
trap 'if [ -z "$LOCAL" ]; then eval "$DC down"; fi' EXIT

# Execution
if [ -z "$LOCAL" ]
then
    # Setup
    make build-tests

    eval "$DC up -d"

    # Container Mode
    eval "$DC_AUTH npm run lint-check"
    eval "$DC_AUTH auth npm run prettify-check"
    eval "$DC_PIP -T auth black --check --diff authlib/ tests/"
    eval "$DC_PIP -T auth isort --check-only --diff authlib/ tests/"
    eval "$DC_PIP -T auth flake8 authlib/ tests/"
    eval "$DC_PIP -T auth mypy authlib/ tests/"
else
    # Local Mode
    npm run lint-check
    npm run prettify-check
    black --check --diff authlib/ tests/
    isort --check-only --diff authlib/ tests/
    flake8 authlib/ tests/
    mypy authlib/ tests/
fi
