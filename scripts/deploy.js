const { ethers, network } = require("hardhat");
const fs = require("fs")
require("colors")

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const feePool = "0xCBFb96CEed739b372f8cBb65c4c1e5b93923b36B"

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

  console.log("\nDeploying Tokens...".yellow)

  // EF Token
  const EFToken = await ethers.getContractFactory("ERC20Token", {
    libraries: {
      AddressArray: addressArray.address
    }
  })
  const efToken = await EFToken.deploy(factory.address, zeroAddress, blockNum, "EF_Token", 18, "EF_Token", true)
  console.log("EFToken token deployed: ", efToken.address)

  // CRVCVX Token
  const CRVCVX = await ethers.getContractFactory("ERC20Token", {
    libraries: {
      AddressArray: addressArray.address
    }
  })
  const crvcvx = await CRVCVX.deploy(factory.address, zeroAddress, blockNum, "CVXCRV", 18, "CVXCRV_Token", true)
  console.log("CRVCVX token deployed: ", crvcvx.address)
  await crvcvx.generateTokens(deployer.address, ethers.utils.parseEther("100000"));

  // CRV Token
  const CRV = await ethers.getContractFactory("CRV")
  const crv = await CRV.deploy()
  console.log("CRV token deployed: ", crv.address)
  await crv.generateTokens(deployer.address, ethers.utils.parseEther("100000"));

  // USDC Token
  const USDC = await ethers.getContractFactory("USDC")
  const usdc = await USDC.deploy()
  console.log("USDC token deployed: ", usdc.address)
  await usdc.generateTokens(deployer.address, ethers.utils.parseEther("0.000001"));

  // try {
  //   // Verify
  //   console.log("Verifying: ", usdc.address);
  //   await run("verify:verify", {
  //     address: usdc.address,
  //     constructorArguments: [],
  //   });
  // } catch (error) {
  //   if (error && error.message.includes("Reason: Already Verified")) {
  //     console.log("Already verified, skipping...");
  //   } else {
  //     console.error(error);
  //   }
  // }

  // USDT Token
  const USDT = await ethers.getContractFactory("USDT")
  const usdt = await USDT.deploy()
  console.log("USDT token deployed: ", usdt.address)
  await usdt.generateTokens(deployer.address, ethers.utils.parseEther("0.000001"));

  // WETH
  const WETH = await ethers.getContractFactory("WETH")
  const weth = await WETH.deploy()
  console.log("WETH Deployed: ", weth.address)

  // Deploy Routers
  console.log("\nDeploying Routers...".yellow)
  const ETH_USDC = await ethers.getContractFactory("DummyUniswap", {
    libraries: {
      SafeMath: safeMath.address,
    }
  })
  const eth_usdc = await ETH_USDC.deploy(weth.address, usdc.address, ethers.utils.parseUnits("200", 6))
  console.log("ETH_USDC Dummy Router deployed: ", eth_usdc.address)

  const ETH_USDT = await ethers.getContractFactory("DummyUniswap", {
    libraries: {
      SafeMath: safeMath.address,
    }
  })
  const eth_usdt = await ETH_USDT.deploy(weth.address, usdt.address, ethers.utils.parseUnits("200", 6))
  console.log("ETH_USDT Dummy Router deployed: ", eth_usdt.address)

  const ETH_CRV = await ethers.getContractFactory("ETHCRVSwap", {
    libraries: {
      SafeMath: safeMath.address,
    }
  })
  const eth_crv = await ETH_CRV.deploy(crv.address, weth.address, ethers.utils.parseEther("100"))
  console.log("Ether_CRV Router Deployed: ", eth_crv.address)

  const CRV_CVXCRV = await ethers.getContractFactory("CRV_CVXCRVSwap")
  const crv_cvxcrvSwap = await CRV_CVXCRV.deploy(crv.address, crvcvx.address)
  await crv.transfer(crv_cvxcrvSwap.address, ethers.utils.parseEther("10000"))
  await crvcvx.transfer(crv_cvxcrvSwap.address, ethers.utils.parseEther("10000"))
  console.log("CRV_CVXRV Dummy Router deployed: ", crv_cvxcrvSwap.address)

  await weth.deposit({ value: ethers.utils.parseEther("1") });

  // Deploy Oracles
  console.log("Deploying Oracles...".yellow)
  const Oracle = await ethers.getContractFactory("Oracle")
  const oracle = await Oracle.deploy()
  console.log("Oracle Deployed: ", oracle.address)

  const OracleETH = await ethers.getContractFactory("OracleETH")
  const oracleETH = await OracleETH.deploy()
  console.log("OracleETH Deployed: ", oracleETH.address)

  // Deploy Staker
  console.log("Deploying Stakers...".yellow)
  const Staker = await ethers.getContractFactory("Staker")
  const staker = await Staker.deploy(crvcvx.address, crv.address)
  console.log("Staker deployed: ", staker.address)

  // Deploy Contracts
  console.log("\nDeploying Main Contracts...".yellow)
  const crvInitial = [
    crv.address, // CRV
    usdc.address, // usdc
    10000, // ratio_base
    efToken.address,
    eth_usdc.address, // eth_usdc router
    weth.address, // WETH
    crvcvx.address, // crvcvx
    eth_crv.address, //eth_crv router
    crv_cvxcrvSwap.address, // crv_crvcvx router
    eth_usdt.address, // eth_usdt router
    usdt.address, // usdt
    oracle.address, // oracle,
    staker.address, // staker
    oracleETH.address // oracle eth
  ];

  const CRVVault = await ethers.getContractFactory("EFCRVVault", {
    libraries: {
      SafeMath: safeMath.address,
    }
  })

  const crvVault = await CRVVault.deploy(crvInitial)
  console.log("EFCRVVault Contract deployed: ", crvVault.address)

  // try {
  //   // Verify
  //   console.log("Verifying: ", crvVault.address);
  //   await run("verify:verify", {
  //     address: crvVault.address,
  //     constructorArguments: [crvInitial],
  //   });
  // } catch (error) {
  //   if (error && error.message.includes("Reason: Already Verified")) {
  //     console.log("Already verified, skipping...");
  //   } else {
  //     console.error(error);
  //   }
  // }
  const address = {
    ZERO: zeroAddress,
    Factory: factory.address,
    EFToken: efToken.address,
    CRVCVX: crvcvx.address,
    CRV: crv.address,
    USDC: usdc.address,
    USDT: usdt.address,
    WETH: weth.address,
    ETH_USDC: eth_usdc.address,
    ETH_USDT: eth_usdt.address,
    ETH_CRV: eth_crv.address,
    CRV_CVXCRV: crv_cvxcrvSwap.address,
    Oracle: oracle.address,
    OracleETH: oracleETH.address,
    Staker: staker.address,
    CRVVault: crvVault.address
  }

  fs.writeFileSync("scripts/address.json", JSON.stringify(address))

  const bal = await weth.balanceOf(deployer.address)
  console.log("WETH balance: ", bal)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });