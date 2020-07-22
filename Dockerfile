FROM node:13

WORKDIR /app

# Install dependencies. the `node_modules` folder is in /app
COPY auth/package*.json ./
COPY auth/tsconfig.json ./
RUN npm install

# Application lays in /app/src
COPY ./auth ./

# Now the source-files can be transpiled
RUN npm run build
EXPOSE 9004
CMD ["npm", "run", "start"]