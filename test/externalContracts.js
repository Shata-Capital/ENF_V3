const {
  usdc,
  crv,
  crvETHCurvePool,
  uniSwapV2Router,
  uniSwapV2Factory,
  alusdLP,
  notionBatch,
} = require("../constants/constants");

const usdcAbi = require("../abi/usdc.json");
const crvAbi = require("../abi/crv.json");
const crvETHAbi = require("../abi/crvETHPool.json");
const alusdAbi = require("../abi/alusd.json");
const notionAbi = require("../abi/notionBatch.json");
const uniswapV2RouterAbi = require("../abi/uniswapV2Router.json");
const uniswapV2FactoryAbi = require("../abi/uniswapV2Factory.json");
const { abi: depositApproverAbi } = require("../artifacts/contracts/core/DepositApprover.sol/DepositApprover.json");
const { abi: vaultAbi } = require("../artifacts/contracts/core/Vault.sol/EFVault.json");

exports.usdcContract = (deployer) => {
  return new ethers.Contract(usdc, usdcAbi, deployer);
};

exports.crvContract = (deployer) => {
  return new ethers.Contract(crv, crvAbi, deployer);
};

exports.crvETHContract = (deployer) => {
  return new ethers.Contract(crvETHCurvePool, crvETHAbi, deployer);
};

exports.alusdContract = (deployer) => {
  return new ethers.Contract(alusdLP, alusdAbi, deployer);
};

exports.uniV2RouterContract = (deployer) => {
  return new ethers.Contract(uniSwapV2Router, uniswapV2RouterAbi, deployer);
};

exports.uniV2FactoryContract = (deployer) => {
  return new ethers.Contract(uniSwapV2Factory, uniswapV2FactoryAbi, deployer);
};

exports.notionBatchContract = (deployer) => {
  return new ethers.Contract(notionBatch, notionAbi, deployer);
};

exports.depositApproverContract = (deployer, address) => {
  return new ethers.Contract(address, depositApproverAbi, deployer);
};

exports.vaultContract = (deployer, address) => {
  return new ethers.Contract(address, vaultAbi, deployer);
};
