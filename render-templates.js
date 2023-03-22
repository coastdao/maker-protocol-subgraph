const fs = require("fs-extra");
const mustache = require("mustache");
const {ethers} = require("ethers");


const main = async () => {
    const args = process.argv.slice(2);
    const network = ["testnet", "mainnet", "hardhat", "testchain"].includes(args[0]) ? args[0] : "mainnet"
    const networksData = require("./networks.json")

    // fetch data if hardhat forked testnet
    let latestBlockNumber;
    if (network === "hardhat") {
        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
        latestBlockNumber = await provider.getBlockNumber();
        console.log(`fetching latest block number for hardhat local network: ${latestBlockNumber}`)
    }
    let templateNetwork
    if (network === "hardhat") {
        // this could be mainnet?
        templateNetwork = "testnet"
    } else {
        templateNetwork = network
    }
    const templateData = {network: templateNetwork}
    for (const key of Object.keys(networksData)) {
        // use testnet for hardhat forked testnet
        const value = networksData[key][templateNetwork]
        // use latest block number for hardhat network
        if (network === "hardhat") {
            value.startBlock = latestBlockNumber
        }
        templateData[key] = value
    }

    for (const templatedFileDesc of [
        ["subgraph", "yaml"],
    ]) {
        const template = fs
            .readFileSync(
                `${templatedFileDesc[0]}.template.${templatedFileDesc[1]}`
            )
            .toString();
        fs.writeFileSync(
            `${templatedFileDesc[0]}.${templatedFileDesc[1]}`,
            mustache.render(template, templateData)
        );
    }
};

main().catch(e => console.error(e));