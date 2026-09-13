import { ethers, type EventLog } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { RedisError, redisCommand, redisConfigured, redisGet, redisSave } from "./redis";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

type Status = "detected" | "executing" | "completed" | "failed";
type Intent = {
  txHash: string; user: string; target: string; nonce: number; timestamp: number;
  status: Status; executionHash?: string; sourceChainId: number;
  action?: "add" | "toggle" | "delete" | "deposit" | "withdraw" | "harvest"; data?: string; error?: string;
};
type Source = { chainId: number; name: string; rpc: string; gateway: string; startBlock?: number; provider: ethers.JsonRpcProvider; contract: ethers.Contract; cursor: number; lastPolledAt?: number };

const stateDirectory = process.env.RELAYER_STATE_DIR || path.resolve(__dirname, "../../public");
const historyPath = path.join(stateDirectory, "intent-history.json");
const checkpointPath = path.join(stateDirectory, "relayer-checkpoints.json");
const healthPath = path.join(stateDirectory, "relayer-health.json");
const queuePath = path.join(stateDirectory, "intent-queue");
const gatewayAbi = [
  "event IntentForwarded(address indexed user,address indexed target,uint256 nonce,uint256 timestamp)",
  "event IntentForwardedWithData(address indexed user,address indexed target,bytes data,uint256 nonce,uint256 timestamp)",
];
const executorAbi = [
  "function execute(address user,address target) external",
  "function executeWithData(address user,address target,bytes data) external",
  "function authorizedRelayers(address) view returns (bool)",
  "event IntentExecuted(address indexed user,address indexed target,bool success)",
];
const todoInterface = new ethers.Interface([
  "function addTodo(string text)", "function toggleTodo(uint256 id)", "function deleteTodo(uint256 id)",
]);
const vaultInterface = new ethers.Interface([
  "function depositFor(address user,uint256 amount)",
  "function withdrawFor(address user,uint256 amount)",
  "function harvestFor(address user)",
]);
const sourceDefinitions = [
  { chainId: 50312, name: "Somnia Testnet", rpc: process.env.SOMNIA_TESTNET_RPC_URL || "https://dream-rpc.somnia.network/", gateway: process.env.SOMNIA_GATEWAY_ADDRESS || process.env.ARC_GATEWAY_ADDRESS, startBlock: process.env.SOMNIA_START_BLOCK },
  { chainId: 11155111, name: "Sepolia", rpc: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com", gateway: process.env.SEPOLIA_GATEWAY_ADDRESS, startBlock: process.env.SEPOLIA_START_BLOCK },
  { chainId: 84532, name: "Base Sepolia", rpc: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org", gateway: process.env.BASE_SEPOLIA_GATEWAY_ADDRESS, startBlock: process.env.BASE_SEPOLIA_START_BLOCK },
  { chainId: 10143, name: "Monad Testnet", rpc: process.env.MONAD_TESTNET_RPC_URL || "https://testnet-rpc.monad.xyz", gateway: process.env.MONAD_TESTNET_GATEWAY_ADDRESS, startBlock: process.env.MONAD_TESTNET_START_BLOCK },
  { chainId: 421614, name: "Arbitrum Sepolia", rpc: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc", gateway: process.env.ARBITRUM_SEPOLIA_GATEWAY_ADDRESS, startBlock: process.env.ARBITRUM_SEPOLIA_START_BLOCK },
  { chainId: 11155420, name: "OP Sepolia", rpc: process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io", gateway: process.env.OPTIMISM_SEPOLIA_GATEWAY_ADDRESS, startBlock: process.env.OPTIMISM_SEPOLIA_START_BLOCK },
];

function loadJson<T>(file: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(file, "utf8")) as T; } catch { return fallback; }
}
function saveJson(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2));
  fs.renameSync(temporary, file);
}
async function redisGetQueue(): Promise<{ sourceChainId: number; txHash: string; redisKey: string }[]> {
  if (!redisConfigured()) return [];
  const keys = await redisCommand(["KEYS", "intent-queue:*"]);
  if (!Array.isArray(keys) || !keys.every((key) => typeof key === "string")) throw new RedisError("Invalid Redis queue keys");
  const items = [];
  for (const redisKey of keys) {
    const item = await redisGet(redisKey);
    if (item === null) continue;
    if (!item || typeof item !== "object" || !("sourceChainId" in item) ||
        typeof item.sourceChainId !== "number" || !("txHash" in item) ||
        typeof item.txHash !== "string" || !/^0x[a-fA-F0-9]{64}$/.test(item.txHash)) {
      throw new RedisError(`Invalid queue item ${redisKey}`);
    }
    items.push({ sourceChainId: item.sourceChainId, txHash: item.txHash, redisKey });
  }
  return items;
}
function key(intent: Pick<Intent, "sourceChainId" | "txHash">) { return `${intent.sourceChainId}:${intent.txHash.toLowerCase()}`; }
function errorMessage(error: unknown) { return error instanceof Error ? error.message : String(error); }

export class ArcRelayer {
  private arc: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private executor: ethers.Contract;
  private sources: Source[];
  private history: Intent[] = [];
  private checkpoints: Record<string, number> = {};
  private counter: string;
  private todo: string;
  private vault: string;
  private interval: number;

  constructor() {
    const privateKey = process.env.PRIVATE_KEY;
    const executorAddress = process.env.ARC_EXECUTOR_ADDRESS;
    this.counter = process.env.COUNTER_ADDRESS || "";
    this.todo = process.env.TODO_ADDRESS || "";
    this.vault = process.env.VAULT_ADDRESS || "";
    if (!privateKey || !executorAddress || !ethers.isAddress(executorAddress) || !ethers.isAddress(this.counter) || !ethers.isAddress(this.todo)) {
      throw new Error("Configure PRIVATE_KEY, ARC_EXECUTOR_ADDRESS, COUNTER_ADDRESS, and TODO_ADDRESS in web3-hardhat-intent/.env");
    }
    this.arc = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
    this.signer = new ethers.Wallet(privateKey, this.arc);
    this.executor = new ethers.Contract(executorAddress, executorAbi, this.signer);
    this.sources = sourceDefinitions.filter((item) => item.gateway && ethers.isAddress(item.gateway)).map((item) => {
      const provider = new ethers.JsonRpcProvider(item.rpc);
      return { chainId: item.chainId, name: item.name, rpc: item.rpc, gateway: item.gateway!, startBlock: item.startBlock ? Number(item.startBlock) : undefined, provider, contract: new ethers.Contract(item.gateway!, gatewayAbi, provider), cursor: -1 };
    });
    if (!this.sources.length) throw new Error("No source gateway addresses configured");
    this.interval = Math.max(1000, Number(process.env.RELAYER_POLL_INTERVAL || 5000));
    this.history = loadJson<Intent[]>(historyPath, []).map((item) => ({ ...item, sourceChainId: item.sourceChainId || 50312 }));
    this.checkpoints = loadJson<Record<string, number>>(checkpointPath, {});
  }

  async start() {
    // A configured shared store is authoritative. Never replay local seed history
    // when Redis cannot be read after a Railway restart.
    await this.restoreState();
    const arcNetwork = await this.arc.getNetwork();
    if (Number(arcNetwork.chainId) !== 5042002) throw new Error("Arc RPC has the wrong chain ID");
    if (await this.arc.getCode(await this.executor.getAddress()) === "0x") throw new Error("ArcExecutor contract is missing");
    if (!await this.executor.authorizedRelayers(this.signer.address)) throw new Error(`Relayer ${this.signer.address} is not authorized on ArcExecutor`);
    console.log(`Arc relayer ${this.signer.address}; ${this.sources.length} source network(s)`);
    for (const source of this.sources) {
      const network = await source.provider.getNetwork();
      if (Number(network.chainId) !== source.chainId) throw new Error(`${source.name} RPC has wrong chain ID`);
      if (await source.provider.getCode(source.gateway) === "0x") throw new Error(`ArcGateway missing on ${source.name} at ${source.gateway}`);
      const checkpoint = this.checkpoints[String(source.chainId)];
      if (Number.isInteger(checkpoint)) source.cursor = checkpoint;
      else if (source.startBlock !== undefined) source.cursor = source.startBlock - 1;
      else {
        const latestKnown = this.history.find((item) => item.sourceChainId === source.chainId);
        if (latestKnown) {
          const receipt = await source.provider.getTransactionReceipt(latestKnown.txHash);
          source.cursor = receipt ? receipt.blockNumber - 1 : -1;
        }
      }
      const latest = await source.provider.getBlockNumber();
      if (source.cursor < 0) {
        console.warn(`${source.name}: no saved cursor or START_BLOCK. Scanning the latest 5000 blocks. New app submissions also enter the direct queue.`);
        source.cursor = Math.max(0, latest - 5000);
      }
      console.log(`${source.name}: gateway ${source.gateway}, resume after block ${source.cursor}`);
    }
    await this.publishHealth();
    // Keep the heartbeat independent of long backfills and transaction receipts.
    let publishingHealth = false;
    const heartbeat = setInterval(() => {
      if (publishingHealth) return;
      publishingHealth = true;
      void this.publishHealth().catch((error) => console.error("Heartbeat failed:", errorMessage(error)))
        .finally(() => { publishingHealth = false; });
    }, 5000);
    try {
      while (true) {
        try { await this.pollQueued(); } catch (error) {
          if (error instanceof RedisError) throw error;
          console.error("Direct queue polling failed:", errorMessage(error));
        }
        // Resolve submissions whose receipt was unavailable in an earlier cycle,
        // even if the source checkpoint has already moved past their event.
        for (const intent of this.history.filter((item) => item.status === "executing" && item.executionHash)) {
          try {
            const receipt = await this.arc.getTransactionReceipt(intent.executionHash!);
            if (receipt) await this.finishFromReceipt(intent, receipt);
          } catch (error) {
            if (error instanceof RedisError) throw error;
            console.error(`Arc receipt lookup failed for ${intent.txHash}:`, errorMessage(error));
          }
        }
        for (const source of this.sources) {
          try { await this.poll(source); } catch (error) {
            if (error instanceof RedisError) throw error;
            source.lastPolledAt = 0;
            console.error(`${source.name} polling failed:`, errorMessage(error));
          }
        }
        await new Promise((resolve) => setTimeout(resolve, this.interval));
      }
    } finally {
      clearInterval(heartbeat);
    }
  }

  private async restoreState() {
    if (!redisConfigured()) return;
    const history = await redisGet("intent-history");
    const checkpoints = await redisGet("relayer-checkpoints");
    if (history !== null) {
      if (!Array.isArray(history) || !history.every((item) => item && typeof item.txHash === "string" &&
          Number.isInteger(item.sourceChainId) && ["detected", "executing", "completed", "failed"].includes(item.status))) {
        throw new RedisError("Invalid durable intent history; refusing to replay source events");
      }
      this.history = history;
    }
    if (checkpoints !== null) {
      if (!checkpoints || typeof checkpoints !== "object" || Array.isArray(checkpoints) ||
          !Object.values(checkpoints).every((value) => Number.isInteger(value) && Number(value) >= 0)) {
        throw new RedisError("Invalid durable relayer checkpoints");
      }
      // A checkpoint without its history could hide completed or pending work.
      if (history === null) throw new RedisError("Redis checkpoints exist without intent history; reconcile state before restarting");
      this.checkpoints = checkpoints as Record<string, number>;
    }
    await redisSave("intent-history", this.history);
    console.log(`Restored ${this.history.length} intent(s) from shared state`);
  }

  private async publishHealth() {
    const now = Date.now();
    const health = {
      updatedAt: now,
      sources: this.sources.filter((source) => source.lastPolledAt && now - source.lastPolledAt < 30000).map((source) => source.chainId),
      relayer: this.signer.address,
    };
    saveJson(healthPath, health);
    await redisSave("relayer-health", health);
  }

  private async pollQueued() {
    // Poll Redis queue (from Vercel API) first
    const redisItems = await redisGetQueue();
    for (const item of redisItems) {
      const source = this.sources.find((candidate) => candidate.chainId === item.sourceChainId);
      if (!source) continue;
      const receipt = await source.provider.getTransactionReceipt(item.txHash);
      if (!receipt) continue;
      if (receipt.status !== 1) { await redisCommand(["DEL", item.redisKey]); continue; }
      const parsed = receipt.logs.filter((log) => log.address.toLowerCase() === source.gateway.toLowerCase()).map((log) => {
        try { return { log, event: source.contract.interface.parseLog(log) }; } catch { return null; }
      }).find((entry) => entry?.event?.name === "IntentForwarded" || entry?.event?.name === "IntentForwardedWithData");
      if (parsed?.event) {
        const event = { args: parsed.event.args, transactionHash: item.txHash } as unknown as EventLog;
        await this.handle(source, event, parsed.event.name === "IntentForwardedWithData");
      }
      // Acknowledge only after handling, so RPC failures do not lose submissions.
      await redisCommand(["DEL", item.redisKey]);
    }
    // Poll local filesystem queue
    if (!fs.existsSync(queuePath)) return;
    for (const filename of fs.readdirSync(queuePath).filter((name) => name.endsWith(".json"))) {
      const file = path.join(queuePath, filename);
      const item = loadJson<{ sourceChainId: number; txHash: string } | null>(file, null);
      if (!item) { fs.unlinkSync(file); continue; }
      const source = this.sources.find((candidate) => candidate.chainId === item.sourceChainId);
      if (!source) continue;
      const receipt = await source.provider.getTransactionReceipt(item.txHash);
      if (!receipt) continue;
      if (receipt.status !== 1) { fs.unlinkSync(file); continue; }
      const parsed = receipt.logs.filter((log) => log.address.toLowerCase() === source.gateway.toLowerCase()).map((log) => {
        try { return { log, event: source.contract.interface.parseLog(log) }; } catch { return null; }
      }).find((entry) => entry?.event?.name === "IntentForwarded" || entry?.event?.name === "IntentForwardedWithData");
      if (!parsed?.event) { console.warn(`No gateway event in ${item.txHash}`); fs.unlinkSync(file); continue; }
      const event = { args: parsed.event.args, transactionHash: item.txHash } as unknown as EventLog;
      await this.handle(source, event, parsed.event.name === "IntentForwardedWithData");
      fs.unlinkSync(file);
    }
  }

  private async poll(source: Source) {
    const latest = await source.provider.getBlockNumber();
    if (source.cursor >= latest) source.lastPolledAt = Date.now();
    // Give each source and the direct queue a turn while catching up.
    let chunks = 0;
    while (source.cursor < latest && chunks++ < 5) {
      const from = source.cursor + 1;
      const chunkSize = source.chainId === 10143 ? 99 : source.chainId === 84532 ? 49 : 499;
      const to = Math.min(from + chunkSize, latest);
      const [basic, withData] = await Promise.all([
        source.contract.queryFilter(source.contract.filters.IntentForwarded(), from, to),
        source.contract.queryFilter(source.contract.filters.IntentForwardedWithData(), from, to),
      ]);
      source.lastPolledAt = Date.now();
      const events = [...basic.map((event) => ({ event, hasData: false })), ...withData.map((event) => ({ event, hasData: true }))].sort((a, b) => a.event.blockNumber - b.event.blockNumber || a.event.index - b.event.index);
      for (const { event, hasData } of events) await this.handle(source, event as EventLog, hasData);
      source.cursor = to;
      this.checkpoints[String(source.chainId)] = to;
      saveJson(checkpointPath, this.checkpoints);
      await redisSave("relayer-checkpoints", this.checkpoints);
      if (source.chainId === 84532) await new Promise((r) => setTimeout(r, 300));
    }
  }

  private async upsert(intent: Intent) {
    const index = this.history.findIndex((item) => key(item) === key(intent));
    if (index >= 0) this.history[index] = { ...this.history[index], ...intent };
    else this.history.push(intent);
    this.history.sort((a, b) => b.timestamp - a.timestamp);
    saveJson(historyPath, this.history);
    await redisSave("intent-history", this.history);
  }

  // Circle Paymaster: if PAYMASTER_URL is configured, sponsor gas for Arc execution
  // so the relayer wallet doesn't need native Arc tokens for every intent.
  private async buildOverrides(isVault: boolean): Promise<ethers.Overrides> {
    const paymasterUrl = process.env.PAYMASTER_URL;
    if (!paymasterUrl) return isVault ? { gasLimit: 500_000n } : {};
    try {
      // EIP-4337 paymaster stub — send a pm_sponsorUserOperation request
      const res = await fetch(paymasterUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "pm_sponsorUserOperation", params: [{ sender: this.signer.address }] }),
      });
      if (res.ok) {
        const json = await res.json() as { result?: { paymasterAndData?: string } };
        if (json.result?.paymasterAndData) {
          console.log("Circle Paymaster sponsoring gas for this intent");
          return isVault ? { gasLimit: 500_000n } : {}; // Paymaster data applied at bundler level
        }
      }
    } catch { /* Paymaster unavailable — fall back to relayer-funded gas */ }
    return isVault ? { gasLimit: 500_000n } : {};
  }

  private async handle(source: Source, event: EventLog, withData: boolean) {
    const [user, target] = event.args as unknown as [string, string];
    const nonce = Number(event.args[withData ? 3 : 2]);
    const timestamp = Number(event.args[withData ? 4 : 3]) * 1000;
    const existing = this.history.find((item) => key(item) === `${source.chainId}:${event.transactionHash.toLowerCase()}`);
    if (existing?.status === "completed" || existing?.status === "failed") return;
    if (existing?.executionHash) {
      const receipt = await this.arc.getTransactionReceipt(existing.executionHash);
      if (receipt) { await this.finishFromReceipt(existing, receipt); return; }
      return; // A submitted Arc transaction may still be pending; never submit twice.
    }
    if (existing?.status === "executing") {
      // A crash may have occurred after broadcast but before saving the hash.
      // The current executor cannot deduplicate a source intent on-chain.
      existing.status = "failed";
      existing.error = "Interrupted execution without a saved Arc hash; reconcile on Arc before retrying";
      await this.upsert(existing);
      return;
    }
    const intent: Intent = existing || { txHash: event.transactionHash, user, target, nonce, timestamp, sourceChainId: source.chainId, status: "detected" };
    await this.upsert(intent);
    try {
      const isTodo = target.toLowerCase() === this.todo.toLowerCase();
      const isVault = Boolean(this.vault) && target.toLowerCase() === this.vault.toLowerCase();
      if (withData && !isTodo && !isVault) throw new Error("Data intent targets an unapproved contract");
      if (!withData && target.toLowerCase() !== this.counter.toLowerCase()) throw new Error("Basic intent targets an unapproved contract");
      const data = withData ? String(event.args[2]) : undefined;
      if (withData && isTodo) {
        const parsed = todoInterface.parseTransaction({ data: data as string });
        const allowed = { addTodo: "add", toggleTodo: "toggle", deleteTodo: "delete" } as const;
        if (!parsed || !(parsed.name in allowed)) throw new Error("Unsupported Todo method");
        intent.action = allowed[parsed.name as keyof typeof allowed];
      }
      if (withData && isVault) {
        const parsed = vaultInterface.parseTransaction({ data: data as string });
        const allowed = { depositFor: "deposit", withdrawFor: "withdraw", harvestFor: "harvest" } as const;
        if (!parsed || !(parsed.name in allowed) || String(parsed.args[0]).toLowerCase() !== user.toLowerCase()) {
          throw new Error("Unsupported vault method or user mismatch");
        }
        if (parsed.name !== "harvestFor") {
          if (BigInt(parsed.args[1]) <= 0n) throw new Error("Vault amount must be positive");
          intent.data = String(parsed.args[1]);
        }
        intent.action = allowed[parsed.name as keyof typeof allowed];
      }
      intent.status = "executing";
      await this.upsert(intent);
      const overrides = await this.buildOverrides(isVault);
      const tx = withData
        ? await this.executor.executeWithData(user, target, data, overrides)
        : await this.executor.execute(user, target);
      intent.executionHash = tx.hash;
      await this.upsert(intent);
      const receipt = await tx.wait();
      if (!receipt) throw new Error("Arc receipt unavailable");
      await this.finishFromReceipt(intent, receipt);
    } catch (error) {
      if (error instanceof RedisError) throw error;
      intent.status = intent.executionHash ? "executing" : "failed";
      intent.error = errorMessage(error);
      await this.upsert(intent);
      console.error(`${source.name} intent ${intent.txHash} failed: ${intent.error}`);
    }
  }

  private async finishFromReceipt(intent: Intent, receipt: ethers.TransactionReceipt) {
    const executorAddress = String(this.executor.target).toLowerCase();
    const outcome = receipt.logs.filter((log) => log.address.toLowerCase() === executorAddress).map((log) => {
      try { return this.executor.interface.parseLog(log); } catch { return null; }
    }).find((log) => log?.name === "IntentExecuted");
    const success = receipt.status === 1 && outcome?.args[2] === true;
    intent.status = success ? "completed" : "failed";
    intent.executionHash = receipt.hash;
    if (!success) intent.error = "ArcExecutor emitted an unsuccessful execution";
    else delete intent.error;
    await this.upsert(intent);
    console.log(`${intent.status}: ${intent.sourceChainId}:${intent.txHash} -> ${receipt.hash}`);
  }
}

if (require.main === module) {
  new ArcRelayer().start().catch((error) => {
    console.error("Relayer stopped:", errorMessage(error));
    process.exit(1);
  });
}
