FROM node:latest

WORKDIR /app

# Install dependencies. the `node_modules` folder is in /app
COPY auth/package*.json ./
COPY auth/tsconfig.json ./
RUN npm install

# Application lays in /app/src
COPY ./auth ./

# Now the source-files can be transpiled
RUN npm run build-ts
EXPOSE 8000
CMD ["npm", "run", "start"]