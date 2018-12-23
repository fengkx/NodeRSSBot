FROM node:10.14.2-alpine
WORKDIR /app
COPY . /app
RUN npm install
RUN npm install -g clean-node
RUN clean-node
ENTRYPOINT npm run start
