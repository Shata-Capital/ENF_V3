const { ethers } = require("hardhat");
const { utils } = require("ethers");

const address = require("../scripts/address.json");
const vault = address["ENF Vault address"];
const proxyAbi = require("../abi/proxy.json");

async function main() {
  const [deployer] = await ethers.getSigners();

  const vaultContract = new ethers.Contract(vault, proxyAbi, deployer);

  // Get Vault proxy admin
  const admin = await vaultContract.admin();
  console.log("Proxy Admin: ", admin);
}

main();
