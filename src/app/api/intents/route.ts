import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createPublicClient, decodeEventLog, http } from "viem";
import { getSourceNetwork } from "@/config/sourceChains";
import { ARC_GATEWAY_ABI } from "@/lib/contracts";
import { decodeStoredJson, redisConfigured, redisGet, redisSave } from "../../../../web3-hardhat-intent/relayer/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const history = redisConfigured()
      ? await redisGet("intent-history")
      : decodeStoredJson(await readFile(join(process.cwd(), "public", "intent-history.json"), "utf8"));
    if (!Array.isArray(history)) throw new Error("Invalid intent history");
    return Response.json(history, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json([], { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  let payload: { sourceChainId?: number; txHash?: string };
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { sourceChainId, txHash } = payload;
  if (!sourceChainId || ![50312, 84532, 10143].includes(sourceChainId) || !txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return Response.json({ error: "Invalid source chain or transaction hash" }, { status: 400 });
  }
  const source = getSourceNetwork(sourceChainId);
  if (!source?.gateway) return Response.json({ error: "Source gateway is not configured" }, { status: 400 });
  try {
    const client = createPublicClient({ chain: source.chain, transport: http(source.rpcUrl) });
    const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
    const matchesGateway = receipt.status === "success" && receipt.to?.toLowerCase() === source.gateway.toLowerCase();
    const hasIntentEvent = receipt.logs.some((log) => {
      if (log.address.toLowerCase() !== source.gateway!.toLowerCase()) return false;
      try { return ["IntentForwarded", "IntentForwardedWithData"].includes(decodeEventLog({ abi: ARC_GATEWAY_ABI, data: log.data, topics: log.topics }).eventName); }
      catch { return false; }
    });
    if (!matchesGateway || !hasIntentEvent) return Response.json({ error: "Transaction did not emit a configured gateway intent" }, { status: 400 });
  } catch { return Response.json({ error: "Source transaction is not confirmed yet" }, { status: 409 }); }
  try {
    if (redisConfigured()) {
      await redisSave(`intent-queue:${sourceChainId}:${txHash.toLowerCase()}`, { sourceChainId, txHash });
    } else {
      if (process.env.VERCEL) throw new Error("Configure Redis for the hosted intent queue");
      const directory = join(process.cwd(), "public", "intent-queue");
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, `${sourceChainId}-${txHash.toLowerCase()}.json`), JSON.stringify({ sourceChainId, txHash }), { flag: "wx" });
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      return Response.json({ error: "Intent queue unavailable; the relayer can still discover the source transaction through logs" }, { status: 503 });
    }
  }
  return Response.json({ queued: true }, { status: 202 });
}
