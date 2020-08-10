build-dev:
	docker build -t openslides-auth-dev -f Dockerfile.dev .

run-bash: | build-dev
	docker-compose -f docker-compose.dev.yml up -d
	docker-compose -f docker-compose.dev.yml exec auth wait-for-it auth:9004
	docker-compose -f docker-compose.dev.yml exec auth bash
	docker-compose -f docker-compose.dev.yml down

stop-run:
	docker-compose -f docker-compose.dev.yml down

build-prod:
	docker build -t openslides-auth -f Dockerfile .

run-test: | build-dev
	echo "########################################################################"
	echo "###################### Start full system tests #########################"
	echo "########################################################################"
	docker-compose -f docker-compose.dev.yml up -d
	docker-compose -f docker-compose.dev.yml exec auth wait-for-it auth:9004
	docker-compose -f docker-compose.dev.yml exec auth npm run test
	docker-compose -f docker-compose.dev.yml down

run-down: 
	docker-compose -f docker-compose.dev.yml down