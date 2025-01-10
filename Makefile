build-dev:
	docker build -t openslides-keycloak-dev -f keycloak/Dockerfile.dev keycloak

build-dev-fullstack: | build-dev