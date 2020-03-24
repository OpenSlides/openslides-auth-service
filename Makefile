build-dev:
	docker build -t openslides-auth-dev -f Dockerfile.dev .

run-dev: | build-dev
	docker-compose -f docker-compose.dev.yml up
	docker-compose -f docker-compose.dev.yml down

build-prod:
	docker build -t openslides-auth -f Dockerfile .

run-prod: | build-prod
	docker-compose -f docker-compose.yaml up
	docker-compose -f docker-compose.yaml down