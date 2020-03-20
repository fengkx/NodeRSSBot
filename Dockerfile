FROM node:13.8.0-alpine as builder
WORKDIR /app
COPY . /app
ENV NODE_PRODUTION true
RUN apk add --no-cache --update build-base python2
RUN npm install --production && find node_modules -type f | egrep "(.idea|.vscode|benchmark.js|.eslintrc.js|changelog|AUTHORS|AUTHORSon|license|LICENSE|LICENCE|.travis.yml|.eslintrc.json|.eslintrc.yml|Makefile|.npmignore|.DS_Store|.jshintrc|.eslintrc.BSD|.editorconfig|tsconfig.json|tsconfig.jsonon|.coveralls.yml|appveyor.yml|.gitattributes|.eslintignore|.eslintrc|.eslintignore.BSD|.babelrc)" | xargs rm -rf && \
    find node_modules -type f | egrep "\.(md|mdon|markdown|log|ts|swp|jst|coffee|txt|BSD|m?js.map)$" | xargs rm -f &&\
    find node_modules -type d | egrep "(test|docs|doc|examples|example|.githubs|@types)" | xargs rm -rf

FROM node:13.8.0-alpine as app
WORKDIR /app
COPY . /app
ENV NODE_PRODUTION true
COPY --from=builder /app/node_modules ./node_modules
ENTRYPOINT npm run start-withsnapshot
