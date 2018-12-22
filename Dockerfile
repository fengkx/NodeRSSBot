FROM node:10.3.0-slim
WORKDIR /app
COPY . /app
RUN npm install
ENTRYPOINT npm run start
