FROM node:10.14.2-alpine
WORKDIR /app
COPY . /app
RUN npm install
RUN npm install modclean -g
RUN modclean -r
ENTRYPOINT npm run start
