FROM node:13

RUN mkdir /app
WORKDIR /app

RUN yarn global add nodemon typescript@latest tslint

ADD ./package.json .
RUN yarn
CMD ["npm", "start"]