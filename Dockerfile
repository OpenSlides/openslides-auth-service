FROM node:13

RUN apt-get -y update && apt-get -y upgrade && \
    apt-get install --no-install-recommends -y wait-for-it

WORKDIR /app

# Install dependencies. the `node_modules` folder is in /app
COPY auth/package.json .
COPY auth/package-lock.json .
RUN npm ci

# Application lays in /app/src
COPY ./auth ./

# Now the source-files can be transpiled
RUN npm run build
EXPOSE 9004
ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD [ "npm", "run", "start" ]