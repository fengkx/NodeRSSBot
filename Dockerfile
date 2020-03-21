FROM node:13.8.0-alpine as ts-builder
WORKDIR /app
COPY . /app
RUN npm install --ignore-scripts && npm run build

FROM node:13.8.0-alpine as dep-builder
WORKDIR /app
COPY package.json /app/package.json
RUN apk add --no-cache --update build-base python2
RUN npm install --production && bash clean-nm.sh

FROM node:13.8.0-alpine as app
WORKDIR /app
ENV NODE_PRODUTION true
COPY data logs clean-nm.sh /app/
COPY package.json /app/package.json
COPY --from=ts-builder /app/dist /app/dist
COPY --from=dep-builder /app/node_modules /app/node_modules
CMD npm run start-withsnapshot
