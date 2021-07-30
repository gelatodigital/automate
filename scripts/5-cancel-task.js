const { ethers } = require("hardhat");

const POKEME = hre.network.config.POKEME;
const COUNTER = process.env.npm_config_counter;

async function main() {
  [user] = await hre.ethers.getSigners();
  userAddress = await user.getAddress();
  console.log("Canceling Task");

  const pokeMe = await ethers.getContractAt("PokeMe", POKEME, user);
  const counter = await ethers.getContractAt("Counter", COUNTER, user);

  selector = await pokeMe.getSelector("increaseCount(uint256)");

  const taskHash = await pokeMe.getTaskId(
    userAddress,
    counter.address,
    selector
  );

  txn = await pokeMe.cancelTask(taskHash, {
    gasLimit: 1000000,
    gasPrice: ethers.utils.parseUnits("2", "gwei"),
  });
  res = await txn.wait();
  console.log(res);

  console.log("Task Canceled");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
