# Gelato PokeMe 🍦

## Description

Automate smart contract executions with Gelato by submitting tasks to `PokeMe`

- [PokeMe Mainnet](https://etherscan.io/address/0x89a26d08c26E00cE935a775Ba74A984Ad346679b)
- [TaskTreasury Mainnet](https://etherscan.io/address/0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f)
- [PokeMe Polygon / Matic](https://polygonscan.com/address/0x00e8f432b33D1C550E02Ff55c8413Fd50a931c39)
- [TaskTreasury Polygon / Matic](https://polygonscan.com/address/0xA8a7BBe83960B29789d5CB06Dcd2e6C1DF20581C)
- [PokeMe Ropsten](https://ropsten.etherscan.io/address/0x53638DFef84aAA6AAbA70F948d39d00001771d99)
- [TaskTreasury Ropsten](https://ropsten.etherscan.io/address/0x2705aCca70CdB3E326C1013eEA2c03A4f2935b66)

## Guide 🧑‍🦯

### Resolvers

To start, you would need to have a resolver contract which returns

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

Check out the [CounterResolver.sol](https://github.com/gelatodigital/pokeme/blob/a2c1bbe123d40844621f467943902e93e5a6a5c7/contracts/CounterResolver.sol) contract for an example of how a Resolver can look like.

### Creating task

To create a task, call `createTask()` on the PokeMe.sol contract. The function takes the following inputs:

- address `execAddress` : The contract which Gelato should execute the transactions on.\
- bytes4 `execSelector` : The function which Gelato should call in `execAddress` contract.\
- address `resolverAddress` : The address of resolver contract.\
- bytes `resolverData` : The data used to check on the Resolver when to execute the tx.\

Example of getting `execSelector` and `resolverData`,

```ts
const pokeMeAbi = ["function getSelector(string _func) external pure returns (bytes4)"]

const pokeMe = await ethers.getContractAt(pokeMeAbi, "0x89a26d08c26E00cE935a775Ba74A984Ad346679b");

const execSelector = await pokeMe.getSelector("increaseCount(uint256)");

const resolverAbi = ["function checker(address _token, address _receiver, uint256 amount) external view returns(bool canExec, bytes calldata execData)"]

const resolverInterface = new ethers.utils.Interface(resolverAbi)

const resolverData = await resolver.interface.encodeFunctionData(
    "checker",
    [addressX, addressY, 1]
  );
```

To create the Task and have Gelato bots start executing it, call `createTask()` like so:

```ts
  await pokeMe.createTask(execAddress, execSelector, resolverAddress, resolverData)
```

### Depositing Tokens in order to pay for the execution of your transactions

Transctions on Ethereum are not for free! That's why you need to deposit some tokens on the `TaskTreasury.sol` contract in order to pay for the executions. You can deposit any token you want. This balance will be deducted based on the actual execution cost per transaction. 

If for example the ethereum gas fees of a particular transaction cost $10 then your costs will be between $10-$12 dollars, where the margin on top of the miner fee will be given to Gelato bots.

```ts
  const taskTreasuryAbi = ["function depositFunds(address _receiver, address _token, uint256 _amount) external payable"]
  const taskTreasury = await ethers.getContractAt(taskTreasuryAbi, "0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f");
  const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" // Use this address for ETH deposits
  const depositAmount = ethers.utils.parseEther("1");
  const userAddress = "YOUR_ADDRESS"; // Use your address in here
  await taskTreasury.depositFunds(userAddress, ETH, depositAmount, { value: depositAmount });
```

If you deposit ERC20 tokens, make sure that you approve the TaskTreasury contract beforehand in order to not revert.

You can also always withdraw your deposited funds like so:

```ts
  const taskTreasuryAbi = ["function withdrawFunds(address payable _receiver, address _token, uint256 _amount ) external"]
  const taskTreasury = await ethers.getContractAt(taskTreasuryAbi, "0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f");
  const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" // Use this address for ETH deposits
  const depositAmount = ethers.utils.parseEther("1");
  const userAddress = "RECEIVER:ADDRESS"; // Address which should be receiving the funds
  await taskTreasury.withdrawFunds(userAddress, ETH, depositAmount);
```

### Canceling task

To cancel a task, call `cancelTask()` which has parameters:

- bytes32 `taskId` : The computed hash when task was created.

To get `taskId`, use `getTaskId`:

```ts
  const pokeMeAbi = [
    "function getTaskId(address _taskCreator, address _execAddress, bytes4 _selector) public pure returns (bytes32)",
    "function cancelTask(bytes32 _taskId) external"
  ]
  const pokeMe = await ethers.getContractAt(pokeMeAbi, "0x89a26d08c26E00cE935a775Ba74A984Ad346679b");

  const execSelector = await pokeMe.getSelector("transferFrom(address,address,uint256)");
  const taskId = await pokeMe.getTaskId(
    taskCreatorAddress,
    execAddress,
    selector
  );
  const taskHash = await pokeMe.cancelTask(taskId);
```

## Demo 🌟

### Using Etherscan - Mainnet:

This demo will automate incrementing a counter on the [Counter.sol](https://github.com/gelatodigital/pokeme/blob/23803cf2dc6e95614c1ec52a5dcce20dd70b70f6/contracts/Counter.sol) contract every 3 minutes.

1. Go to PokeMe's [Etherscan Page](https://etherscan.io/address/0x89a26d08c26E00cE935a775Ba74A984Ad346679b)
   
2. Call createTask with the following parameters:

- _execAddress: "0x15a4d35e067213278c5a996f6050f37e7de6df2f" - Counter.sol
- _execSelector: "0x46d4adf2" - "increaseCount(uint256)" function selector
- _resolverAddress: "0x17eaf9c43736b4e44c3b270a88aa162477e094e3" - CounterResolver.sol
- _resolverData: "0xcf5303cf" - encoded "checker()" data

![CreateTask](/createTask.png)

You can get the _execSelector using PokeMe's `getSelector()` func

![getSelector](/getSelector.png)
 
3. Deposit ETH or any Token you want to the [TaskTreasury](https://etherscan.io/address/0x66e2F69df68C8F56837142bE2E8C290EfE76DA9f) using the `depositFunds()` func in order to pay for transactions. The address you pass as `_receiver` should be the same address which calls `createTask()`, e.g. your EOA.

![Deposit Funds](/deposit2.png)

Use `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` as the `_token` address if you want to deposit ETH.

And you should be good to go ✅ Check the `count` on Counter.sol incrementing


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
