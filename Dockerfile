FROM node:10.16.0-alpine
WORKDIR /app
COPY . /app
ENV NODE_PRODUTION true
RUN npm install --production && find node_modules -type f | egrep "(.idea|.vscode|benchmark.js|.eslintrc.js|changelog|AUTHORS|AUTHORSon|license|LICENSE|.travis.yml|.eslintrc.json|.eslintrc.yml|Makefile|.npmignore|.DS_Store|.jshintrc|.eslintrc.BSD|.editorconfig|tsconfig.json|tsconfig.jsonon|.coveralls.yml|appveyor.yml|.gitattributes|.eslintignore|.eslintrc|.eslintignore.BSD|.babelrc)" | xargs rm -rf && \
    find node_modules -type f | egrep "\.(md|mdon|markdown|log|ts|swp|jst|coffee|txt|BSD)$" | xargs rm -f &&\
    find node_modules -type d | egrep "(test|docs|doc|examples|example|.githubs)" | xargs rm -rf
ENTRYPOINT npm run start
