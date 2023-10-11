import { AutomateModule, TriggerType } from "@gelatonetwork/automate-sdk";
import { expect } from "chai";
import { AutomateTaskCreatorTest } from "../typechain";
import { Module } from "./utils";
import hre = require("hardhat");
const { ethers, deployments } = hre;

describe("AutomateTaskCreator test", function () {
  let automateTaskCreator: AutomateTaskCreatorTest;
  let automateModule: AutomateModule;

  before(async function () {
    await deployments.fixture();

    automateModule = new AutomateModule();

    const automate = await ethers.getContract("Automate");
    const proxyModule = await ethers.getContract("ProxyModule");

    await automate.setModule([Module.PROXY], [proxyModule.address]);

    const automateTaskCreatorFactory = await ethers.getContractFactory(
      "AutomateTaskCreatorTest"
    );
    automateTaskCreator = (await automateTaskCreatorFactory.deploy(
      automate.address
    )) as AutomateTaskCreatorTest;
  });

  it("should return resolver module data", async () => {
    const [resolverAddress, resolverData] =
      await automateTaskCreator.resolverModuleArgs();

    const resolverModuleData = await automateTaskCreator.resolverModuleData();

    const expectedModuleData = await automateModule.encodeModuleArgs({
      resolverAddress,
      resolverData,
    });

    expect(expectedModuleData.modules).to.eql(resolverModuleData[0]);
    expect(expectedModuleData.args).to.eql(resolverModuleData[1]);
  });

  it("should return singleExec module data", async () => {
    const singleExecModuleData =
      await automateTaskCreator.singleExecModuleData();

    const expectedModuleData = await automateModule.encodeModuleArgs({
      singleExec: true,
    });

    expect(expectedModuleData.modules).to.eql(singleExecModuleData[0]);
    expect(expectedModuleData.args).to.eql(singleExecModuleData[1]);
  });

  it("should return proxy module data", async () => {
    const proxyModuleData = await automateTaskCreator.proxyModuleData();

    const expectedModuleData = await automateModule.encodeModuleArgs({
      dedicatedMsgSender: true,
    });

    expect(expectedModuleData.modules).to.eql(proxyModuleData[0]);
    expect(expectedModuleData.args).to.eql(proxyModuleData[1]);
  });

  it("should return web3 function module data", async () => {
    const [web3FunctionHash, currency, oracleAddress] =
      await automateTaskCreator.web3FunctionArg();

    const web3FunctionModuleData =
      await automateTaskCreator.web3FunctionModuleData();

    const expectedModuleData = await automateModule.encodeModuleArgs({
      web3FunctionHash,
      web3FunctionArgs: {
        currency: currency,
        oracle: oracleAddress,
      },
    });

    expect(expectedModuleData.modules).to.eql(web3FunctionModuleData[0]);
    expect(expectedModuleData.args).to.eql(web3FunctionModuleData[1]);
  });

  it("should return time trigger module data", async () => {
    const [startTime, interval] = await automateTaskCreator.timeTriggerArg();

    const timeTriggerModuleData =
      await automateTaskCreator.timeTriggerModuleData();

    const expectedModuleData = await automateModule.encodeModuleArgs({
      trigger: {
        type: TriggerType.TIME,
        start: Number(startTime),
        interval: Number(interval),
      },
    });

    expect(expectedModuleData.modules).to.eql(timeTriggerModuleData[0]);
    expect(expectedModuleData.args).to.eql(timeTriggerModuleData[1]);
  });

  it("should return cron trigger module data", async () => {
    const cronExpression = await automateTaskCreator.cronTriggerArg();

    const cronTriggerModuleData =
      await automateTaskCreator.cronTriggerModuleData();

    const expectedModuleData = await automateModule.encodeModuleArgs({
      trigger: {
        type: TriggerType.CRON,
        cron: cronExpression,
      },
    });

    expect(expectedModuleData.modules).to.eql(cronTriggerModuleData[0]);
    expect(expectedModuleData.args).to.eql(cronTriggerModuleData[1]);
  });

  it("should return event trigger module data", async () => {
    const [address, topics, blockConfirmations] =
      await automateTaskCreator.eventTriggerArg();

    const eventTriggerModuleData =
      await automateTaskCreator.eventTriggerModuleData();

    const expectedModuleData = await automateModule.encodeModuleArgs({
      trigger: {
        type: TriggerType.EVENT,
        filter: {
          address,
          topics,
        },
        blockConfirmations: blockConfirmations.toNumber(),
      },
    });

    expect(expectedModuleData.modules).to.eql(eventTriggerModuleData[0]);
    expect(expectedModuleData.args).to.eql(eventTriggerModuleData[1]);
  });
});
