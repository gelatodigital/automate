import { HardhatRuntimeEnvironment } from "hardhat/types";

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const isTesting = (name: string) => {
  if (name == "hardhat" || name.toLowerCase().includes("local")) return true;

  return false;
};

export const isZksync = (name: string) => {
  if (name.toLowerCase().includes("zksync")) return true;
  return false;
};

export function verifyRequiredEnvVar(
  key: string,
  value?: string
): asserts value is string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export async function isFirstDeploy(
  hre: HardhatRuntimeEnvironment,
  contractName: string
) {
  let isFirstDeploy = false;
  try {
    await hre.deployments.get("Automate_Proxy");
  } catch (error) {
    if (
      (error as Error).message.includes(
        `No Contract deployed with name ${contractName}_Proxy`
      )
    )
      isFirstDeploy = true;
  }

  return isFirstDeploy;
}
