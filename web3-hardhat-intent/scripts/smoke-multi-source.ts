import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const sources = {
  somnia: { rpc: process.env.SOMNIA_TESTNET_RPC_URL || "https://dream-rpc.somnia.network/", gateway: process.env.SOMNIA_GATEWAY_ADDRESS || process.env.ARC_GATEWAY_ADDRESS, chainId: 50312 },
  base: { rpc: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org", gateway: process.env.BASE_SEPOLIA_GATEWAY_ADDRESS, chainId: 84532 },
  monad: { rpc: process.env.MONAD_TESTNET_RPC_URL || "https://testnet-rpc.monad.xyz", gateway: process.env.MONAD_TESTNET_GATEWAY_ADDRESS, chainId: 10143 },
} as const;

async function main() {
  const name = process.argv[2] as keyof typeof sources;
  const source = sources[name];
  if (!source || !source.gateway || !process.env.PRIVATE_KEY || !process.env.COUNTER_ADDRESS) {
    throw new Error("Usage: ts-node scripts/smoke-multi-source.ts somnia|base|monad (with configured .env)");
  }
  const provider = new ethers.JsonRpcProvider(source.rpc);
  if (Number((await provider.getNetwork()).chainId) !== source.chainId) throw new Error("Source RPC chain ID mismatch");
  const arc = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
  const counter = new ethers.Contract(process.env.COUNTER_ADDRESS, ["function getCount() view returns (uint256)"], arc);
  const before = Number(await counter.getCount());
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const gateway = new ethers.Contract(source.gateway, ["function forwardIntent(address target) external"], wallet);
  const tx = await gateway.forwardIntent(process.env.COUNTER_ADDRESS);
  console.log(`${name} source tx: ${tx.hash}`);
  const receipt = await tx.wait();
  if (receipt?.status !== 1) throw new Error("Source transaction failed");
  await fetch("http://localhost:3000/api/intents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceChainId: source.chainId, txHash: tx.hash }) });
  const historyPath = path.resolve(__dirname, "../../public/intent-history.json");
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const history = JSON.parse(fs.readFileSync(historyPath, "utf8")) as Array<{ sourceChainId?: number; txHash: string; status: string; executionHash?: string; error?: string }>;
    const intent = history.find((item) => item.sourceChainId === source.chainId && item.txHash.toLowerCase() === tx.hash.toLowerCase());
    if (intent?.status === "failed") throw new Error(`Arc execution failed: ${intent.error || "unknown reason"}`);
    if (intent?.status === "completed") {
      const after = Number(await counter.getCount());
      if (after <= before) throw new Error(`Arc Counter did not increase from ${before}`);
      console.log(`${name} completed on Arc: ${intent.executionHash}; counter ${before} -> ${after}`);
      return;
    }
  }
  throw new Error("Timed out waiting for relayer and Arc execution");
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
