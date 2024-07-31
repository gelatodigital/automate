# Gelato Functions 🍦

> ℹ️ If you are looking for the Automate Legacy Smart Contracts version,
> they are available on the [`legacy` branch](https://github.com/gelatodigital/automate/tree/legacy).

## Description

Automate smart contract executions with Gelato by submitting tasks to `Gelato Functions`

Check out the [Gelato Documentation](https://docs.gelato.network/).

## Deploying a new network locally

Create .env file and include the following

```
AUTOMATE_DEPLOYER_PK=
HARDHAT_DYNAMIC_NETWORK_NAME=
HARDHAT_DYNAMIC_NETWORK_URL=
HARDHAT_DYNAMIC_NETWORK_CONTRACTS_GELATO=
HARDHAT_DYNAMIC_NETWORK_NO_DETERMINISTIC_DEPLOYMENT=
```

### Via CLI

```
npx hardhat deploy --network dynamic
```

### Via Docker

```
bash src/scripts/deploy-docker.sh
```

Include the following environment variables to verify the contracts:

```
HARDHAT_DYNAMIC_NETWORK_ETHERSCAN_VERIFY_URL=
HARDHAT_DYNAMIC_NETWORK_ETHERSCAN_API_KEY=
```
