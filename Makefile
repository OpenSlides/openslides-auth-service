override SERVICE=auth
override MAKEFILE_PATH=../dev/scripts/makefile
override DOCKER_COMPOSE_FILE=./docker-compose.dev.yml
override TEST_DC=CONTEXT="tests" docker compose -f docker-compose.dev.yml exec

# Build images for different contexts

build-prod:
	docker build ./ --tag "openslides-$(SERVICE)" --build-arg CONTEXT="prod" --target "prod"

build-dev:
	docker build ./ --tag "openslides-$(SERVICE)-dev" --build-arg CONTEXT="dev" --target "dev"

build-tests:
	docker build ./ --tag "openslides-$(SERVICE)-tests" --build-arg CONTEXT="tests" --target "tests"

# Development

.PHONY: dev

dev dev-help dev-standalone dev-detached dev-attached dev-stop dev-exec dev-enter:
	bash $(MAKEFILE_PATH)/make-dev.sh "$@" "$(SERVICE)" "$(DOCKER_COMPOSE_FILE)" "$(ARGS)" "$(USED_SHELL)"

# Tests
run-tests:
	bash dev/run-tests.sh

lint:
	bash dev/run-lint.sh -l

run-test-ci: | run-pre-test
	@echo "########################################################################"
	@echo "###################### Start full system tests #########################"
	@echo "########################################################################"
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth npm run test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth pytest

# Cleanup

run-cleanup:
	make dev-detached ARGS="auth"
	make dev-exec ARGS="auth ./wait-for.sh auth:9004"
	make dev-exec ARGS="auth npm run cleanup"
	make dev-stop

########################## Deprecation List ##########################

deprecation-warning:
	@echo "\033[1;33m DEPRECATION WARNING: This make command is deprecated and will be removed soon! \033[0m"

deprecation-warning-alternative: | deprecation-warning
	@echo "\033[1;33m Please use the following command instead: $(ALTERNATIVE) \033[0m"

stop-dev:
	@make deprecation-warning-alternative ALTERNATIVE="dev-stop"
	CONTEXT="dev" docker compose -f docker-compose.dev.yml down

run-test:
	@make deprecation-warning-alternative ALTERNATIVE="run-tests"
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

run-cleanup-ci: | deprecation-warning build-dev
	CONTEXT="tests" docker compose -f docker-compose.dev.yml up -d
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec auth ./wait-for.sh auth:9004
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec auth npm run cleanup
	CONTEXT="tests" docker compose -f docker-compose.dev.yml down