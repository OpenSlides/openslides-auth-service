#!/bin/bash

# Executes all tests and linters. Should errors occur, CATCH will be set to 1, causing an erroneous exit code.

echo "########################################################################"
echo "###################### Run Tests and Linters ###########################"
echo "########################################################################"

# Parameters
while getopts "s" FLAG; do
    case "${FLAG}" in
    s) SKIP_BUILD=true ;;
    *) echo "Can't parse flag ${FLAG}" && break ;;
    esac
done

# Setup
IMAGE_TAG=openslides-auth-tests
LOCAL_PWD=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Helpers
USER_ID=$(id -u)
GROUP_ID=$(id -g)
DC="CONTEXT=tests USER_ID=$USER_ID GROUP_ID=$GROUP_ID docker compose -f docker-compose.dev.yml"

# Safe Exit
trap 'eval "$DC down"' EXIT

# Execution
if [ -z "$SKIP_BUILD" ]; then make build-tests; fi
eval "$DC up -d"
eval "$DC exec -T auth ./wait-for.sh auth:9004"
eval "$DC exec -T auth npm run test"
eval "$DC exec -T auth pytest"

# Linters
bash "$LOCAL_PWD"/run-lint.sh -s -c