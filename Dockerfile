FROM node:14-buster-slim AS build

RUN apt-get -y update && apt-get -y upgrade && \
    apt-get install --no-install-recommends -y wait-for-it

RUN apt-get clean

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

FROM node:14-alpine

WORKDIR /app

COPY --from=build /app/build /app
COPY --from=build /app/node_modules /app/node_modules

EXPOSE 9004
ENTRYPOINT [ "/app/entrypoint.sh" ]

CMD ["node", "index.js"]