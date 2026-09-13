import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  if (!process.env.PRIVATE_KEY || !process.env.ARC_GATEWAY_ADDRESS || !process.env.TODO_ADDRESS) throw new Error("Missing .env configuration");
  const source = new ethers.JsonRpcProvider(process.env.SOMNIA_TESTNET_RPC_URL || "https://dream-rpc.somnia.network/");
  const arc = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, source);
  const gateway = new ethers.Contract(process.env.ARC_GATEWAY_ADDRESS, ["function forwardIntentWithData(address target,bytes data) external"], signer);
  const todo = new ethers.Contract(process.env.TODO_ADDRESS, [
    "function getTodoCount() view returns (uint256)",
    "function getTodo(uint256 id) view returns (tuple(uint256 id,string text,bool completed))",
    "function addTodo(string text)", "function toggleTodo(uint256 id)", "function deleteTodo(uint256 id)",
  ], arc);
  const before = Number(await todo.getTodoCount());
  const marker = `ArcFlow smoke ${Date.now()}`;
  const historyPath = path.resolve(__dirname, "../../public/intent-history.json");

  async function forward(method: "addTodo" | "toggleTodo" | "deleteTodo", argument: string | bigint) {
    const data = todo.interface.encodeFunctionData(method, [argument]);
    const tx = await gateway.forwardIntentWithData(process.env.TODO_ADDRESS, data);
    const receipt = await tx.wait();
    if (receipt?.status !== 1) throw new Error(`${method} source transaction failed`);
    await fetch("http://localhost:3000/api/intents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceChainId: 50312, txHash: tx.hash }) });
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const history = JSON.parse(fs.readFileSync(historyPath, "utf8")) as Array<{ sourceChainId?: number; txHash: string; status: string; executionHash?: string; error?: string }>;
      const intent = history.find((item) => item.sourceChainId === 50312 && item.txHash.toLowerCase() === tx.hash.toLowerCase());
      if (intent?.status === "failed") throw new Error(`${method} Arc execution failed: ${intent.error || "unknown"}`);
      if (intent?.status === "completed") { console.log(`${method}: ${tx.hash} -> ${intent.executionHash}`); return; }
    }
    throw new Error(`${method} timed out`);
  }

  await forward("addTodo", marker);
  const added = await todo.getTodo(BigInt(before));
  if (added.text !== marker) throw new Error("Added Todo not visible on Arc");
  await forward("toggleTodo", BigInt(before));
  const toggled = await todo.getTodo(BigInt(before));
  if (!toggled.completed) throw new Error("Todo toggle did not update Arc state");
  await forward("deleteTodo", BigInt(before));
  if (Number(await todo.getTodoCount()) !== before) throw new Error("Todo delete did not restore original count");
  console.log("Todo add, toggle, delete verified on Arc");
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
