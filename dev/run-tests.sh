#!/bin/bash

# Executes all tests and linters. Should errors occur, CATCH will be set to 1, causing an erroneous exit code.

echo "########################################################################"
echo "###################### Run Tests and Linters ###########################"
echo "########################################################################"

# Parameters
while getopts "p" FLAG; do
    case "${FLAG}" in
    p) PERSIST_CONTAINERS=true ;;
    *) echo "Can't parse flag ${FLAG}" && break ;;
    esac
done

# Setup
IMAGE_TAG=openslides-auth-tests
LOCAL_PWD=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
CATCH=0

# Helpers
USER_ID=$(id -u)
GROUP_ID=$(id -g)
DC="CONTEXT=tests USER_ID=$USER_ID GROUP_ID=$GROUP_ID docker compose -f docker-compose.dev.yml"

# Execution
if [ "$(docker images -q $IMAGE_TAG)" = "" ]; then make build-tests || CATCH=1; fi
eval "$DC up -d || CATCH=1"
eval "$DC exec -T auth ./wait-for.sh auth:9004 || CATCH=1"
eval "$DC exec -T auth npm run test || CATCH=1"
eval "$DC exec -T auth pytest || CATCH=1"

# Linters
bash "$LOCAL_PWD"/run-lint.sh || CATCH=1

if [ -z "$PERSIST_CONTAINERS" ]; then eval "$DC down || CATCH=1"; fi

exit $CATCH