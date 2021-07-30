# Gelato PokeMe 🍦

## Description

Automate smart contract executions with Gelato by submitting tasks to `PokeMe`

- [PokeMe Mainnet](https://etherscan.io/address/0x89a26d08c26E00cE935a775Ba74A984Ad346679b)
- [TaskTreasury Mainnet](https://etherscan.io/address/0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f)
- [PokeMe Ropsten](https://ropsten.etherscan.io/address/0x53638DFef84aAA6AAbA70F948d39d00001771d99)
- [TaskTreasury Ropsten](https://ropsten.etherscan.io/address/0x2705aCca70CdB3E326C1013eEA2c03A4f2935b66)

## Guide 🧑‍🦯

### Resolvers

To start, you would need to have a resolver contract which returns

- Wether your task should be executed.
- Payload of the execution.

Example of a checker function:

```
 function checker()
        external
        view
        override
        returns (bool canExec, bytes memory execPayload)
```

This function can be named whatever you want. And it will be passed to `PokeMe` later on.

### Creating task

To create a task, call `createTask()` which has parameters:

- address `execAddress` : The contract which Gelato should execute the transactions.\
- bytes4 `execSelector` : The function which Gelato should call in `execAddress` contract.\
- address `resolverAddress` : The address of resolver contract.\
- bytes `resolverData` : The data used to check on the Resolver when to execute the tx.\

Example of getting `execSelector` and `resolverData`,

```
const execSelector = await pokeMe.getSelector("transferFrom(address,address,uint256)");

 const resolverData = await resolver.interface.encodeFunctionData(
      "checker",
      [addressX, addressY, 1]
    );
```

### Canceling task

To cancel a task, call `cancelTask()` which has parameters:

- bytes32 `taskId` : The computed hash when task was created.

To get `taskId`, use `getTaskId`:

```
 const taskHash = await pokeMe.getTaskId(
    taskCreatorAddress,
    execAddress,
    selector
  );
```

## Demo 🌟

### Ropsten:

In this demo, you will deploy your own instance of `Counter`, `CounterResolver` contract and submit a task to `PokeMe`, which Gelato will then monitor and increase the count of your `Counter` every 3 minutes.

1. Git clone this repo.

2. Install dependencies with `yarn` and fill out `ALCHEMY_ID`, `DEPLOYER_PK_ROPSTEN`, `ETHERSCAN_API` in .env.

3. Deploy your `Counter` contract. The `Counter address` will be needed later on.

```

npm run deploy-counter

```

4. Verify your `Counter` contract so that you will be able to check the count easily.

```

npx hardhat verify --network ropsten "YOUR COUNTER ADDRESS"

```

5. Deploy your `CounterResolver` contract. The `CounterResolver address` will be needed later on.

```

npm run deploy-resolver --counter=YOUR COUNTER ADDRESS

```

6. Deposit some ETH to `TaskTreasury` which will be used to pay Gelato executors after each successful execution. Make sure to have more than 0.1 ETH on ropsten.

```

npm run deposit

```

7. Submit a task to `PokeMe` to tell Gelato to monitor your `Counter` contract.

```

npm run submit-task --counter=YOUR COUNTER ADDRESS --resolver=YOUR RESOLVER ADDRESS

```

8. Done! Gelato will pick up on the task you submitted. You can check the count of your `Counter` on Ropsten Etherscan.

To stop Gelato from monitoring, cancel the task.

```

npm run cancel-task --counter=YOUR COUNTER ADDRESS

```

Withdraw remaining ETH

```

npm run withdraw

```
