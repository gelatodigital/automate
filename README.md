# Gelato PokeMe 🍦

## Description

Automate smart contract executions with Gelato by submitting tasks to `PokeMe`

- [PokeMe](https://ropsten.etherscan.io/address/0xeC8700A092789F58608212E314e3576bF2E98556)

## Demo

### Ropsten:

In this demo, you will deploy your own instance of `Counter` contract and submit a task to `PokeMe`, which Gelato will then monitor and increase the count of your `Counter` every 3 minutes.

1. Git clone this repo.

2. Install dependencies and fill out `ALCHEMY_ID`, `DEPLOYER_PK_ROPSTEN`, `ETHERSCAN_API` in .env.

3. Deploy your `Counter` contract. The `Counter` address will be needed later on.

```
npm run deploy-counter
```

4. Verify your `Counter` contract so that you will be able to check the count easily.

```
npx hardhat verify --network ropsten "YOUR COUNTER ADDRESS"
```

5. Deposit some ETH to `PokeMe` which will be used to pay Gelato executors after each successful execution. Make sure to have more than 0.1 ETH on ropsten.

```
npm run deposit
```

6. Submit a task to `PokeMe` to tell Gelato to monitor your `Counter` contract.

```
npm run submit-task --counter=YOUR COUNTER ADDRESS
```

7. Done! Gelato will pick up on the task you submitted. You can check the count of your `Counter` on Ropsten Etherscan.

8. To stop Gelato from monitoring, cancel the task.

```
npm run cancel-task --counter=YOUR COUNTER ADDRESS
```

9. Withdraw your remaining ETH

```
npm run withdraw
```
