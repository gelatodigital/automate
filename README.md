# Gelato PokeMe

## Description

Automate smart contract executions with Gelato by submitting tasks to `PokeMe`

- [PokeMe](https://ropsten.etherscan.io/address/0x70921EFA654b7a30CC02279866a9644510726550)

## Submitting a task

1. Deposit some funds `depositFunds` with the callee address which will be submitting the task as parameter.
2. Callee can now call `createTask` with address and payload of the task.

Payload in 2. should be an encoded data of the function call and it's arguments.

## Demo

### Ropsten:

- [Counter](https://ropsten.etherscan.io/address/0x3e3a46586e19a0dc721e42455cBd9E395706b4e4)

```
npx hardhat run ./scripts/create-task-counter.js --network ropsten
```

A task will be submitted to increase the count in `Counter` every 3 minutes
