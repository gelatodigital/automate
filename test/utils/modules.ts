import { ethers } from "hardhat";

/* eslint-disable @typescript-eslint/naming-convention */
export enum Module {
  RESOLVER,
  DEPRECATED_TIME,
  PROXY,
  SINGLE_EXEC,
  WEB3_FUNCTION,
  TRIGGER,
}

export type ModuleData = {
  modules: Module[];
  args: string[];
};

export enum TriggerType {
  TIME,
  CRON,
}

export type TimeTrigger = {
  type: TriggerType.TIME;
  interval: number;
  start?: number;
};

export type CronTrigger = {
  type: TriggerType.CRON;
  cron: string;
};

export type TriggerConfig = TimeTrigger | CronTrigger;

export const encodeResolverArgs = (
  resolverAddress: string,
  resolverData: string
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["address", "bytes"],
    [resolverAddress, resolverData]
  );

  return encoded;
};

export const encodeTimeArgs = (startTime: number, interval: number): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["uint128", "uint128"],
    [startTime, interval]
  );

  return encoded;
};

export const encodeTriggerArgs = (trigger: TriggerConfig): string => {
  let triggerArgs: string;

  if (trigger.type === TriggerType.TIME) {
    const triggerBytes = ethers.utils.defaultAbiCoder.encode(
      ["uint128", "uint128"],
      [trigger.start ?? 0, trigger.interval]
    );

    triggerArgs = ethers.utils.defaultAbiCoder.encode(
      ["uint128", "bytes"],
      [Number(TriggerType.TIME), triggerBytes]
    );
  } else {
    const triggerBytes = ethers.utils.defaultAbiCoder.encode(
      ["string"],
      [trigger.cron]
    );

    triggerArgs = ethers.utils.defaultAbiCoder.encode(
      ["uint8", "bytes"],
      [Number(TriggerType.CRON), triggerBytes]
    );
  }

  return triggerArgs;
};
