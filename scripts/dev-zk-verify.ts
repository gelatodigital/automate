import hre = require("hardhat");
const { deployments } = hre;

const main = async () => {
  const contractName = "Automate_Proxy";

  const deployment = await deployments.get(contractName);
  const { address, args } = deployment;

  console.log(
    `Verifying "${contractName}" at "${address}". Args: ${JSON.stringify(args)}`
  );
  await hre.run("verify:verify", {
    address,
    constructorArguments: args,
  });
};

main();
