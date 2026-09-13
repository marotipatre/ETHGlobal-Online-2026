import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

/**
 * Interactive test script to manually trigger intents
 */

const SOURCE_RPC = process.env.SOMNIA_TESTNET_RPC_URL  || "https://dream-rpc.somnia.network/";
const ARC_RPC = process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ARC_GATEWAY_ADDRESS = process.env.ARC_GATEWAY_ADDRESS;
const COUNTER_ADDRESS = process.env.COUNTER_ADDRESS;
const TODO_ADDRESS = process.env.TODO_ADDRESS;

const GATEWAY_ABI = [
  "function forwardIntent(address target) external",
  "function forwardIntentWithData(address target, bytes calldata data) external",
  "function getNonce(address user) external view returns (uint256)",
];

const COUNTER_ABI = [
  "function count() external view returns (uint256)",
  "function increment() external",
];

const TODO_ABI = [
  "function addTodo(string memory text) external returns (uint256)",
  "function toggleTodo(uint256 id) external",
  "function deleteTodo(uint256 id) external",
  "function getTodos() external view returns (tuple(uint256 id, string text, bool completed)[])",
  "function getTodo(uint256 id) external view returns (tuple(uint256 id, string text, bool completed))",
  "function getTodoCount() external view returns (uint256)",
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  if (!PRIVATE_KEY || !ARC_GATEWAY_ADDRESS) {
    console.error("❌ Missing required environment variables (PRIVATE_KEY, ARC_GATEWAY_ADDRESS). Please check .env file");
    process.exit(1);
  }

  if (!COUNTER_ADDRESS && !TODO_ADDRESS) {
    console.error("❌ Missing contract addresses. Please set COUNTER_ADDRESS or TODO_ADDRESS in .env file");
    process.exit(1);
  }

  console.log("🌉 Cross-Chain Intent Test Script\n");

  const sourceProvider = new ethers.JsonRpcProvider(SOURCE_RPC);
  const arcProvider = new ethers.JsonRpcProvider(ARC_RPC);
  
  const sourceWallet = new ethers.Wallet(PRIVATE_KEY, sourceProvider);
  const arcWallet = new ethers.Wallet(PRIVATE_KEY, arcProvider);

  const gateway = new ethers.Contract(ARC_GATEWAY_ADDRESS, GATEWAY_ABI, sourceWallet);
  const counter = COUNTER_ADDRESS ? new ethers.Contract(COUNTER_ADDRESS, COUNTER_ABI, arcProvider) : null;
  const todo = TODO_ADDRESS ? new ethers.Contract(TODO_ADDRESS, TODO_ABI, arcProvider) : null;

  console.log("📝 Configuration:");
  console.log("  Wallet Address:", sourceWallet.address);
  console.log("  Gateway:", ARC_GATEWAY_ADDRESS);
  if (COUNTER_ADDRESS) console.log("  Counter:", COUNTER_ADDRESS);
  if (TODO_ADDRESS) console.log("  Todo:", TODO_ADDRESS);
  console.log("");

  while (true) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("What would you like to do?");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("COUNTER FLOW:");
    console.log("  1. Check counter value on Arc");
    console.log("  2. Forward counter intent to Arc");
    console.log("  3. Directly increment counter (Arc)");
    console.log("");
    console.log("TODO FLOW:");
    console.log("  4. View all todos on Arc");
    console.log("  5. View specific todo by ID");
    console.log("  6. Forward addTodo intent to Arc");
    console.log("  7. Forward toggleTodo intent to Arc");
    console.log("  8. Forward deleteTodo intent to Arc");
    console.log("  9. Directly add todo (Arc)");
    console.log("  10. Directly toggle todo (Arc)");
    console.log("  11. Directly delete todo (Arc)");
    console.log("");
    console.log("UTILITIES:");
    console.log("  12. Check nonce on source chain");
    console.log("  13. Check wallet balances");
    console.log("  14. Exit");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const choice = await question("Enter choice (1-14): ");

    switch (choice.trim()) {
      // Counter Flow
      case "1":
        if (!counter) {
          console.log("\n❌ Counter address not configured");
          break;
        }
        try {
          const count = await counter.count();
          console.log("\n✅ Current counter value:", count.toString());
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      case "2":
        if (!COUNTER_ADDRESS) {
          console.log("\n❌ Counter address not configured");
          break;
        }
        try {
          console.log("\n⏳ Forwarding counter intent...");
          const tx = await gateway.forwardIntent(COUNTER_ADDRESS);
          console.log("📤 Transaction sent:", tx.hash);
          console.log("⏳ Waiting for confirmation...");
          const receipt = await tx.wait();
          console.log("✅ Intent forwarded!");
          console.log("   Block:", receipt?.blockNumber);
          console.log("\n💡 The relayer should pick this up and execute on Arc");
          console.log("   Check relayer logs for execution status");
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      case "3":
        if (!counter) {
          console.log("\n❌ Counter address not configured");
          break;
        }
        try {
          console.log("\n⏳ Incrementing counter directly on Arc...");
          const counterWithSigner = counter.connect(arcWallet) as any;
          const tx = await counterWithSigner.increment();
          console.log("📤 Transaction sent:", tx.hash);
          await tx.wait();
          const newCount = await counter.count();
          console.log("✅ Counter incremented to:", newCount.toString());
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      // Todo Flow
      case "4":
        if (!todo) {
          console.log("\n❌ Todo address not configured");
          break;
        }
        try {
          const todos = await todo.getTodos();
          console.log("\n✅ All Todos:");
          if (todos.length === 0) {
            console.log("  (No todos yet)");
          } else {
            todos.forEach((t: any) => {
              const status = t.completed ? "✅" : "⏳";
              console.log(`  ${status} [${t.id}] ${t.text}`);
            });
          }
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      case "5":
        if (!todo) {
          console.log("\n❌ Todo address not configured");
          break;
        }
        try {
          const idStr = await question("Enter todo ID: ");
          const id = parseInt(idStr.trim());
          if (isNaN(id)) {
            console.log("❌ Invalid ID");
            break;
          }
          const todoItem = await todo.getTodo(id);
          const status = todoItem.completed ? "✅" : "⏳";
          console.log(`\n✅ Todo [${id}]:`);
          console.log(`  ${status} ${todoItem.text}`);
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      case "6":
        if (!TODO_ADDRESS) {
          console.log("\n❌ Todo address not configured");
          break;
        }
        try {
          const text = await question("Enter todo text: ");
          if (!text.trim()) {
            console.log("❌ Todo text cannot be empty");
            break;
          }
          console.log("\n⏳ Forwarding addTodo intent...");
          const todoInterface = new ethers.Interface(TODO_ABI);
          const data = todoInterface.encodeFunctionData("addTodo", [text.trim()]);
          const tx = await gateway.forwardIntentWithData(TODO_ADDRESS, data);
          console.log("📤 Transaction sent:", tx.hash);
          console.log("⏳ Waiting for confirmation...");
          const receipt = await tx.wait();
          console.log("✅ Intent forwarded!");
          console.log("   Block:", receipt?.blockNumber);
          console.log("\n💡 The relayer should pick this up and execute on Arc");
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      case "7":
        if (!TODO_ADDRESS) {
          console.log("\n❌ Todo address not configured");
          break;
        }
        try {
          const idStr = await question("Enter todo ID to toggle: ");
          const id = parseInt(idStr.trim());
          if (isNaN(id)) {
            console.log("❌ Invalid ID");
            break;
          }
          console.log("\n⏳ Forwarding toggleTodo intent...");
          const todoInterface = new ethers.Interface(TODO_ABI);
          const data = todoInterface.encodeFunctionData("toggleTodo", [id]);
          const tx = await gateway.forwardIntentWithData(TODO_ADDRESS, data);
          console.log("📤 Transaction sent:", tx.hash);
          console.log("⏳ Waiting for confirmation...");
          const receipt = await tx.wait();
          console.log("✅ Intent forwarded!");
          console.log("   Block:", receipt?.blockNumber);
          console.log("\n💡 The relayer should pick this up and execute on Arc");
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      case "8":
        if (!TODO_ADDRESS) {
          console.log("\n❌ Todo address not configured");
          break;
        }
        try {
          const idStr = await question("Enter todo ID to delete: ");
          const id = parseInt(idStr.trim());
          if (isNaN(id)) {
            console.log("❌ Invalid ID");
            break;
          }
          console.log("\n⏳ Forwarding deleteTodo intent...");
          const todoInterface = new ethers.Interface(TODO_ABI);
          const data = todoInterface.encodeFunctionData("deleteTodo", [id]);
          const tx = await gateway.forwardIntentWithData(TODO_ADDRESS, data);
          console.log("📤 Transaction sent:", tx.hash);
          console.log("⏳ Waiting for confirmation...");
          const receipt = await tx.wait();
          console.log("✅ Intent forwarded!");
          console.log("   Block:", receipt?.blockNumber);
          console.log("\n💡 The relayer should pick this up and execute on Arc");
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      case "9":
        if (!todo) {
          console.log("\n❌ Todo address not configured");
          break;
        }
        try {
          const text = await question("Enter todo text: ");
          if (!text.trim()) {
            console.log("❌ Todo text cannot be empty");
            break;
          }
          console.log("\n⏳ Adding todo directly on Arc...");
          const todoWithSigner = todo.connect(arcWallet) as any;
          const tx = await todoWithSigner.addTodo(text.trim());
          console.log("📤 Transaction sent:", tx.hash);
          const receipt = await tx.wait();
          const result = await receipt.logs[0].args;
          console.log("✅ Todo added! ID:", result?.id?.toString() || "check logs");
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      case "10":
        if (!todo) {
          console.log("\n❌ Todo address not configured");
          break;
        }
        try {
          const idStr = await question("Enter todo ID to toggle: ");
          const id = parseInt(idStr.trim());
          if (isNaN(id)) {
            console.log("❌ Invalid ID");
            break;
          }
          console.log("\n⏳ Toggling todo directly on Arc...");
          const todoWithSigner = todo.connect(arcWallet) as any;
          const tx = await todoWithSigner.toggleTodo(id);
          console.log("📤 Transaction sent:", tx.hash);
          await tx.wait();
          const todoItem = await todo.getTodo(id);
          const status = todoItem.completed ? "✅" : "⏳";
          console.log(`✅ Todo toggled! Status: ${status}`);
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      case "11":
        if (!todo) {
          console.log("\n❌ Todo address not configured");
          break;
        }
        try {
          const idStr = await question("Enter todo ID to delete: ");
          const id = parseInt(idStr.trim());
          if (isNaN(id)) {
            console.log("❌ Invalid ID");
            break;
          }
          console.log("\n⏳ Deleting todo directly on Arc...");
          const todoWithSigner = todo.connect(arcWallet) as any;
          const tx = await todoWithSigner.deleteTodo(id);
          console.log("📤 Transaction sent:", tx.hash);
          await tx.wait();
          console.log("✅ Todo deleted!");
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      // Utilities
      case "12":
        try {
          const nonce = await gateway.getNonce(sourceWallet.address);
          console.log("\n✅ Current nonce:", nonce.toString());
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      case "13":
        try {
          const sourceBalance = await sourceProvider.getBalance(sourceWallet.address);
          const arcBalance = await arcProvider.getBalance(arcWallet.address);
          console.log("\n💰 Wallet Balances:");
          console.log("  Source Chain:", ethers.formatEther(sourceBalance), "ETH");
          console.log("  Arc Chain:", ethers.formatEther(arcBalance), "USDC");
        } catch (error: any) {
          console.error("❌ Error:", error.message);
        }
        break;

      case "14":
        console.log("\n👋 Goodbye!");
        rl.close();
        process.exit(0);

      default:
        console.log("\n❌ Invalid choice. Please enter 1-14.");
    }
  }
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  rl.close();
  process.exit(1);
});
