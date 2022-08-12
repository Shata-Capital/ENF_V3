const { usdc, uniSwapV2Router, uniSwapV2Factory } = require("../constants/constants")

const usdcAbi = require("../abi/usdc.json")
const uniswapV2RouterAbi = require("../abi/uniswapV2Router.json")
const uniswapV2FactoryAbi = require("../abi/uniswapV2Factory.json")

exports.usdcContract = (deployer) => {
    return new ethers.Contract(usdc, usdcAbi, deployer)
}

exports.uniV2RouterContract = (deployer) => {
    return new ethers.Contract(uniSwapV2Router, uniswapV2RouterAbi, deployer)
}

exports.uniV2FactoryContract = (deployer) => {
    return new ethers.Contract(uniSwapV2Factory, uniswapV2FactoryAbi, deployer)
}