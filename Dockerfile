# FROM node:13
# RUN mkdir /app
# WORKDIR /app

# # ARG REPOSITORY_URL=https://github.com/OpenSlides/openslides-auth-service.git
# # ARG GIT_CHECKOUT=master
# # RUN git clone --no-checkout -- $REPOSITORY_URL .
# # RUN git checkout $GIT_CHECKOUT

# COPY package*.json ./
# # WORKDIR /app/src
# # Dev
# # RUN npm install
# # RUN npm build

# # Production
# # RUN npm ci --only=production

# # COPY . .

# # EXPOSE 5000

# # CMD ["node", "server.js"]
# # RUN npm start

# COPY . .

# # RUN npm install -g yarn
# # RUN yarn global add nodemon typescript tslint
# RUN npm i -g nodemon typescript tslint

# # ADD ./package.json .
# # ADD ./yarn.lock .
# RUN npm install

# FROM node:13

# WORKDIR /app

# COPY . /app
# RUN npm install

# EXPOSE 5000
# CMD ["npm", "start"]


FROM node:13

RUN mkdir /app
WORKDIR /app

# RUN npm install -g yarn
RUN yarn global add nodemon typescript@latest tslint

ADD ./package.json .
# ADD ./yarn.lock .
RUN yarn