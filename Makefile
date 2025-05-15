build-aio:
	@if [ -z "${submodule}" ] ; then \
		echo "Please provide the name of the submodule service to build (submodule=<submodule service name>)"; \
		exit 1; \
	fi

	@if [ "${context}" != "prod" -a "${context}" != "dev" -a "${context}" != "tests" ] ; then \
		echo "Please provide a context for this build (context=<desired_context> , possible options: prod, dev, tests)"; \
		exit 1; \
	fi

	echo "Building submodule '${submodule}' for ${context} context"

	@docker build -f ./Dockerfile.AIO ./ --tag openslides-${submodule}-${context} --build-arg CONTEXT=${context} --target ${context} ${args}

build-dev:
	make build-aio context=dev submodule=auth

build-prod:
	docker build -t openslides-auth -f Dockerfile .

#docker build -t openslides-auth-dev -f Dockerfile.dev .

build-test:
	make build-aio context=tests submodule=auth

run-dev-standalone: | build-dev
	CONTEXT="dev" docker compose -f docker-compose.dev.yml up
	stop-dev

run-pre-test: | build-test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml up -d
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth ./wait-for.sh auth:9004

run-bash run-dev: | run-pre-test
	USER_ID=$$(id -u $${USER}) GROUP_ID=$$(id -g $${USER}) docker compose -f docker-compose.dev.yml exec auth sh

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

run-test: | run-pre-test
	@echo "########################################################################"
	@echo "###################### Start full system tests #########################"
	@echo "########################################################################"
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth npm run test
	CONTEXT="tests" docker compose -f docker-compose.dev.yml exec -T auth pytest

run-cleanup: | build-dev
	CONTEXT="dev" docker compose -f docker-compose.dev.yml up -d
	CONTEXT="dev" docker compose -f docker-compose.dev.yml exec auth ./wait-for.sh auth:9004
	CONTEXT="dev" docker compose -f docker-compose.dev.yml exec auth npm run cleanup
	CONTEXT="dev" docker compose -f docker-compose.dev.yml down

run-test-and-stop: | run-test
	stop-dev

run-test-prod: | build-prod
	docker compose -f .github/startup-test/docker-compose.yml up -d
	docker compose -f .github/startup-test/docker-compose.yml exec -T auth ./wait-for.sh auth:9004
	docker compose -f .github/startup-test/docker-compose.yml down

stop-dev:
	CONTEXT="dev" docker compose -f docker-compose.dev.yml down