build-dev:
	docker build -t openslides-auth-dev -f Dockerfile.dev .

run-dev: | build-dev
	docker-compose -f docker-compose.dev.yml up
	docker-compose -f docker-compose.dev.yml down

build-prod:
	docker build -t openslides-auth -f Dockerfile .

run-prod: | build-prod
	docker-compose -f docker-compose.prod.yml up
	docker-compose -f docker-compose.prod.yml down

build-test:
	docker build -t openslides-auth-test -f Dockerfile.test .

run-test: | build-test
	docker-compose -f docker-compose.test.yml up --abort-on-container-exit
	docker-compose -f docker-compose.test.yml down