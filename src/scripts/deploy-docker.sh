#!/bin/bash

set -e

source .env

cd "$(dirname "$0")/../.."

IMAGE_NAME=automate-contracts-$HARDHAT_DYNAMIC_NETWORK_NAME

docker build --no-cache --progress plain \
    --build-arg AUTOMATE_DEPLOYER_PK="${AUTOMATE_DEPLOYER_PK}" \
    --build-arg HARDHAT_DYNAMIC_NETWORK_NAME="${HARDHAT_DYNAMIC_NETWORK_NAME}" \
    --build-arg HARDHAT_DYNAMIC_NETWORK_URL="${HARDHAT_DYNAMIC_NETWORK_URL}" \
    --build-arg HARDHAT_DYNAMIC_NETWORK_CONTRACTS_GELATO="${HARDHAT_DYNAMIC_NETWORK_CONTRACTS_GELATO}" \
    --build-arg HARDHAT_DYNAMIC_NETWORK_NO_DETERMINISTIC_DEPLOYMENT="${HARDHAT_DYNAMIC_NETWORK_NO_DETERMINISTIC_DEPLOYMENT}" \
    -t $IMAGE_NAME .

docker cp $(docker create $IMAGE_NAME):/usr/src/app/$HARDHAT_DYNAMIC_NETWORK_NAME $(pwd)/deployments
