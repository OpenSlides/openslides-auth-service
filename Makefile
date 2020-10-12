build-prod:
	docker build -t openslides-auth -f Dockerfile .

build-dev:
	docker build -t openslides-auth-dev -f Dockerfile.dev .

run-bash: | build-dev
	docker-compose -f docker-compose.dev.yml up -d
	docker-compose -f docker-compose.dev.yml exec auth wait-for-it auth:9004
	docker-compose -f docker-compose.dev.yml exec auth bash
	docker-compose -f docker-compose.dev.yml down

run-check-cleanup: | build-dev
	docker-compose -f docker-compose.dev.yml up -d
	docker-compose -f docker-compose.dev.yml exec auth wait-for-it auth:9004
	docker-compose -f docker-compose.dev.yml exec auth npm run lint-check
	docker-compose -f docker-compose.dev.yml exec auth npm run prettify-check
	docker-compose -f docker-compose.dev.yml down

run-cleanup: | build-dev
	docker-compose -f docker-compose.dev.yml up -d
	docker-compose -f docker-compose.dev.yml exec auth wait-for-it auth:9004
	docker-compose -f docker-compose.dev.yml exec auth npm run cleanup
	docker-compose -f docker-compose.dev.yml down

run-tests: | build-dev
	@echo "########################################################################"
	@echo "###################### Start full system tests #########################"
	@echo "########################################################################"
	docker-compose -f docker-compose.dev.yml up -d
	docker-compose -f docker-compose.dev.yml exec -T auth wait-for-it auth:9004
	docker-compose -f docker-compose.dev.yml exec -T auth npm run test
	docker-compose -f docker-compose.dev.yml exec -T auth pytest
	docker-compose -f docker-compose.dev.yml down

stop-run:
	docker-compose -f docker-compose.dev.yml down