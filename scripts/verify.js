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

  // const tri = "0x0F97afE1aedFc6B89DE66950296E130cA814B010";
  const cDai = "0xD359D65Cf9Ab8572323Dc8102Ac579baD38AC713";
  const curve3 = "0xECA1F6Fc9E100585B33392120080e15Ef4Af5c72";
  // await verifyUpgradeable(cDai);
  await verifyContract(curve3, [constants.weth, "0xD359D65Cf9Ab8572323Dc8102Ac579baD38AC713"]);
  // await verifyUpgradeable(lusd.address);
  // await verifyUpgradeable(aave.address);
  // await verifyUpgradeable(compound.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
