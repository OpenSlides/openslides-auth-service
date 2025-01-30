build-dev:
	docker build -t openslides-keycloak-dev -f keycloak/Dockerfile.dev keycloak
	docker build -t openslides-keycloak-init-dev -f keycloak/Dockerfile.dev --target init keycloak

build-dev-fullstack: | build-dev
