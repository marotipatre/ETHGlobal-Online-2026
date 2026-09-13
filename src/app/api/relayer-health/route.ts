import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { decodeStoredJson, redisConfigured, redisGet } from "../../../../web3-hardhat-intent/relayer/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = redisConfigured()
      ? await redisGet("relayer-health")
      : decodeStoredJson(await readFile(join(process.cwd(), "public", "relayer-health.json"), "utf8"));
    if (!health || typeof health !== "object" || !("updatedAt" in health) ||
        typeof health.updatedAt !== "number" || !("sources" in health) ||
        !Array.isArray(health.sources) || !health.sources.every(Number.isInteger)) {
      throw new Error("Invalid relayer heartbeat");
    }
    return Response.json(health, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ updatedAt: 0, sources: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
