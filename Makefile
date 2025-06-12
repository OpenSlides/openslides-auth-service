SERVICE=auth
CATCH=10

build-dev:
	bash ../dev/scripts/makefile/build-service.sh $(SERVICE) dev

build-prod:
	bash ../dev/scripts/makefile/build-service.sh $(SERVICE) prod

build-test:
	bash ../dev/scripts/makefile/build-service.sh $(SERVICE) tests

run-dev-standalone: | build-dev
	CONTEXT="dev" docker compose -f docker-compose.dev.yml up
	stop-dev

run-cleanup: | build-dev
	CONTEXT="dev" docker compose -f docker-compose.dev.yml up -d
	CONTEXT="dev" docker compose -f docker-compose.dev.yml exec auth ./wait-for.sh auth:9004
	CONTEXT="dev" docker compose -f docker-compose.dev.yml exec auth npm run cleanup
	CONTEXT="dev" docker compose -f docker-compose.dev.yml down

run-pre-test: | build-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml up -d
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth ./wait-for.sh auth:9004

run-bash run-dev: | run-pre-test
	USER_ID=$$(id -u $${USER}) GROUP_ID=$$(id -g $${USER}) CONTEXT="dev" docker compose -f docker-compose.dev.yml exec auth sh

run-check-lint: | run-pre-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth npm run lint-check

run-check-prettify: | run-pre-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth npm run prettify-check

run-check-black: | run-pre-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -w /app/libraries/pip-auth/ -T auth black --check --diff authlib/ tests/

run-check-isort: | run-pre-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -w /app/libraries/pip-auth/ -T auth isort --check-only --diff authlib/ tests/

run-check-flake8: | run-pre-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -w /app/libraries/pip-auth/ -T auth flake8 authlib/ tests/

run-check-mypy: | run-pre-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -w /app/libraries/pip-auth/ -T auth mypy authlib/ tests/


## Deprecated

run-tests run-test:
	bash dev/run-tests.sh

run-test-and-stop: | run-test
	stop-dev

run-test-prod: | build-prod
	docker compose -f .github/startup-test/docker-compose.yml up -d
	docker compose -f .github/startup-test/docker-compose.yml exec -T auth ./wait-for.sh auth:9004
	docker compose -f .github/startup-test/docker-compose.yml down

stop-dev:
	CONTEXT="dev" docker compose -f docker-compose.dev.yml down