FROM node:lts-alpine3.20

WORKDIR /river

# monorepo root config
COPY ./package.json ./package.json
COPY ./.yarn/plugins ./.yarn/plugins
COPY ./.yarn/releases ./.yarn/releases
COPY ./.yarnrc.yml ./.yarnrc.yml
COPY ./buf.yaml ./buf.yaml
COPY ./lerna.json ./lerna.json
COPY ./yarn.lock ./yarn.lock
COPY ./turbo.json ./turbo.json
COPY ./packages/tsconfig.base.json ./packages/tsconfig.base.json

# monorepo core dependencies
COPY ./protocol ./protocol

# monorepo scripts
COPY ./scripts ./scripts

# monorepo packages
COPY ./packages/generated /river/packages/generated
COPY ./packages/web3 /river/packages/web3
COPY ./packages/dlog /river/packages/dlog
COPY ./packages/proto /river/packages/proto
COPY ./packages/metrics-discovery /river/packages/metrics-discovery

# install dependencies and build
RUN apk add --no-cache git curl
RUN corepack enable
RUN yarn install
RUN yarn run turbo build --filter @towns-protocol/metrics-discovery

WORKDIR /river/packages/metrics-discovery

HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -f http://localhost:8080 || exit 1

CMD [ "yarn", "start"]
