const { ethers, upgrades } = require("hardhat");
const { upgardeContract } = require("./utils");

async function main() {
  const [deployer] = await ethers.getSigners();

  const vault = "0x0F527785e39B22911946feDf580d87a4E00465f0";
  const controller = "0xf491AfE5101b2eE8abC1272FA8E2f85d68828396";

  //   await upgardeContract(deployer, vault, "EFVault");
  await upgardeContract(deployer, controller, "Controller");
}

main();
