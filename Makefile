build-dev:
	docker build -t openslides-auth-dev -f Dockerfile.dev .

run-dev: | build-dev
	docker-compose -f docker-compose.dev.yml up
	docker-compose -f docker-compose.dev.yml down
