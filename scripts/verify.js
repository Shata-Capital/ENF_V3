const { ethers } = require("hardhat");
const fs = require("fs");
const { yellow, cyan } = require("colors");

const { deployContract, deployUpgradeable, verifyContract, verifyUpgradeable } = require("./utils");
const constants = require("../constants/constants");
const { treasury } = require("./config");
const address = require("./address.json");

async function main() {
  const [deployer] = await ethers.getSigners();

  /////////////////////////////////////////
  //             DEPLOYING               //
  /////////////////////////////////////////

  console.log("\nDeploying Contracts\n".yellow);

  // Deploying Deposit Approver
  //   const depositApprover = "0x237591933e6d04f28c81e13dfd1f278625f39c43";
  //   const address = "0x8A176c17932F390163660f1582B0849780bc6E6a";
  //   await verifyContract(address, [constants.weth, "0xf491AfE5101b2eE8abC1272FA8E2f85d68828396"]);

  //   //   const vault = await deployUpgradeable(deployer, "EFVault", [constants.usdc, "ENF LP", "ENF"]);

  //   const alusd = "0xB9D1dc019FD2f716732E97E2af42D292711BaA01";
  //   await verifyUpgradeable(alusd);
  const cusdc = "0xB6996421003fB94540F3f19Ef7b7Fe3353bd8e9b";
  await verifyUpgradeable(cusdc);

  //   const uniV2 = "0x09B56dB4776D0b262f67533A4010327Fbe32cA5C";
  //   await verifyContract(uniV2, [constants.weth, "0x8A176c17932F390163660f1582B0849780bc6E6a"]);

  //   const uniV3 = "0x283018F3f002D9fa81BEe97a9bC5B7Ef037f9391";
  //   await verifyContract(uniV3, [
  //     constants.uniSwapV3Router,
  //     "0x8A176c17932F390163660f1582B0849780bc6E6a",
  //     constants.weth,
  //   ]);

  // const curve = "0x5FDE4E7c47710aAa15046F075D4BC610161A4a1b";
  // await verifyContract(curve, [constants.weth, "0x8A176c17932F390163660f1582B0849780bc6E6a"]);

  // const balancer = "0x67493040e252006a59aF2724CA3e4285eE44D22A";
  // await verifyContract(balancer, [
  //   constants.balancerV2Vault,
  //   "0x8A176c17932F390163660f1582B0849780bc6E6a",
  //   constants.weth,
  // ]);

  // const balancerBatch = "0xf65622f28243Bc27Dc2735442BAae8CCA6d578eF";
  // await verifyContract(balancerBatch, [
  //   constants.balancerV2Vault,
  //   "0x8A176c17932F390163660f1582B0849780bc6E6a",
  //   constants.weth,
  // ]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
