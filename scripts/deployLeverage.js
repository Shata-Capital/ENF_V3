const { ethers, network } = require("hardhat");
const fs = require("fs")
require("colors")
const { abi: wethAbi } = require("../artifacts/contracts/test/WETH.sol/WETH.json")
const { abi: erc20Abi } = require("../artifacts/contracts/erc20/ERC20Token.sol/ERC20Token.json")

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const feePool = "0xCBFb96CEed739b372f8cBb65c4c1e5b93923b36B"

  const addrList = JSON.parse(fs.readFileSync("scripts/address.json", 'utf-8'))
  let weth = new ethers.Contract(addrList.WETH, wethAbi, deployer)
  let efToken = new ethers.Contract(addrList.EFToken, erc20Abi, deployer)

  const zeroAddress = '0x0000000000000000000000000000000000000000'
  const blockNum = (await ethers.provider.getBlock("latest")).number

  const AddressArray = await ethers.getContractFactory("AddressArray")
  const addressArray = await AddressArray.deploy()

  const SafeMath = await ethers.getContractFactory("SafeMath")
  const safeMath = await SafeMath.deploy()

  // Deploy Token Factory and Token
  const Factory = await ethers.getContractFactory("ERC20TokenFactory", {
    libraries: {
      AddressArray: addressArray.address
    }
  })
  const factory = await Factory.deploy()

  console.log("Factory deplooyed: ", factory.address)


  console.log("\nDeploying LeverVault".green)

  // Deploy Collateral
  const Collateral = await ethers.getContractFactory("ERC20Token", {
    libraries: {
      AddressArray: addressArray.address
    }
  })
  const collateral = await Collateral.deploy(factory.address, zeroAddress, blockNum, "Collateral", 18, "Collateral", true)
  console.log("Collateral Deployed: ", collateral.address)

  // Deploy AAVE
  const AAVE = await ethers.getContractFactory("AAVE")
  const aave = await AAVE.deploy(collateral.address)
  console.log("AAVE deployed: ", aave.address);

  // Deploy Lido
  const Lido = await ethers.getContractFactory("Lido", {
    libraries: {
      SafeMath: safeMath.address,
    }
  })
  const lido = await Lido.deploy()
  console.log("Lido deployed: ", lido.address);

  // Deploy BalancerFee
  const BalancerFee = await ethers.getContractFactory("BalFee")
  const balancerFee = await BalancerFee.deploy()
  console.log("BalancerFee deployed: ", balancerFee.address)

  // Deploy Balancer
  const Balancer = await ethers.getContractFactory("Balancer")
  const balancer = await Balancer.deploy(balancerFee.address)
  console.log("Balancer deployed: ", balancer.address)

  // Send WETH to balancer
  // const tx = await weth.deposit({ value: ethers.utils.parseEther("2") });
  // console.log("WETH deplosited: ", tx)
  // const wethBal = await weth.balanceOf(deployer.address)
  // console.log("WETH balance: ", wethBal)

  // Deploy CurvePool
  const CurvePool = await ethers.getContractFactory("CurvePool")
  const curvePool = await CurvePool.deploy(lido.address)
  console.log("CurvePool deployed: ", curvePool.address)

  const EFLeverValut = await ethers.getContractFactory("EFLeverVault", {
    libraries: {
      SafeMath: safeMath.address,
    }
  })

  const leverInitial = {
    aave: aave.address,
    balancer: balancer.address,
    balancer_fee: balancerFee.address,
    lido: lido.address,
    asteth: collateral.address,
    curve_pool: curvePool.address,
    weth: weth.address,
    ef_token: efToken.address
  }

  const efLeverVault = await EFLeverValut.deploy(leverInitial);
  console.log("EFLeverVault deployed: ", efLeverVault.address);


  const address = {
    collateral: collateral.address,
    aave: aave.address,
    balancer: balancer.address,
    balancer_fee: balancerFee.address,
    lido: lido.address,
    asteth: collateral.address,
    curve_pool: curvePool.address,
    weth: weth.address,
    efLeverVault: efLeverVault.address
  }

  fs.writeFileSync("scripts/addressLeverage.json", JSON.stringify(address))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });