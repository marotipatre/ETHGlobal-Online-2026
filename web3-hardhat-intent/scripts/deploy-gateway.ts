import { ethers, network } from "hardhat";

/**
 * Deploy ArcGateway contract on Somnia Testnet (Source Chain)
 * Run: npx hardhat run scripts/deploy-gateway.ts --network somniaTestnet
 * Or use Sepolia: npx hardhat run scripts/deploy-gateway.ts --network sepolia
 */
async function main() {
  console.log("🚀 Deploying ArcGateway to Source Chain...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy ArcGateway
  console.log("⏳ Deploying ArcGateway contract...");
  const ArcGateway = await ethers.getContractFactory("ArcGateway");
  const arcGateway = await ArcGateway.deploy();
  await arcGateway.waitForDeployment();
  const arcGatewayAddress = await arcGateway.getAddress();
  const deploymentReceipt = await arcGateway.deploymentTransaction()?.wait();
  console.log("✅ ArcGateway deployed to:", arcGatewayAddress);
  console.log("Network:", network.name, "Chain ID:", (await ethers.provider.getNetwork()).chainId.toString());
  console.log("Deployment block:", deploymentReceipt?.blockNumber);

  console.log("\n📋 Deployment Summary (Source Chain):");
  console.log("====================================");
  console.log("ArcGateway Address:   ", arcGatewayAddress);
  console.log("\n💡 Add this to your .env file:");
  const prefix = network.name === "baseSepolia" ? "BASE_SEPOLIA" : network.name === "monadTestnet" ? "MONAD_TESTNET" : "SOMNIA";
  console.log(`${prefix}_GATEWAY_ADDRESS=${arcGatewayAddress}`);
  console.log(`${prefix}_START_BLOCK=${deploymentReceipt?.blockNumber}`);
  console.log(`NEXT_PUBLIC_${prefix}_GATEWAY_ADDRESS=${arcGatewayAddress}`);
  console.log("\n📝 Next Steps:");
  console.log("1. Update your .env file with the gateway address");
  console.log("2. Configure the relayer with both source and destination addresses");
  console.log("3. Authorize the relayer in ArcExecutor contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


  // 📋 Deployment Summary (Source Chain):
  // ====================================
  // ArcGateway Address:  0xDDdE8b8073B63f86C15C67e49749B34b5fE77651
