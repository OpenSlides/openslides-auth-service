build-prod:
	docker build -t openslides-auth -f Dockerfile .

build-dev:
	docker build -t openslides-auth-dev -f Dockerfile.dev .

build-test:
	docker build -t openslides-auth-dev -f Dockerfile.test .

run-dev: | build-dev
	docker-compose -f docker-compose.dev.yml up
	stop-dev

run-pre-test: | build-test
	docker-compose -f docker-compose.dev.yml up -d
	docker-compose -f docker-compose.dev.yml exec -T auth ./wait-for.sh auth:9004

run-bash: | run-pre-test
	docker-compose -f docker-compose.dev.yml exec auth sh
	docker-compose -f docker-compose.dev.yml down

run-check-lint:
	docker-compose -f docker-compose.dev.yml exec -T auth npm run lint-check

run-check-prettify:
	docker-compose -f docker-compose.dev.yml exec -T auth npm run prettify-check

run-test: | run-pre-test
	@echo "########################################################################"
	@echo "###################### Start full system tests #########################"
	@echo "########################################################################"
	docker-compose -f docker-compose.dev.yml exec -T auth npm run test
	docker-compose -f docker-compose.dev.yml exec -T auth pytest

run-cleanup: | build-dev
	docker-compose -f docker-compose.dev.yml up -d
	docker-compose -f docker-compose.dev.yml exec auth ./wait-for.sh auth:9004
	docker-compose -f docker-compose.dev.yml exec auth npm run cleanup
	docker-compose -f docker-compose.dev.yml down

run-test-and-stop: | run-test
	stop-dev

run-test-prod: | build-prod
	docker-compose -f .github/startup-test/docker-compose.yml up -d
	docker-compose -f .github/startup-test/docker-compose.yml exec -T auth ./wait-for.sh auth:9004
	docker-compose -f .github/startup-test/docker-compose.yml down

stop-dev:
	docker-compose -f docker-compose.dev.yml down