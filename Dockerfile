FROM node:23.3-alpine AS build
ENV NODE_VERSION=22.11.0

WORKDIR /app

# Install dependencies. the `node_modules` folder is in /app
COPY auth/package.json .
COPY auth/package-lock.json .

RUN npm ci

# Application lays in /app/src
COPY ./auth ./

# Now the source-files can be transpiled
RUN npm run build

RUN npm prune --production

FROM node:23.3-alpine

LABEL org.opencontainers.image.title="OpenSlides Authentication Service"
LABEL org.opencontainers.image.description="Service for OpenSlides which handles the authentication of users."
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/OpenSlides/openslides-auth-service"

WORKDIR /app

COPY --from=build /app/build .
COPY --from=build /app/entrypoint.sh .
COPY --from=build /app/wait-for.sh .
COPY --from=build /app/node_modules ./node_modules

EXPOSE 9004
ENTRYPOINT ["./entrypoint.sh"]

CMD ["node", "index.js"]
