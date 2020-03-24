FROM node:latest

WORKDIR /app

# Install dependencies. the `node_modules` folder is in /app
COPY auth/package*.json ./
RUN npm install --only=production

# Application lays in /app/src
COPY ./auth ./
EXPOSE 8000
CMD ["npm", "run", "start"]