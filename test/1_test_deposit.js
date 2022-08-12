const { ethers, waffle, network, upgrades } = require("hardhat");
const { expect, util } = require("chai");
const colors = require("colors")
const { utils } = require("ethers");

const { usdcContract, uniV2RouterContract, uniV2FactoryContract } = require("./externalContracts")

const { usdc, weth, convexBooster, alusdPid, alusdLP, curveAlusd } = require("../constants/constants")

let vault, controller, alusd

function toEth(num) {
    return utils.formatEther(num)
}

function toUSDC(num) {
    return utils.formatUnits(num, 6)
}

function fromEth(num) {
    return utils.parseEther(num.toString())
}

function fromUSDC(num) {
    return utils.parseUnits(num.toString(), 6)
}

async function swapUSDC(caller) {

    await uniV2RouterContract(caller).swapExactETHForTokens(
        0,
        [
            weth, usdc
        ],
        caller.address,
        100000000000,
        { value: fromEth(1) }
    )
}

describe("ENF Vault test", async () => {
    before(async () => {
        [deployer, alice, bob, carol, david, evan, fiona, treasury] = await ethers.getSigners();

        // Deploy Vault
        console.log("Deploying Vault".green)
        const Vault = await ethers.getContractFactory("EFVault")
        vault = await Vault.deploy(usdc, "ENF LP", "ENF")
        console.log(`Vault deployed at: ${vault.address}\n`)

        // Deploy Controller
        console.log("Deploying Controller".green)
        const Controller = await ethers.getContractFactory("Controller")
        controller = await Controller.deploy(vault.address, usdc, treasury.address)
        console.log(`Controller deployed at: ${controller.address}\n`)

        // Deploy Alusd
        console.log("Deploying ALUSD".green)
        const Alusd = await ethers.getContractFactory("Alusd")
        alusd = await Alusd.deploy(curveAlusd, alusdLP, controller.address, usdc, convexBooster, alusdPid)
        console.log(`Alusd deployed at: ${alusd.address}\n`)
    })

    it("Vault Deployed", async () => {
        const name = await vault.name()
        const symbol = await vault.symbol()
        const asset = await vault.asset()
        console.log("\tVault info: ", name, symbol, asset)
    })

    // Prepare USDC before
    it("Swap Ether to usdc in uniswap V2", async () => {
        // USDC current amt
        const curUSDC = await usdcContract(deployer).balanceOf(alice.address)
        console.log(`\tUSDC of Alice: ${toUSDC(curUSDC)}`)

        const pair = await uniV2FactoryContract(deployer).getPair(usdc, weth)
        console.log(`\tUSDC-ETH pair address: ${pair}`)

        await swapUSDC(alice)

        const newUSDC = await usdcContract(deployer).balanceOf(alice.address)
        console.log(`\tUSDC of Alice: ${toUSDC(newUSDC)}`)
    })

    // Register Alusd SS
    it("Register Alusd with non-owner will be reverted", async () => {
        await expect(controller.connect(alice).registerSubStrategy(alusd.address, 100)).to.revertedWith("Ownable: caller is not the owner")
    })

    it("Register Alusd as 100 alloc point, check total alloc to be 100, ss length to be 1", async () => {
        await controller.connect(deployer).registerSubStrategy(alusd.address, 100)
        const totalAlloc = await controller.totalAllocPoint()
        const ssLength = await controller.subStrategyLength()

        console.log(`\tTotal Alloc: ${totalAlloc.toNumber()}, ssLength: ${ssLength.toNumber()}`)
        expect(totalAlloc).to.equal(100)
        expect(ssLength).to.equal(1)
    })
})