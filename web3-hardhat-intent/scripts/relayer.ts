import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const SOURCE_RPC = process.env.SOMNIA_TESTNET_RPC_URL!;
const ARC_RPC = process.env.ARC_TESTNET_RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const ARC_GATEWAY_ADDRESS = process.env.ARC_GATEWAY_ADDRESS!;
const ARC_EXECUTOR_ADDRESS = process.env.ARC_EXECUTOR_ADDRESS!;

const GATEWAY_ABI = [
  "event IntentForwarded(address indexed user, address indexed target, uint256 nonce, uint256 timestamp)"
];

const ARC_EXECUTOR_ABI = [
  "function execute(address user, address target) external"
];

async function main() {
  console.log("🤖 Relayer started...\n");

  const sourceProvider = new ethers.JsonRpcProvider(SOURCE_RPC);
  const arcProvider = new ethers.JsonRpcProvider(ARC_RPC);

  const relayerWallet = new ethers.Wallet(PRIVATE_KEY, arcProvider);

  const gateway = new ethers.Contract(
    ARC_GATEWAY_ADDRESS,
    GATEWAY_ABI,
    sourceProvider
  );

  const arcExecutor = new ethers.Contract(
    ARC_EXECUTOR_ADDRESS,
    ARC_EXECUTOR_ABI,
    relayerWallet
  );

  console.log("👂 Listening for intents on Somnia...\n");

  gateway.on("IntentForwarded", async (user, target) => {
    console.log("📨 Intent received");
    console.log("   User:", user);
    console.log("   Target:", target);

    try {
      const tx = await arcExecutor.execute(user, target);
      console.log("🚀 Executing on Arc:", tx.hash);
      await tx.wait();
      console.log("✅ Execution confirmed on Arc\n");
    } catch (err: any) {
      console.error("❌ Execution failed:", err.message);
    }
  });
}

main().catch(console.error);
