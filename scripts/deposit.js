const { ethers } = require("hardhat");
const { utils } = require("ethers");

const { usdcContract, depositApproverContract } = require("../test/externalContracts");
const depositApprover = "0xaB837301d12cDc4b97f1E910FC56C9179894d9cf";

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
}

main();
