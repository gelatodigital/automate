
FROM node:18.18.2 as builder

WORKDIR /usr/src/app

ARG AUTOMATE_DEPLOYER_PK
ARG HARDHAT_DYNAMIC_NETWORK_NAME
ARG HARDHAT_DYNAMIC_NETWORK_URL
ARG HARDHAT_DYNAMIC_NETWORK_CONTRACTS_GELATO
ARG HARDHAT_DYNAMIC_NETWORK_NO_DETERMINISTIC_DEPLOYMENT
ARG TESTNET_OWNER_ADDRESS
ARG MAINNET_OWNER_ADDRESS
ARG IS_TESTNET

ENV TESTNET_OWNER_ADDRESS=${TESTNET_OWNER_ADDRESS}
ENV MAINNET_OWNER_ADDRESS=${MAINNET_OWNER_ADDRESS}
ENV IS_TESTNET=${IS_TESTNET}

COPY package.json yarn.lock .yarnrc.yml ./

COPY .yarn ./.yarn

RUN yarn install

COPY . .

RUN yarn run build

RUN npx hardhat deploy --network dynamic || true

RUN npx hardhat run ./scripts/dev-modules.ts --network dynamic || true

RUN npx hardhat run ./scripts/dev-transfer-automate-ownership.ts --network dynamic || true

RUN npx hardhat run ./scripts/dev-transfer-opsProxyFactory-ownership.ts --network dynamic || true

FROM alpine:3.20

WORKDIR /usr/src/app

ARG HARDHAT_DYNAMIC_NETWORK_NAME

COPY --from=builder /usr/src/app/deployments/$HARDHAT_DYNAMIC_NETWORK_NAME ./$HARDHAT_DYNAMIC_NETWORK_NAME