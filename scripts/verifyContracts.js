const { ethers, run, network } = require("hardhat");

async function main() {
    const contract = "0xb4A7Fe38AF0A2D38C0da72185FDb0ff292468f8C"
    const params = [
        contract, // CRV
        contract, // usdc
        10000, // ratio_base
        contract,
        contract, // eth_usdc router
        contract, // WETH
        contract, // crvcvx
        contract, //eth_crv router
        contract, // crv_crvcvx router
        contract, // eth_usdt router
        contract, // usdt
        contract, // oracle,
        contract, // staker
        contract // oracle eth
    ]
    try {
        // Verify
        console.log("Verifying: ", contract);
        await run("verify:verify", {
            address: contract,
            constructorArguments: [params],
        });
    } catch (error) {
        if (error && error.message.includes("Reason: Already Verified")) {
            console.log("Already verified, skipping...");
        } else {
            console.error(error);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });