import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumberish, Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
import { FactoryOptions, Libraries } from "hardhat/types";

export const currentTimestamp = async (): Promise<number> => {
  const latestBlock = await ethers.provider.getBlock("latest");
  return latestBlock.timestamp;
};

export const advanceHours = async (numHours: number) =>
  ethers.provider.send("evm_mine", [
    await currentTimestamp().then((t) => t + Math.round(numHours * 60 * 60)),
  ]);

export const advanceBlocks = async (numBlocks: number) => {
  for (let i = 0; i < numBlocks; i++) {
    await ethers.provider.send("evm_mine", []);
  }
};

export const impersonate = async (...addresses: string[]) =>
  ethers.provider.send("hardhat_impersonateAccount", addresses);

export const formatValue = async (
  token: Contract,
  value: BigNumberish
): Promise<string> => ethers.utils.formatUnits(value, await token.decimals());

export const formatBalance = async (
  token: Contract,
  account: string
): Promise<string> => formatValue(token, await token.balanceOf(account));

type ContractDeploymentParams = {
  name: string;
  from: SignerWithAddress;
  args?: any[];
};

type ContractDeploymentParamsWithLibrary = {
  name: string;
  factoryOptions: FactoryOptions;
  args?: any[];
};

export const deployContract = async <T extends Contract>(
  params: ContractDeploymentParams
): Promise<T> => {
  const contractFactory = await ethers.getContractFactory(
    params.name,
    params.from
  );
  const contractInstance = await contractFactory.deploy(...(params.args || []));
  return (await contractInstance.deployed()) as T;
};

export const deployContractUpgradeable = async <T extends Contract>(
  params: ContractDeploymentParams
): Promise<T> => {
  const contractFactory = await ethers.getContractFactory(
    params.name,
    params.from
  );
  const contractInstance = await upgrades.deployProxy(contractFactory, [
    ...(params.args || []),
  ]);
  return (await contractInstance.deployed()) as T;
};

export const deployContractUpgradeableWithLib = async <T extends Contract>(
  params: ContractDeploymentParamsWithLibrary
): Promise<T> => {
  const contractFactory = await ethers.getContractFactory(
    params.name,
    params.factoryOptions
  );
  const contractInstance = await upgrades.deployProxy(contractFactory, [
    ...(params.args || []),
    { initializer: "initialize", unsafeAllow: ["external-library-linking"] },
  ]);
  return (await contractInstance.deployed()) as T;
};
