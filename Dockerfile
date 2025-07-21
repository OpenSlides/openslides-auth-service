ARG CONTEXT=prod

FROM node:22.11-alpine AS base

## Setup
ARG CONTEXT
WORKDIR /app
ENV APP_CONTEXT=${CONTEXT}
ENV NODE_VERSION=22.11.0

## Install
COPY ./auth ./
RUN npm ci

## External Information
EXPOSE 9004

## Command
COPY ./dev/command.sh ./
RUN chmod +x command.sh
CMD ["./command.sh"]
ENTRYPOINT ["./entrypoint.sh"]

# Development Image
FROM base as dev

ENV OPENSLIDES_DEVELOPMENT=1

# Test Image
FROM base as tests

## Install Pip & dependencies
RUN (apk add --no-cache \
    python3 python3-dev py3-pip gcc libc-dev) && \
    pip install --no-cache-dir --break-system-packages -r ./libraries/pip-auth/requirements.txt -r ./libraries/pip-auth/requirements_development.txt

ENV OPENSLIDES_DEVELOPMENT=1

# Production Image
FROM base as build

# Now the source-files can be transpiled
RUN npm run build && \
    npm prune --production

FROM node:22.11-alpine AS prod

## Setup
ARG CONTEXT
WORKDIR /app
ENV APP_CONTEXT=prod
ENV NODE_VERSION=22.11.0

## Installs
COPY --from=build /app/build .
COPY --from=build /app/entrypoint.sh .
COPY --from=build /app/wait-for.sh .
COPY --from=build /app/node_modules ./node_modules
COPY ./dev/command.sh .

# Add appuser
RUN adduser --system --no-create-home appuser && \
    chown appuser /app/ && \
    chmod +x command.sh

USER appuser

## Public Information
LABEL org.opencontainers.image.title="OpenSlides Authentication Service"
LABEL org.opencontainers.image.description="Service for OpenSlides which handles the authentication of users."
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/OpenSlides/openslides-auth-service"

EXPOSE 9004

## Command
CMD ["./command.sh"]
ENTRYPOINT ["./entrypoint.sh"]
