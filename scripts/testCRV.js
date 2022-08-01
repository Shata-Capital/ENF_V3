const { ethers, network } = require("hardhat");
const fs = require("fs")
const { abi: erc20Abi } = require("../artifacts/contracts/erc20/ERC20Token.sol/ERC20Token.json")
const { abi: crvAbi } = require("../artifacts/contracts/test/CRV.sol/CRV.json")
const { abi: usdcAbi } = require("../artifacts/contracts/test/USDC.sol/USDC.json")
const { abi: usdtAbi } = require("../artifacts/contracts/test/USDT.sol/USDT.json")
const { abi: wethAbi } = require("../artifacts/contracts/test/WETH.sol/WETH.json")
const { abi: dummyUniAbi } = require("../artifacts/contracts/test/DummyUniswap.sol/DummyUniswap.json")
const { abi: eth_crvAbi } = require("../artifacts/contracts/test/ETHCRVSwap.sol/ETHCRVSwap.json")
const { abi: crv_cvxcrvAbi } = require("../artifacts/contracts/test/CRV_CRVCVXSwap.sol/CRV_CVXCRVSwap.json")
const { abi: oracleAbi } = require("../artifacts/contracts/test/Oracle.sol/Oracle.json")
const { abi: oracleEthAbi } = require("../artifacts/contracts/test/OracleETH.sol/OracleETH.json")
const { abi: stakerAbi } = require("../artifacts/contracts/test/Staker.sol/Staker.json")
const { abi: vaultAbi } = require("../artifacts/contracts/core/EFCRVVault.sol/EFCRVVault.json")

require("colors")

async function main() {
    const [deployer] = await ethers.getSigners();

    const feePool = "0xCBFb96CEed739b372f8cBb65c4c1e5b93923b36B"
    console.log("Testing contracts with the account:", deployer.address);

    // Contract Handles
    const addrList = JSON.parse(fs.readFileSync("scripts/address.json", 'utf-8'))
    const efToken = new ethers.Contract(addrList.EFToken, erc20Abi, deployer)
    const crvcvx = new ethers.Contract(addrList.CRVCVX, erc20Abi, deployer)
    const crv = new ethers.Contract(addrList.CRV, crvAbi, deployer)
    const usdc = new ethers.Contract(addrList.USDC, usdcAbi, deployer)
    const weth = new ethers.Contract(addrList.WETH, wethAbi, deployer)
    const eth_usdc = new ethers.Contract(addrList.ETH_USDC, dummyUniAbi, deployer)
    const eth_crv = new ethers.Contract(addrList.ETH_CRV, eth_crvAbi, deployer)
    const crv_cvxcrvSwap = new ethers.Contract(addrList.CRV_CVXCRV, crv_cvxcrvAbi, deployer)
    const staker = new ethers.Contract(addrList.Staker, stakerAbi, deployer)
    const crvVault = new ethers.Contract(addrList.CRVVault, vaultAbi, deployer)

    // console.log("\nCRVVault set Fee confit".green)
    // await crvVault.changeFeeConfig(feePool, 100, 1000)

    // // Deposit WETH
    // console.log("\nCreating LPs - Depsiting ETHER...".yellow)
    const bal = await weth.balanceOf(deployer.address)
    // await weth.transfer(eth_usdc.address, bal.div(10))
    // await weth.transfer(eth_usdt.address, bal.div(10))
    // await weth.transfer(eth_crv.address, bal.div(10))


    // Test ETH-USDC Swap
    console.log("\nTest Swap".green);
    // console.log("WETH Bal: ", await weth.balanceOf(eth_usdc.address), await usdc.balanceOf(eth_usdc.address))
    // // USDC Swap
    // await weth.approve(eth_usdc.address, bal)
    // let oldBal = await usdc.balanceOf(deployer.address)
    // await eth_usdc.swapExactTokensForTokens(
    //     ethers.utils.parseEther("0.05"),
    //     ethers.utils.parseUnits("100", 6),
    //     [weth.address, usdc.address],
    //     deployer.address
    // )
    // let newBal = await usdc.balanceOf(deployer.address)
    // console.log("USDC Swaped: ", ethers.utils.formatUnits(newBal.sub(oldBal), 6))

    // // CRV Swap
    // await weth.approve(eth_crv.address, bal.div(100))
    // const oldCRV = await crv.balanceOf(deployer.address)
    // await eth_crv.exchange(0, 1, bal.div(100), 0)
    // const newCRV = await crv.balanceOf(deployer.address)
    // console.log("CRV Swaped: ", ethers.utils.formatEther(newCRV.sub(oldCRV)))

    // // CRVCVX Swap
    // await crv.approve(crv_cvxcrvSwap.address, ethers.utils.parseEther("100"))
    // const oldCRVCVX = await crvcvx.balanceOf(deployer.address)
    // await crv_cvxcrvSwap.exchange(0, 1, ethers.utils.parseEther("100"), 0)
    // const newCRVCVX = await crvcvx.balanceOf(deployer.address)
    // console.log("CRVCVX Swaped: ", ethers.utils.formatEther(newCRVCVX.sub(oldCRVCVX)))

    // Test CRV Vault
    console.log("\nTesting CRV Vault".green)
    // await usdc.approve(crvVault.address, 0)
    console.log("Approved: ", ethers.utils.formatUnits(await usdc.allowance(deployer.address, crvVault.address), 6))
    // await usdc.approve(crvVault.address, ethers.utils.parseUnits("10", 6))
    // console.log("Approved: ", ethers.utils.formatUnits(await usdc.allowance(deployer.address, crvVault.address), 6))
    await crvVault.depositStable(ethers.utils.parseUnits("10", 6))
    console.log("Deposit 10 USDC")
    const efBal = await efToken.balanceOf(deployer.address)
    console.log(`Get ${ethers.utils.formatEther(efBal)} EF Token`)

    // for (let i = 0; i < 10; i++) {
    //     await network.provider.send("evm_mine");
    // }

    // await efToken.approve(crvVault.address, efBal);
    // oldBal = await usdc.balanceOf(deployer.address)
    // await crvVault.withdraw(efBal, true);
    // newBal = await usdc.balanceOf(deployer.address)
    // console.log(`Withdraw ${ethers.utils.formatEther(efBal)}`)
    // console.log(`Get ${ethers.utils.formatUnits(newBal.sub(oldBal), 6)} USDC`)
    // const fee = await crv.balanceOf(feePool)
    // console.log("Fee is collected: ", ethers.utils.formatEther(fee))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });