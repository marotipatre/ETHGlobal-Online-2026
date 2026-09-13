import { ethers } from "hardhat";

/**
 * Deploy all contracts locally for testing
 * Run: npx hardhat run scripts/deploy-local.ts --network localhost
 */
async function main() {
  console.log("🚀 Deploying contracts locally for testing...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy Counter
  console.log("⏳ Deploying Counter contract...");
  const Counter = await ethers.getContractFactory("Counter");
  const counter = await Counter.deploy();
  await counter.waitForDeployment();
  const counterAddress = await counter.getAddress();
  console.log("✅ Counter deployed to:", counterAddress);

  // Deploy Todo
  console.log("\n⏳ Deploying Todo contract...");
  const Todo = await ethers.getContractFactory("Todo");
  const todo = await Todo.deploy();
  await todo.waitForDeployment();
  const todoAddress = await todo.getAddress();
  console.log("✅ Todo deployed to:", todoAddress);

  // Deploy ArcExecutor
  console.log("\n⏳ Deploying ArcExecutor contract...");
  const ArcExecutor = await ethers.getContractFactory("ArcExecutor");
  const arcExecutor = await ArcExecutor.deploy();
  await arcExecutor.waitForDeployment();
  const arcExecutorAddress = await arcExecutor.getAddress();
  console.log("✅ ArcExecutor deployed to:", arcExecutorAddress);

  // Deploy ArcGateway
  console.log("\n⏳ Deploying ArcGateway contract...");
  const ArcGateway = await ethers.getContractFactory("ArcGateway");
  const arcGateway = await ArcGateway.deploy();
  await arcGateway.waitForDeployment();
  const arcGatewayAddress = await arcGateway.getAddress();
  console.log("✅ ArcGateway deployed to:", arcGatewayAddress);

  console.log("\n📋 Local Deployment Summary:");
  console.log("====================================");
  console.log("Counter Address:      ", counterAddress);
  console.log("Todo Address:         ", todoAddress);
  console.log("ArcExecutor Address:  ", arcExecutorAddress);
  console.log("ArcGateway Address:   ", arcGatewayAddress);
  console.log("\n💡 Add these to your .env file:");
  console.log(`COUNTER_ADDRESS=${counterAddress}`);
  console.log(`TODO_ADDRESS=${todoAddress}`);
  console.log(`ARC_EXECUTOR_ADDRESS=${arcExecutorAddress}`);
  console.log(`ARC_GATEWAY_ADDRESS=${arcGatewayAddress}`);
  console.log("\n📝 Next Steps:");
  console.log("1. Update your .env file with these addresses");
  console.log("2. Run the relayer: npm run relayer");
  console.log("3. Test the flow by calling forwardIntent on ArcGateway");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
