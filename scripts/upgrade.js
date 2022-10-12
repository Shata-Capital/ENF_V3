const { ethers, upgrades } = require("hardhat");
const { upgardeContract } = require("./utils");

async function main() {
  const [deployer] = await ethers.getSigners();

  const vault = "0x0F527785e39B22911946feDf580d87a4E00465f0";
  const controller = "0xf491AfE5101b2eE8abC1272FA8E2f85d68828396";
  const cDai = "0x89372b32b8AF3F1272e2efb3088616318D2834cA";
  const exchange = "0x5E5713a0d915701F464DEbb66015adD62B2e6AE9";
  //   await upgardeContract(deployer, vault, "EFVault");
  await upgardeContract(deployer, exchange, "Exchange");
}

main();
