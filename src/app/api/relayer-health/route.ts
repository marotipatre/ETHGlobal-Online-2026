import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

async function redisGet(key: string): Promise<unknown | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json() as { result?: string | null };
  return json.result ? JSON.parse(json.result) : null;
}

export async function GET() {
  try {
    const redis = await redisGet("relayer-health");
    if (redis) return Response.json(redis, { headers: { "Cache-Control": "no-store" } });
    const content = await readFile(join(process.cwd(), "public", "relayer-health.json"), "utf8");
    return Response.json(JSON.parse(content), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ updatedAt: 0, sources: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
