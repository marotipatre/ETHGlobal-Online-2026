import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createPublicClient, decodeEventLog, http } from "viem";
import { getSourceNetwork } from "@/config/sourceChains";
import { ARC_GATEWAY_ABI } from "@/lib/contracts";

export const dynamic = "force-dynamic";

async function redisGet(key: string): Promise<unknown | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json() as { result?: string | null };
  return json.result ? JSON.parse(json.result) : null;
}

async function redisSet(key: string, value: unknown) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  await fetch(`${url}/set/${key}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(JSON.stringify(value)) });
}

export async function GET() {
  try {
    const redis = await redisGet("intent-history");
    if (redis) return Response.json(redis, { headers: { "Cache-Control": "no-store" } });
    const content = await readFile(join(process.cwd(), "public", "intent-history.json"), "utf8");
    return Response.json(JSON.parse(content), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json([], { headers: { "Cache-Control": "no-store" } });
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
    const directory = join(process.cwd(), "public", "intent-queue");
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `${sourceChainId}-${txHash.toLowerCase()}.json`), JSON.stringify({ sourceChainId, txHash }), { flag: "wx" });
  } catch (error) {
    // On Vercel/read-only filesystems fall back to Redis queue
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      await redisSet(`intent-queue:${sourceChainId}:${txHash.toLowerCase()}`, { sourceChainId, txHash });
    }
  }
  return Response.json({ queued: true }, { status: 202 });
}
