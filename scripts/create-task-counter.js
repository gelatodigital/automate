const { ethers } = require("hardhat");

// const POKEME_ADDRESS = "0x642F5ACFE6897B5b82565CF22e8ee17972C57a9f";
// const COUNTER_ADDRESS = "0x92cDca8c76FD91dcA40772509a8470B9Ce0b55B6";
// const RESOLVER_ADDRESS = "0xc6c755302E71448c11b5041Cf5592AE993dfA288";

async function main() {
  [user] = await hre.ethers.getSigners();
  userAddress = await user.getAddress();
  console.log("User address: ", userAddress);

  const pokeme = await ethers.getContractAt("PokeMe", POKEME_ADDRESS, user);
  const resolver = await ethers.getContractAt(
    "Resolver",
    RESOLVER_ADDRESS,
    user
  );

  let txn = await pokeme.depositFunds({
    value: ethers.utils.parseEther("0.1"),
  });
  await txn.wait();

  console.log(
    "Sponsor balance: ",
    (await pokeme.balanceOfSponsor(userAddress)).toString()
  );

  txn = await pokeme.whitelistCallee(userAddress);
  await txn.wait();

  console.log("Sponsor of user: ", await pokeme.sponsorOfCallee(userAddress));

  const taskData = await resolver.interface.encodeFunctionData(
    "genPayloadAndCanExec",
    [1]
  );
  txn = await pokeme.createTask(RESOLVER_ADDRESS, taskData);
  await txn.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
