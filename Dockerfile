FROM node:12-alpine as ts-builder
WORKDIR /app
COPY . /app
RUN npm install --ignore-scripts && npm run build

FROM node:12-alpine as dep-builder
WORKDIR /app
COPY package.json clean-nm.sh /app/
RUN apk add --no-cache --update build-base python2
RUN LDFLAGS='-static-libgcc -static-libstdc++' npm install --production && sh /app/clean-nm.sh

FROM astefanutti/scratch-node:12 as app
WORKDIR /app
ENV NODE_PRODUTION true
COPY data /app/data
COPY logs /app/logs
COPY package.json /app/package.json
COPY --from=ts-builder /app/dist /app/dist
COPY --from=dep-builder /app/node_modules /app/node_modules
ENTRYPOINT ["/bin/node", "/app/node_modules/.bin/cross-env", "NODE_PRODUTION=true", "/bin/node", "/app/dist/source/index.js"]
