import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { redisConfigured, redisGet, redisSave } from "../relayer/redis";

const gatewayAbi = new ethers.Interface([
  "event IntentForwardedWithData(address indexed user,address indexed target,bytes data,uint256 nonce,uint256 timestamp)",
]);
const executorAbi = new ethers.Interface([
  "function executeWithData(address user,address target,bytes data)",
  "event IntentExecuted(address indexed user,address indexed target,bool success)",
]);
const vaultAbi = new ethers.Interface([
  "function depositFor(address user,uint256 amount)",
  "event Deposited(address indexed user,uint256 amount)",
]);
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
type Config = { sourceChainId: number; gateway: string; executor: string; vault: string };

export function verifyDeposit(
  config: Config,
  source: ethers.TransactionReceipt,
  execution: ethers.TransactionReceipt,
  arcTransaction: ethers.TransactionResponse,
  arcTimestamp: number,
) {
  if (source.status !== 1 || execution.status !== 1) throw new Error("Both transactions must be confirmed and successful");
  const events = source.logs.filter((log) => same(log.address, config.gateway)).flatMap((log) => {
    try { const event = gatewayAbi.parseLog(log); return event ? [event] : []; } catch { return []; }
  });
  if (events.length !== 1) throw new Error("Expected exactly one data intent from the configured gateway");
  const [user, target, data, nonce, timestamp] = events[0].args;
  if (!same(target, config.vault)) throw new Error("Source intent targets a different vault");
  const deposit = vaultAbi.parseTransaction({ data });
  if (deposit?.name !== "depositFor" || !same(deposit.args[0], user) || deposit.args[1] <= 0n) {
    throw new Error("Source event is not a valid deposit for its signer");
  }
  if (!arcTransaction.to || !same(arcTransaction.to, config.executor) || !same(arcTransaction.hash, execution.hash)) {
    throw new Error("Arc transaction does not match the executor receipt");
  }
  const call = executorAbi.parseTransaction({ data: arcTransaction.data });
  if (call?.name !== "executeWithData" || !same(call.args[0], user) || !same(call.args[1], target) || !same(call.args[2], data)) {
    throw new Error("Arc execution calldata does not match the source intent");
  }
  const succeeded = execution.logs.some((log) => {
    if (!same(log.address, config.executor)) return false;
    try {
      const event = executorAbi.parseLog(log);
      return event?.name === "IntentExecuted" && same(event.args[0], user) && same(event.args[1], target) && event.args[2] === true;
    } catch { return false; }
  });
  const deposited = execution.logs.some((log) => {
    if (!same(log.address, config.vault)) return false;
    try {
      const event = vaultAbi.parseLog(log);
      return event?.name === "Deposited" && same(event.args[0], user) && event.args[1] === deposit.args[1];
    } catch { return false; }
  });
  if (!succeeded || !deposited) throw new Error("Arc receipt does not confirm this vault deposit");
  if (!Number.isSafeInteger(Number(nonce)) || !Number.isSafeInteger(Number(timestamp)) || arcTimestamp < Number(timestamp)) {
    throw new Error("Invalid nonce/timestamp or Arc execution predates the source intent");
  }
  return {
    txHash: source.hash, user: String(user), target: String(target), nonce: Number(nonce),
    timestamp: Number(timestamp) * 1000, sourceChainId: config.sourceChainId,
    status: "completed" as const, action: "deposit" as const,
    data: String(deposit.args[1]), executionHash: execution.hash,
  };
}

async function main() {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
  const [chain, sourceHash, executionHash, ...flags] = process.argv.slice(2);
  const sourceChainId = Number(chain);
  const sources: Record<number, { rpc: string; gateway: string | undefined }> = {
    84532: { rpc: process.env.BASE_SEPOLIA_RPC_URL || "https://base-sepolia-rpc.publicnode.com", gateway: process.env.BASE_SEPOLIA_GATEWAY_ADDRESS },
    50312: { rpc: process.env.SOMNIA_TESTNET_RPC_URL || "https://dream-rpc.somnia.network", gateway: process.env.SOMNIA_GATEWAY_ADDRESS || process.env.ARC_GATEWAY_ADDRESS },
    10143: { rpc: process.env.MONAD_TESTNET_RPC_URL || "https://testnet-rpc.monad.xyz", gateway: process.env.MONAD_TESTNET_GATEWAY_ADDRESS },
  };
  if (!sources[sourceChainId] || !/^0x[\da-fA-F]{64}$/.test(sourceHash || "") || !/^0x[\da-fA-F]{64}$/.test(executionHash || "") || flags.some((flag) => !["--apply", "--relayer-stopped"].includes(flag))) {
    throw new Error("Usage: npm run reconcile:deposit -- <source-chain-id> <source-tx-hash> <arc-execution-hash> [--apply --relayer-stopped]");
  }
  if (flags.includes("--apply") && (!flags.includes("--relayer-stopped") || !redisConfigured())) {
    throw new Error("To apply: stop all relayers, configure the existing shared Redis credentials, and pass --apply --relayer-stopped");
  }
  const config = { sourceChainId, gateway: sources[sourceChainId].gateway || "", executor: process.env.ARC_EXECUTOR_ADDRESS || "", vault: process.env.VAULT_ADDRESS || "" };
  if (![config.gateway, config.executor, config.vault].every(ethers.isAddress)) throw new Error("Configure gateway, ARC_EXECUTOR_ADDRESS, and VAULT_ADDRESS");
  // Read-only providers: this script never constructs a wallet or broadcasts.
  const source = new ethers.JsonRpcProvider(sources[sourceChainId].rpc);
  const arc = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
  try {
    const [sourceNetwork, arcNetwork] = await Promise.all([source.getNetwork(), arc.getNetwork()]);
    if (Number(sourceNetwork.chainId) !== sourceChainId || Number(arcNetwork.chainId) !== 5042002) throw new Error("RPC chain ID mismatch");
    const [sourceReceipt, arcReceipt, arcTransaction] = await Promise.all([
      source.getTransactionReceipt(sourceHash), arc.getTransactionReceipt(executionHash), arc.getTransaction(executionHash),
    ]);
    if (!sourceReceipt || !arcReceipt || !arcTransaction) throw new Error("A transaction is missing or unconfirmed");
    const block = await arc.getBlock(arcReceipt.blockNumber);
    if (!block) throw new Error("Arc block unavailable");
    const record = verifyDeposit(config, sourceReceipt, arcReceipt, arcTransaction, block.timestamp);
    console.log(JSON.stringify(record, null, 2));
    if (!flags.includes("--apply")) {
      console.log("Verified. Dry run only; no state changed. Stop all relayers before applying this recovery.");
      return;
    }
    const history = await redisGet("intent-history");
    if (!Array.isArray(history) || !history.every((item) => item && typeof item.txHash === "string" && Number.isInteger(item.sourceChainId))) {
      throw new Error("Existing shared history is missing or invalid; refusing to replace it");
    }
    const existing = history.find((item) => item.sourceChainId === sourceChainId && same(item.txHash, sourceHash));
    if (existing?.executionHash && !same(existing.executionHash, executionHash) && existing.status !== "failed") {
      throw new Error("Shared history has a different non-failed execution; reconcile that conflict separately");
    }
    if (history.some((item) => item.executionHash && same(item.executionHash, executionHash) && (item.sourceChainId !== sourceChainId || !same(item.txHash, sourceHash)))) {
      throw new Error("This Arc execution is already associated with another source intent");
    }
    const backupKey = `intent-history:backup:${Date.now()}`;
    await redisSave(backupKey, history);
    const updated = history.filter((item) => item.sourceChainId !== sourceChainId || !same(item.txHash, sourceHash));
    updated.push(record);
    updated.sort((a, b) => b.timestamp - a.timestamp);
    await redisSave("intent-history", updated);
    console.log(`Saved verified completion. Previous history backed up at ${backupKey}. Restart only the Railway relayer so it reloads shared history.`);
  } finally {
    source.destroy();
    arc.destroy();
  }
}

if (require.main === module) {
  void main().catch((error) => { console.error(error instanceof Error ? error.message : "Recovery failed"); process.exitCode = 1; });
}
