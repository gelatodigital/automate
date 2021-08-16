# Gelato PokeMe 🍦

## Description

Automate smart contract executions with Gelato by submitting tasks to `PokeMe`

- [PokeMe Mainnet](https://etherscan.io/address/0x89a26d08c26E00cE935a775Ba74A984Ad346679b)
- [TaskTreasury Mainnet](https://etherscan.io/address/0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f)
- [PokeMe Polygon / Matic](https://polygonscan.com/address/0x00e8f432b33D1C550E02Ff55c8413Fd50a931c39)
- [TaskTreasury Polygon / Matic](https://polygonscan.com/address/0xA8a7BBe83960B29789d5CB06Dcd2e6C1DF20581C)
- [PokeMe Fantom](https://ftmscan.com/address/0x04bdbb7ef8c17117d8ef884029c268b7becb2a19)
- [TaskTreasury Fantom](https://ftmscan.com/address/0x6c3224f9b3fee000a444681d5d45e4532d5ba531)
- [PokeMe Ropsten](https://ropsten.etherscan.io/address/0x53638DFef84aAA6AAbA70F948d39d00001771d99)
- [TaskTreasury Ropsten](https://ropsten.etherscan.io/address/0x2705aCca70CdB3E326C1013eEA2c03A4f2935b66)

## Guide 🧑‍🦯

### PokeMeReady

For the contract you are trying to automate, inherit [PokeMeReady.sol](https://github.com/gelatodigital/poke-me/blob/master/contracts/PokeMeReady.sol) and use the `onlyPokeMe` modifier in the function which Gelato will call. Take a look at [Counter.sol](https://github.com/gelatodigital/poke-me/blob/master/contracts/Counter.sol).

For simplicity, you could just use this modifier if your contract is on mainnet:

```js
    modifier onlyPokeMe() {
        require(msg.sender == address(0x89a26d08c26E00cE935a775Ba74A984Ad346679b), "PokeMeReady: onlyPokeMe");
        _;
    }
```

### Resolvers

You would need to have a resolver contract which returns

- Whether your task should be executed.
- Payload of the execution. This Payload should consist of the function selector + encoded data

Example of a Resolver which exposes a checker function:

```js
  contract CounterResolver {

    uint256 public count;

    constructor(address _counter) {
        COUNTER = _counter;
    }

    function checker()
        external
        view
        override
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = true; // will always execute

        execPayload = abi.encodeWithSelector(
            CounterResolver.increaseCount.selector,
            uint256(100)
        );
    }

    function increaseCount(uint256 amount) external {
        require(
            ((block.timestamp - lastExecuted) > 180),
            "Counter: increaseCount: Time not elapsed"
        );

        count += amount;
    }
  }
```

This `checker` function can be named whatever you want and can take arbitrary parameters. The only important thing is that it returns a boolean indicating whether the transaction should execute and bytes that determine which function should be called with which inputs.

Check out the [CounterResolver.sol](https://github.com/gelatodigital/poke-me/blob/master/contracts/CounterResolver.sol) contract for an example of how a Resolver can look like.

### Creating task

1. Go to [PokeMe's UI](https://app.gelato.network/dashboard)
2. Navigate to Submit Task.

![SubmitTask](/img/submitTask1.png)

3. Fill in the `Execution address` and choose the function which you want to automate.

4. Fill in the `Resolver address` and choose the function Gelato should call off-chain to check if it should be executed.

5. Make sure your execution and resolver contracts are verified on Etherscan/Polygonscan.

If the contracts are not verified, you can get `execSelector` and `resolverData` like so:

```ts
const pokeMeAbi = [
  "function getSelector(string _func) external pure returns (bytes4)",
];

const pokeMe = await ethers.getContractAt(
  pokeMeAbi,
  "0x89a26d08c26E00cE935a775Ba74A984Ad346679b"
);

const execSelector = await pokeMe.getSelector("increaseCount(uint256)");

const resolverAbi = [
  "function checker(address _token, address _receiver, uint256 amount) external view returns(bool canExec, bytes calldata execData)",
];

const resolverInterface = new ethers.utils.Interface(resolverAbi);

const resolverData = await resolver.interface.encodeFunctionData("checker", [
  addressX,
  addressY,
  1,
]);
```

### Depositing Tokens in order to pay for the execution of your transactions

1. Go to [PokeMe's UI](https://app.gelato.network/dashboard)
2. Navigate to Manage Funds.

![Deposit Funds](/img/depositFunds.png)

3. Select the token and the amount you want to deposit.

4. Deposit tokens.

### Canceling task

1. Go to [PokeMe's UI](https://app.gelato.network/dashboard)
2. Navigate to My Tasks.

![My Tasks](/img/myTasks.png)

3. Click on the task you want to cancel.

![Task Status](/img/taskStatus.png)

4. Under Task Status, click on Cancel Task.

## Demo 🌟

### Using Etherscan - Mainnet:

This demo will automate incrementing a counter on the [Counter.sol](https://github.com/gelatodigital/poke-me/blob/master/contracts/Counter.sol) contract every 3 minutes.

1. Go to [PokeMe's UI](https://app.gelato.network/dashboard)
2. Navigate to Submit Task

![SubmitTask](/img/submitTask2.png)

Fill in the execution address with `0x63c51b1d80b209cf336bec5a3e17d3523b088cdb` and select `Count()`

Fill in the resolver address with `0x95f4538C3950CE0EF5821f2049aE2aC5cCade68D` and select `Checker()`

3. Deposit some ETH

![Deposit Funds](/img/depositFunds.png)

### Using CLI - Ropsten:

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
