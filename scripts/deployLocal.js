const { ethers, network } = require("hardhat");
const fs = require("fs")
require("colors")

async function main() {
  const [deployer, feePool] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

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
  await crvcvx.generateTokens(deployer.address, ethers.utils.parseEther("100000"));
  console.log("CRVCVX token deployed: ", crvcvx.address)

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

  // Deposit WETH
  console.log("\nCreating LPs - Depsiting ETHER...".yellow)
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

  const address = {
    ZERO: zeroAddress,
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

  fs.writeFileSync("scripts/addressLocal.json", JSON.stringify(address))
  await crvVault.changeFeeConfig(feePool.address, 100, 1000)

  const bal = await weth.balanceOf(deployer.address)
  console.log("WETH balance: ", bal)

  await weth.transfer(eth_usdc.address, bal.div(10))
  await weth.transfer(eth_usdt.address, bal.div(10))
  await weth.transfer(eth_crv.address, bal.div(10))

  console.log("\nTest Swap".green);

  // USDC Swap
  console.log("WETH Bal: ", await weth.balanceOf(eth_usdc.address), await usdc.balanceOf(eth_usdc.address))
  await weth.approve(eth_usdc.address, bal)
  let oldBal = await usdc.balanceOf(deployer.address)
  await eth_usdc.swapExactTokensForTokens(
    ethers.utils.parseEther("0.05"),
    ethers.utils.parseUnits("100", 6),
    [weth.address, usdc.address],
    deployer.address
  )
  let newBal = await usdc.balanceOf(deployer.address)
  console.log("USDC Swaped: ", ethers.utils.formatUnits(newBal.sub(oldBal), 6))

  // CRV Swap
  await weth.approve(eth_crv.address, bal.div(100))
  const oldCRV = await crv.balanceOf(deployer.address)
  await eth_crv.exchange(0, 1, bal.div(100), 0)
  const newCRV = await crv.balanceOf(deployer.address)
  console.log("CRV Swaped: ", ethers.utils.formatEther(newCRV.sub(oldCRV)))

  // CRVCVX Swap
  await crv.approve(crv_cvxcrvSwap.address, ethers.utils.parseEther("100"))
  const oldCRVCVX = await crvcvx.balanceOf(deployer.address)
  await crv_cvxcrvSwap.exchange(0, 1, ethers.utils.parseEther("100"), 0)
  const newCRVCVX = await crvcvx.balanceOf(deployer.address)
  console.log("CRVCVX Swaped: ", ethers.utils.formatEther(newCRVCVX.sub(oldCRVCVX)))

  // Test CRV Vault
  console.log("\nTesting CRV Vault".green)
  await usdc.approve(crvVault.address, ethers.utils.parseUnits("10", 6))
  await crvVault.depositStable(ethers.utils.parseUnits("10", 6))
  console.log("Deposit 10 USDC")
  const efBal = await efToken.balanceOf(deployer.address)
  console.log(`Get ${ethers.utils.formatEther(efBal)} EF Token`)

  let myBal = await crvVault.getVirtualPrice();
  console.log("My Bal: ", myBal)
  for (let i = 0; i < 100000; i++) {
    await network.provider.send("evm_mine");
  }
  await crvVault.earnReward();
  myBal = await crvVault.getVirtualPrice();
  console.log("My Bal: ", myBal)

  await efToken.approve(crvVault.address, efBal);
  oldBal = await usdc.balanceOf(deployer.address)
  await crvVault.withdraw(efBal, true);
  newBal = await usdc.balanceOf(deployer.address)
  console.log(`Withdraw ${ethers.utils.formatEther(efBal)}`)
  console.log(`Get ${ethers.utils.formatUnits(newBal.sub(oldBal), 6)} USDC`)
  const fee = await crv.balanceOf(feePool.address)
  console.log("Fee is collected: ", ethers.utils.formatEther(fee))

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
  console.log("\nDeploying LeverVault".green)

  // Deploy Collateral
  const Collateral = await ethers.getContractFactory("ERC20Token", {
    libraries: {
      AddressArray: addressArray.address
    }
  })
  const collateral = await Collateral.deploy(factory.address, zeroAddress, blockNum, "Collateral", 18, "Collateral", true)
  await collateral.generateTokens(deployer.address, ethers.utils.parseEther("100000"));
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

  // Submit Ether to Lido
  await lido.submit(zeroAddress, { value: ethers.utils.parseEther("1") });
  const share = await lido.balanceOf(deployer.address)
  console.log("Share amount: ", ethers.utils.formatEther(share))

  // Deploy BalancerFee
  const BalancerFee = await ethers.getContractFactory("BalFee")
  const balancerFee = await BalancerFee.deploy()
  console.log("BalancerFee deployed: ", balancerFee.address)

  // Deploy Balancer
  const Balancer = await ethers.getContractFactory("Balancer")
  const balancer = await Balancer.deploy(balancerFee.address)
  console.log("Balancer deployed: ", balancer.address)

  // Send WETH to balancer
  await weth.deposit({ value: ethers.utils.parseEther("2") });
  const wethBal = await weth.balanceOf(deployer.address)
  console.log("WETH balance: ", wethBal)

  await weth.transfer(balancer.address, ethers.utils.parseEther("1"))
  await weth.transfer(aave.address, ethers.utils.parseEther("1"))

  // Deploy CurvePool
  const CurvePool = await ethers.getContractFactory("CurvePool")
  const curvePool = await CurvePool.deploy(lido.address)
  console.log("CurvePool deployed: ", curvePool.address)
  await lido.transfer(curvePool.address, share.div(2))

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

  await efLeverVault.changeFeePool(feePool.address);
  await efLeverVault.changeBlockRate(ethers.utils.parseEther("0.00001"))

  // Test Levervault
  console.log("\nTesting LeverVault".green)
  console.log("Deposit 0.1 Ether")
  oldBal = await efToken.balanceOf(deployer.address)
  await efLeverVault.deposit(ethers.utils.parseEther("0.1"), { value: ethers.utils.parseEther("0.1") })
  newBal = await efToken.balanceOf(deployer.address)
  console.log("Get ", ethers.utils.formatEther(newBal.sub(oldBal)), "EF Token")

  for (let i = 0; i < 100; i++) {
    await network.provider.send("evm_mine");
  }

  console.log("Withdraw")
  const provider = ethers.getDefaultProvider("ropsten")
  oldBal = await provider.getBalance(deployer.address)
  await efLeverVault.withdraw(newBal.sub(oldBal))
  newBal = await provider.getBalance(deployer.address)
  console.log("Withdraw ", ethers.utils.formatEther(newBal.sub(oldBal)))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });