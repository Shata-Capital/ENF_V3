const { ethers } = require("hardhat");
const { utils } = require("ethers");
const { deployUpgradeable, deployContract } = require("./utils");

function toEth(num) {
  return utils.formatEther(num);
}

function toUSDC(num) {
  return utils.formatUnits(num, 6);
}

function fromEth(num) {
  return utils.parseEther(num.toString());
}

function fromUSDC(num) {
  return utils.parseUnits(num.toString(), 6);
}

async function main() {
  const [deployer] = await ethers.getSigners();

  // Deploying Notional

  const vault = await deployContract(deployer, "EFVault", []);
  console.log("Vault: ", vault.address);

  const controller = await deployContract(deployer, "Controller", []);
  console.log("Controller: ", controller.address);

  const cDai = await deployContract(deployer, "CDai", []);
  console.log("CDai: ", cDai.address);

  const alusd = await deployContract(deployer, "Alusd", []);
  console.log("alusd: ", alusd.address);

  const lusd = await deployContract(deployer, "Lusd", []);
  console.log("lusd: ", lusd.address);

  const tri = await deployContract(deployer, "Tri", []);
  console.log("tri: ", tri.address);

  const compound = await deployContract(deployer, "CompoundV3", []);
  console.log("compound: ", compound.address);

  const aave = await deployContract(deployer, "Aave", []);
  console.log("aave: ", aave.address);

  const cusdc = await deployContract(deployer, "Cusdc", []);
  console.log("cusdc: ", cusdc.address);
}

main();
