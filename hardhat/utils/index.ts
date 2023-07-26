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
