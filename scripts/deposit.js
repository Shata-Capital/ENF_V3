const { ethers } = require("hardhat");
const { utils } = require("ethers");

const { usdcContract, depositApproverContract } = require("../test/externalContracts");
const depositApprover = "0x325c8Df4CFb5B068675AFF8f62aA668D1dEc3C4B";

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

  const curUSDC = await usdcContract(deployer).balanceOf(deployer.address);
  console.log(`\tUSDC of Alice: ${toUSDC(curUSDC)}`);

  // Approve to deposit approver
  await usdcContract(deployer).approve(depositApprover, fromUSDC(100));

  // Deposit
  await depositApproverContract(deployer, depositApprover).deposit(fromUSDC(100));

  // Read Total Assets
  const total = await vault.totalAssets();
  console.log(`\tTotal USDC Balance: ${toUSDC(total)}`);

  // Read ENF token Mint
  const enf = await vault.balanceOf(deployer.address);
  console.log(`\tAlice ENF Balance: ${toEth(enf)}`);
}

main();
