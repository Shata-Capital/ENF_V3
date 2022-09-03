/**
 * Token Addresses
 */
exports.zeroAddress = "0x0000000000000000000000000000000000000000"
exports.usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
exports.weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
exports.crv = "0xD533a949740bb3306d119CC777fa900bA034cd52"
exports.alcx = "0xdbdb4d16eda451d0503b854cf79d55697f90c8df"
exports.lqty = "0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D"
exports.stkAAVE = "0x4da27a545c0c5B758a6BA100e3a049001de870f5"
exports.note = "0xCFEAead4947f0705A14ec42aC3D44129E1Ef3eD5"

/**
 * Router Addresses
 */
exports.uniSwapV2Router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
exports.uniSwapV2Factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
exports.uniSwapV3Router = "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45"
exports.balancerV2Vault = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"

/**
 * Convex Address
 */
exports.convexBooster = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31"

/**
 * Curve Alusd Info
 */
exports.curveAlusd = "0xA79828DF1850E8a3A3064576f380D90aECDD3359"
exports.alusdLP = "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c"
exports.alusdPid = 36

/**
 * Curve Lusd Info
 */
exports.curveLusd = "0xA79828DF1850E8a3A3064576f380D90aECDD3359"
exports.lusdLP = "0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA"
exports.lusdPid = 33

/**
 * Curve Aave Info
 */
exports.curveAave = "0xDeBF20617708857ebe4F679508E7b7863a8A8EeE"
exports.aaveLP = "0xFd2a8fA60Abd58Efe3EeE34dd494cD491dC14900"
exports.aavePid = 24

/**
 * Curve Compound Info
 */
exports.curveCompound = "0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06"
exports.compoundLP = "0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2"
exports.compoundPid = 0

/**
 * Curve Tri Info
 */
exports.curveTri = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"
exports.triLP = "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490"
exports.triPid = 9

// CRV-WETH-USDC
exports.crvUsdcPath = ["0xD533a949740bb3306d119CC777fa900bA034cd52", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"]
exports.crvEthPath = ["0xD533a949740bb3306d119CC777fa900bA034cd52", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"]
exports.ethUsdcPath = ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"]

/**
 * Notional Info
 */
exports.notionBatch = "0x1d1a531cbcb969040da7527bf1092dfc4ff7dd46"
exports.notionalProxy = "0x1344a36a1b56144c3bc62e7757377d288fde0369"
exports.nusdc = "0x18b0fc5a233acf1586da7c199ca9e3f486305a29"
exports.currencyId = 3


/**
 * Balancer USDC - Note
 */
exports.balancerNoteToUSDCPools = [
    "0x5122e01d819e58bb2e22528c0d68d310f0aa6fd7000200000000000000000163",
    "0x70b7d3b3209a59fb0400e17f67f3ee8c37363f4900020000000000000000018f",
    "0x7b50775383d3d6f0215a8f290f2c9e2eebbeceb20000000000000000000000fe",
    "0x2bbf681cc4eb09218bee85ea2a5d3d13fa40fc0c0000000000000000000000fd",
    "0xe6bcc79f328eec93d4ec8f7ed35534d9ab549faa0000000000000000000000e8",
    "0x4fd63966879300cafafbb35d157dc5229278ed230000000000000000000000e9",
    "0xa3823e50f20982656557a4a6a9c06ba5467ae9080000000000000000000000e6",
    "0x804cdb9116a10bb78768d3252355a1b18067bf8f0000000000000000000000fb",
    "0x7b50775383d3d6f0215a8f290f2c9e2eebbeceb20000000000000000000000fe",
    "0x9210f1204b5a24742eba12f710636d76240df3d00000000000000000000000fc"
]

exports.balancerNoteToUSDCAssets = [
    "0xCFEAead4947f0705A14ec42aC3D44129E1Ef3eD5",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "0x7B50775383d3D6f0215A8F290f2C9e2eEBBEceb2",
    "0x2BBf681cC4eb09218BEe85EA2a5d3D13Fa40fC0C",
    "0xf8Fd466F12e236f4c96F7Cce6c79EAdB819abF58",
    "0xe6bCC79f328eec93D4Ec8F7ED35534d9AB549faA",
    "0xA3823e50f20982656557A4A6a9C06Ba5467aE908",
    "0x02d60b84491589974263d922D9cC7a3152618Ef6",
    "0x804CdB9116a10bB78768D3252355a1b18067bF8f",
    "0x9210F1204b5a24742Eba12f710636D76240dF3d0",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
]

exports.balancerNoteToETHSwap = [
    "0x5122e01d819e58bb2e22528c0d68d310f0aa6fd7000200000000000000000163",
    "0xCFEAead4947f0705A14ec42aC3D44129E1Ef3eD5",
    "0x0000000000000000000000000000000000000000"
]

exports.balancerETHToUSDCSwap = [
    "0xe7b1d394f3b40abeaa0b64a545dbcf89da1ecb3f00010000000000000000009a",
    "0x0000000000000000000000000000000000000000",
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
]

/**
 * UNI V3 CRV-USDC
 */
exports.univ3CRVUSDC = [
    "0xD533a949740bb3306d119CC777fa900bA034cd52",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    3000
]

exports.univ3CRVETH = [
    "0xD533a949740bb3306d119CC777fa900bA034cd52",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    3000
]

exports.univ3ETHUSDC = [
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "0xD533a949740bb3306d119CC777fa900bA034cd52", // CRV
    500
]

/**
 * CURVE CRV_USDC
 */
exports.curveCRVETH = [
    "0x8301ae4fc9c624d1d396cbdaa1ed877821d7c511", //pool
    "0xD533a949740bb3306d119CC777fa900bA034cd52", // from
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // To
    1, // i
    0 // j
]

exports.crvETHCurvePool = "0x8301ae4fc9c624d1d396cbdaa1ed877821d7c511"