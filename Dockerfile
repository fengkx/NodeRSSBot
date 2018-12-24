FROM node:10.14.2-alpine
WORKDIR /app
COPY . /app
ENV NODE_PRODUTION true
RUN npm install --production
RUN find node_modules -type f | egrep "(.idea|.vscode|benchmark.js|.eslintrc.js|changelog|license|LICENSE|.travis.yml|.eslintrc.json)" | xargs rm -f && \
    find node_modules -type f | egrep "\.(md|markdown|log|ts|swp)$" | xargs rm -f &&\
    find node_modules -type d | egrep "(test)" | xargs rm -rf
ENTRYPOINT npm run start
