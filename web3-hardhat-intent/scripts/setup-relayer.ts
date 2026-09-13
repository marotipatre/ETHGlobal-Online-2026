import { ethers } from "hardhat";

/**
 * Setup script to authorize the relayer address in ArcExecutor
 * Run: npx hardhat run scripts/setup-relayer.ts --network arcTestnet
 */
async function main() {
  const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS;
  const ARC_EXECUTOR_ADDRESS = process.env.ARC_EXECUTOR_ADDRESS;

  if (!RELAYER_ADDRESS) {
    throw new Error("Please set RELAYER_ADDRESS in .env file");
  }

  if (!ARC_EXECUTOR_ADDRESS) {
    throw new Error("Please set ARC_EXECUTOR_ADDRESS in .env file");
  }

  console.log("🔧 Setting up relayer authorization...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  // Get ArcExecutor contract
  const ArcExecutor = await ethers.getContractAt("ArcExecutor", ARC_EXECUTOR_ADDRESS);

  // Authorize relayer
  console.log("⏳ Authorizing relayer:", RELAYER_ADDRESS);
  const tx = await ArcExecutor.setRelayerAuthorization(RELAYER_ADDRESS, true);
  await tx.wait();
  console.log("✅ Relayer authorized!");

  // Verify
  const isAuthorized = await ArcExecutor.authorizedRelayers(RELAYER_ADDRESS);
  console.log("\n🔍 Verification:");
  console.log("Relayer authorized:", isAuthorized);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
