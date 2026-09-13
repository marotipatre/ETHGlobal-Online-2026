import { ethers } from "hardhat";

/**
 * Deploy Counter and ArcExecutor contracts on Arc Testnet
 * Run: npx hardhat run scripts/deploy-arc.ts --network arcTestnet
 */
async function main() {
  console.log("🚀 Deploying contracts to Arc Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "USDC\n");

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

  console.log("\n📋 Deployment Summary (Arc Testnet):");
  console.log("====================================");
  console.log("Counter Address:      ", counterAddress);
  console.log("Todo Address:         ", todoAddress);
  console.log("ArcExecutor Address:  ", arcExecutorAddress);
  console.log("\n💡 Add these to your .env file:");
  console.log(`COUNTER_ADDRESS=${counterAddress}`);
  console.log(`TODO_ADDRESS=${todoAddress}`);
  console.log(`ARC_EXECUTOR_ADDRESS=${arcExecutorAddress}`);
  console.log("\n🔍 Verify on explorer:");
  console.log(`https://testnet.arcscan.app/address/${counterAddress}`);
  console.log(`https://testnet.arcscan.app/address/${todoAddress}`);
  console.log(`https://testnet.arcscan.app/address/${arcExecutorAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


  // 💡 Add these to your .env file:
  // COUNTER_ADDRESS=0x425Fb305CDA77baD1F1565B0feCf5DC27F5bF766
  // TODO_ADDRESS=0x027358685B192d707cbD87c9bb3a08bc7dC04Ac9
  // ARC_EXECUTOR_ADDRESS=0x641B0a7a8dcDB2F1bFee8F463DA8d25144B73938