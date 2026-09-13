import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

/**
 * Arc Intent Relayer
 * - Listens to intent events on source chain
 * - Executes intents on Arc via ArcExecutor
 * - Guarantees exactly-once execution (MVP level)
 */

// -------------------- Config --------------------
const SOURCE_RPC =
  process.env.SOMNIA_TESTNET_RPC_URL ||
  process.env.SEPOLIA_RPC_URL ||
  "http://127.0.0.1:8545";

const ARC_RPC =
  process.env.ARC_TESTNET_RPC_URL ||
  "https://rpc.testnet.arc.network";

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const ARC_GATEWAY_ADDRESS = process.env.ARC_GATEWAY_ADDRESS!;
const ARC_EXECUTOR_ADDRESS = process.env.ARC_EXECUTOR_ADDRESS!;
const COUNTER_ADDRESS = process.env.COUNTER_ADDRESS || "";
const TODO_ADDRESS = process.env.TODO_ADDRESS || "";

const POLL_INTERVAL = Number(process.env.RELAYER_POLL_INTERVAL || 5000);

// Intent history file path (accessible from frontend via public/)
// Resolve from project root (two levels up from relayer/index.ts)
const INTENT_HISTORY_FILE = path.resolve(
  __dirname,
  "../../public/intent-history.json"
);

// -------------------- Types --------------------
type IntentStatus = "pending" | "detected" | "executing" | "completed" | "failed";

type Intent = {
  txHash: string;
  user: string;
  target: string;
  nonce: number;
  timestamp: number;
  status: IntentStatus;
  executionHash?: string;
};

// -------------------- ABIs --------------------
const ARC_GATEWAY_ABI = [
  "event IntentForwarded(address indexed user, address indexed target, uint256 nonce, uint256 timestamp)",
  "event IntentForwardedWithData(address indexed user, address indexed target, bytes data, uint256 nonce, uint256 timestamp)",
];

const ARC_EXECUTOR_ABI = [
  "function execute(address user, address target) external",
  "function executeWithData(address user, address target, bytes calldata data) external",
  "function authorizedRelayers(address) external view returns (bool)",
];

// -------------------- Relayer --------------------
class ArcRelayer {
  sourceProvider: ethers.JsonRpcProvider;
  arcProvider: ethers.JsonRpcProvider;
  wallet: ethers.Wallet;
  gateway: ethers.Contract;
  executor: ethers.Contract;

  lastProcessedBlock = 0;
  processedIntents = new Set<string>(); // replay protection

  constructor() {
    // Ensure the directory exists
    const dir = path.dirname(INTENT_HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Initialize empty JSON file if it doesn't exist
    if (!fs.existsSync(INTENT_HISTORY_FILE)) {
      fs.writeFileSync(INTENT_HISTORY_FILE, JSON.stringify([], null, 2));
    }
    if (!PRIVATE_KEY || !ARC_GATEWAY_ADDRESS || !ARC_EXECUTOR_ADDRESS) {
      throw new Error("❌ Missing .env configuration");
    }

    this.sourceProvider = new ethers.JsonRpcProvider(SOURCE_RPC);
    this.arcProvider = new ethers.JsonRpcProvider(ARC_RPC);
    this.wallet = new ethers.Wallet(PRIVATE_KEY, this.arcProvider);

    this.gateway = new ethers.Contract(
      ARC_GATEWAY_ADDRESS,
      ARC_GATEWAY_ABI,
      this.sourceProvider
    );

    this.executor = new ethers.Contract(
      ARC_EXECUTOR_ADDRESS,
      ARC_EXECUTOR_ABI,
      this.wallet
    );
  }

  async start() {
    console.log("\n🤖 Arc Relayer Started\n");
    console.log("Relayer:", this.wallet.address);
    console.log("Gateway:", ARC_GATEWAY_ADDRESS);
    console.log("Executor:", ARC_EXECUTOR_ADDRESS);
    if (COUNTER_ADDRESS) console.log("Counter:", COUNTER_ADDRESS);
    if (TODO_ADDRESS) console.log("Todo:", TODO_ADDRESS);
    console.log("Poll Interval:", POLL_INTERVAL, "ms");
    console.log("Intent History File:", INTENT_HISTORY_FILE, "\n");

    await this.verifyAuthorization();

    // Load existing processed intents from history file
    this.loadProcessedIntents();

    this.lastProcessedBlock = await this.sourceProvider.getBlockNumber();
    console.log("📍 Starting from block:", this.lastProcessedBlock);
    console.log("👂 Listening for intents...\n");

    while (true) {
      await this.poll();
      await this.sleep(POLL_INTERVAL);
    }
  }

  async verifyAuthorization() {
    const ok = await this.executor.authorizedRelayers(this.wallet.address);
    if (!ok) {
      throw new Error(
        `❌ Relayer ${this.wallet.address} not authorized in ArcExecutor`
      );
    }
    console.log("✅ Relayer authorized\n");
  }

  async poll() {
    const currentBlock = await this.sourceProvider.getBlockNumber();
    if (currentBlock <= this.lastProcessedBlock) return;

    const from = this.lastProcessedBlock + 1;
    const to = currentBlock;

    const basicEvents = await this.gateway.queryFilter(
      this.gateway.filters.IntentForwarded(),
      from,
      to
    );

    const dataEvents = await this.gateway.queryFilter(
      this.gateway.filters.IntentForwardedWithData(),
      from,
      to
    );

    if (basicEvents.length > 0 || dataEvents.length > 0) {
      console.log(`🔍 Found ${basicEvents.length} basic intents and ${dataEvents.length} data intents in blocks ${from}-${to}`);
    }

    for (const e of basicEvents) {
      await this.handleIntent(e, false);
    }

    for (const e of dataEvents) {
      await this.handleIntent(e, true);
    }

    this.lastProcessedBlock = currentBlock;
  }

  async handleIntent(event: any, withData: boolean) {
    const { user, target, nonce, timestamp } = event.args;
    const intentId = `${user}-${nonce.toString()}`;

    if (this.processedIntents.has(intentId)) {
      console.log("⏭️  Skipping already processed intent:", intentId);
      return;
    }

    // Detect contract type
    const targetLower = target.toLowerCase();
    const isCounter = COUNTER_ADDRESS && targetLower === COUNTER_ADDRESS.toLowerCase();
    const isTodo = TODO_ADDRESS && targetLower === TODO_ADDRESS.toLowerCase();
    const contractType = isCounter ? "Counter" : isTodo ? "Todo" : "Unknown";

    console.log("📨 Intent Received");
    console.log("  Type:", contractType);
    console.log("  User:", user);
    console.log("  Target:", target);
    console.log("  Nonce:", nonce.toString());
    if (withData) {
      const data = event.args.data;
      if (!data) {
        console.error("❌ IntentForwardedWithData event missing data field!");
        return;
      }
      console.log("  Data length:", data.length, "bytes");
      console.log("  Method: Custom (with data)");
    } else {
      console.log("  Method:", isCounter ? "increment()" : "Unknown");
    }

    // Create intent record
    const intent: Intent = {
      txHash: event.transactionHash,
      user: user,
      target: target,
      nonce: Number(nonce),
      timestamp: Number(timestamp || 0n) * 1000, // Convert to milliseconds
      status: "detected",
    };

    // Add to history as detected
    this.addIntentToHistory(intent);

    try {
      // Update status to executing
      intent.status = "executing";
      this.updateIntentInHistory(intent);

      let tx;

      if (withData) {
        // Todo operations use executeWithData
        const data = event.args.data;
        if (!data) {
          throw new Error("IntentForwardedWithData event missing data field");
        }
        const methodName = this.detectTodoMethod(data);
        console.log(`  📝 Todo Operation: ${methodName}`);
        console.log(`  📦 Calldata: ${data.slice(0, 10)}... (${data.length} bytes)`);
        tx = await this.executor.executeWithData(
          user,
          target,
          data
        );
      } else {
        // Counter operations use execute
        console.log("  🔢 Counter Operation: increment()");
        tx = await this.executor.execute(user, target);
      }

      console.log("🚀 Executing on Arc:", tx.hash);
      const receipt = await tx.wait();

      // Update intent with execution hash and status
      intent.status = receipt.status === 1 ? "completed" : "failed";
      intent.executionHash = tx.hash;
      this.updateIntentInHistory(intent);

      this.processedIntents.add(intentId);

      const statusEmoji = receipt.status === 1 ? "✅" : "❌";
      console.log(`${statusEmoji} Execution ${receipt.status === 1 ? "completed" : "failed"}\n`);
    } catch (err: any) {
      console.error("❌ Execution failed:", err.message);
      
      // Update intent status to failed
      intent.status = "failed";
      this.updateIntentInHistory(intent);
    }
  }

  loadProcessedIntents() {
    try {
      const data = fs.readFileSync(INTENT_HISTORY_FILE, "utf-8");
      const intents: Intent[] = JSON.parse(data);
      
      // Populate processedIntents set from history
      intents.forEach((intent) => {
        const intentId = `${intent.user}-${intent.nonce}`;
        this.processedIntents.add(intentId);
      });

      console.log(`📚 Loaded ${intents.length} intents from history\n`);
    } catch (err: any) {
      console.warn("⚠️  Could not load intent history:", err.message);
      // Initialize with empty array
      fs.writeFileSync(INTENT_HISTORY_FILE, JSON.stringify([], null, 2));
    }
  }

  addIntentToHistory(intent: Intent) {
    try {
      const data = fs.readFileSync(INTENT_HISTORY_FILE, "utf-8");
      const intents: Intent[] = JSON.parse(data);
      
      // Check if intent already exists (by user-nonce)
      const intentId = `${intent.user.toLowerCase()}-${intent.nonce}`;
      const existingIndex = intents.findIndex(
        (i) => `${i.user.toLowerCase()}-${i.nonce}` === intentId
      );

      if (existingIndex === -1) {
        // Add new intent
        intents.push(intent);
        // Sort by timestamp (newest first)
        intents.sort((a, b) => b.timestamp - a.timestamp);
      }

      fs.writeFileSync(INTENT_HISTORY_FILE, JSON.stringify(intents, null, 2));
    } catch (err: any) {
      console.error("❌ Error writing intent history:", err.message);
    }
  }

  updateIntentInHistory(intent: Intent) {
    try {
      const data = fs.readFileSync(INTENT_HISTORY_FILE, "utf-8");
      const intents: Intent[] = JSON.parse(data);
      
      // Find and update existing intent
      const intentId = `${intent.user.toLowerCase()}-${intent.nonce}`;
      const existingIndex = intents.findIndex(
        (i) => `${i.user.toLowerCase()}-${i.nonce}` === intentId
      );

      if (existingIndex !== -1) {
        // Update existing intent
        intents[existingIndex] = { ...intents[existingIndex], ...intent };
      } else {
        // Add if not found
        intents.push(intent);
      }

      // Sort by timestamp (newest first)
      intents.sort((a, b) => b.timestamp - a.timestamp);

      fs.writeFileSync(INTENT_HISTORY_FILE, JSON.stringify(intents, null, 2));
    } catch (err: any) {
      console.error("❌ Error updating intent history:", err.message);
    }
  }

  /**
   * Detects which Todo method is being called from calldata
   * @param data The encoded function call data
   * @returns The method name or "unknown"
   */
  detectTodoMethod(data: string): string {
    // Function selectors (first 4 bytes of keccak256 hash of function signature)
    // addTodo(string) = 0x95ffebf5
    // toggleTodo(uint256) = 0xdc00282c
    // deleteTodo(uint256) = 0x6e3c6738
    
    if (!data || data.length < 10) return "unknown";
    
    const selector = data.slice(0, 10).toLowerCase();
    
    if (selector === "0x95ffebf5") return "addTodo(string)";
    if (selector === "0xdc00282c") return "toggleTodo(uint256)";
    if (selector === "0x6e3c6738") return "deleteTodo(uint256)";
    
    return "custom";
  }

  sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

// -------------------- Run --------------------
(async () => {
  try {
    const relayer = new ArcRelayer();
    await relayer.start();
  } catch (err) {
    console.error("❌ Relayer crashed:", err);
    process.exit(1);
  }
})();
