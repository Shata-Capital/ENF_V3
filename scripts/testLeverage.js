const { ethers, network } = require("hardhat");
const fs = require("fs")
const { abi: erc20Abi } = require("../artifacts/contracts/erc20/ERC20Token.sol/ERC20Token.json")
const { abi: leverAbi } = require("../artifacts/contracts/core/EFLeverVault.sol/EFLeverVault.json");
const { abi: lidoAbi } = require("../artifacts/contracts/test/Lido.sol/Lido.json");
const { abi: wethAbi } = require("../artifacts/contracts/test/WETH.sol/WETH.json")
const { utils } = require("ethers");

require("colors")

async function main() {
    const [deployer] = await ethers.getSigners();

    const feePool = "0xCBFb96CEed739b372f8cBb65c4c1e5b93923b36B"
    console.log("Testing contracts with the account:", deployer.address);

    // Contract Handles
    const addrList = JSON.parse(fs.readFileSync("scripts/addressLeverage.json", 'utf-8'))
    const efToken = new ethers.Contract(addrList.EFToken, erc20Abi, deployer)
    const collateral = new ethers.Contract(addrList.collateral, erc20Abi, deployer)
    const efLeverVault = new ethers.Contract(addrList.efLeverVault, leverAbi, deployer)
    const lido = new ethers.Contract(addrList.lido, lidoAbi, deployer)
    const weth = new ethers.Contract(addrList.WETH, wethAbi, deployer)
    const zeroAddress = '0x0000000000000000000000000000000000000000'

    // await collateral.generateTokens(deployer.address, ethers.utils.parseEther("100000"));
    console.log("Generated Collateral Tokens: ", await utils.formatEther(await collateral.balanceOf(deployer.address)))

    // await weth.transfer(addrList.balancer, ethers.utils.parseEther("1"))
    // await weth.transfer(addrList.aave, ethers.utils.parseEther("1"))

    // Submit Ether to Lido
    // await lido.submit(zeroAddress, { value: ethers.utils.parseEther("1") });
    const share = await lido.balanceOf(deployer.address)
    console.log("Share amount: ", ethers.utils.formatEther(share))

    // Transfer Lido to curvepool
    // await lido.transfer(addrList.curve_pool, share.div(2))

    // // LeverVault Setting
    // await efLeverVault.changeFeePool(feePool);
    // await efLeverVault.changeBlockRate(ethers.utils.parseEther("0.00001"))

    // // Test Levervault
    // console.log("\nTesting LeverVault".green)
    // console.log("Deposit 0.1 Ether")
    // oldBal = await efToken.balanceOf(deployer.address)
    // await efLeverVault.deposit(ethers.utils.parseEther("0.1"), { value: ethers.utils.parseEther("0.1") })
    // newBal = await efToken.balanceOf(deployer.address)
    // console.log("Get ", ethers.utils.formatEther(newBal.sub(oldBal)), "EF Token")

    console.log("Withdraw")
    oldEF = await efToken.balanceOf(deployer.address);
    console.log("Get ", ethers.utils.formatEther(oldEF), "EF Token")
    await efLeverVault.withdraw(oldEF)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });