SERVICE=auth
MAKEFILE_PATH=../dev/scripts/makefile
DOCKER_COMPOSE_FILE=./docker-compose.dev.yml
TEST_DC=CONTEXT="tests" docker compose -f docker-compose.dev.yml exec

# Build images for different contexts

build build-prod build-dev build-tests:
	bash $(MAKEFILE_PATH)/make-build-service.sh $@ $(SERVICE)

# Development

run-dev run-dev-standalone run-dev-attached run-dev-detached run-dev-help run-dev-stop run-dev-clean run-dev-exec:
	bash $(MAKEFILE_PATH)/make-run-dev.sh "$@" "$(SERVICE)" "$(DOCKER_COMPOSE_FILE)" "$(ARGS)"

# Tests

run-tests:
	bash dev/run-tests.sh

run-lint:
	bash dev/run-lint.sh -l

# Cleanup

run-cleanup:
	make run-dev-detached ARGS="auth"
	make run-dev-exec ARGS="auth ./wait-for.sh auth:9004"
	make run-dev-exec ARGS="auth npm run cleanup"
	make run-dev-stop


########################## Deprecation List ##########################

deprecation-warning:
	bash $(MAKEFILE_PATH)/make-deprecation-warning.sh

stop-dev:
	bash $(MAKEFILE_PATH)/make-deprecation-warning.sh "run-dev-stop"
	CONTEXT="dev" docker compose -f docker-compose.dev.yml down

run-test:
	bash $(MAKEFILE_PATH)/make-deprecation-warning.sh "run-tests"
	bash dev/run-tests.sh

run-test-and-stop: | deprecation-warning run-test
	stop-dev

run-test-prod: | deprecation-warning build-prod
	docker compose -f .github/startup-test/docker-compose.yml up -d
	docker compose -f .github/startup-test/docker-compose.yml exec -T auth ./wait-for.sh auth:9004
	docker compose -f .github/startup-test/docker-compose.yml down

run-pre-test: | deprecation-warning build-tests
	CONTEXT="tests" docker compose -f docker-compose.dev.yml up -d
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth ./wait-for.sh auth:9004

run-check-lint: | deprecation-warning run-pre-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth npm run lint-check

run-check-prettify: | deprecation-warning run-pre-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth npm run prettify-check

run-check-black: | deprecation-warning run-pre-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -w /app/libraries/pip-auth/ -T auth black --check --diff authlib/ tests/

run-check-isort: | deprecation-warning run-pre-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -w /app/libraries/pip-auth/ -T auth isort --check-only --diff authlib/ tests/

run-check-flake8: | deprecation-warning run-pre-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -w /app/libraries/pip-auth/ -T auth flake8 authlib/ tests/

run-check-mypy: | deprecation-warning run-pre-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -w /app/libraries/pip-auth/ -T auth mypy authlib/ tests/