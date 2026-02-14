const { ethers } = require("hardhat");

async function main() {
    console.log("==========================================");
    console.log("Deploying VibeOracle Contract...");
    console.log("==========================================");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    if (balance === 0n) {
        throw new Error("Insufficient balance. Please fund your account.");
    }

    // Get the contract factory
    const VibeOracleFactory = await ethers.getContractFactory("VibeOracle");
    console.log("Contract factory loaded");

    // Deploy the contract
    console.log("Deploying VibeOracle...");
    const vibeOracle = await VibeOracleFactory.deploy();
    
    // Wait for deployment
    await vibeOracle.waitForDeployment();
    const contractAddress = await vibeOracle.getAddress();

    console.log("==========================================");
    console.log("✅ SUCCESS! Contract deployed!");
    console.log("Contract Address:", contractAddress);
    console.log("Deployer Address:", deployer.address);
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    console.log("==========================================");

    // Verify deployment by calling a view function
    const sentimentCount = await vibeOracle.getSentimentCount();
    console.log("Initial sentiment count:", sentimentCount.toString());
    console.log("Contract owner:", await vibeOracle.owner());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
