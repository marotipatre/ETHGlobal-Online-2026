// Shared by the Vercel routes and the Railway worker.
export class RedisError extends Error {}

export function redisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (Boolean(url) !== Boolean(token)) throw new RedisError("Configure both Upstash REST URL and token");
  return Boolean(url && token);
}

export function decodeStoredJson(value: unknown): unknown {
  // Older deployments stored JSON.stringify(JSON.stringify(value)).
  for (let layer = 0; layer < 2 && typeof value === "string"; layer++) {
    value = JSON.parse(value);
  }
  return value;
}

export async function redisCommand(command: (string | number)[]): Promise<unknown> {
  if (!redisConfigured()) throw new RedisError("Upstash Redis is not configured");
  try {
    const response = await fetch(process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, ""), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const body = await response.json() as { result?: unknown; error?: string };
    // Do not log the request URL or token, including in network errors.
    if (!response.ok || body.error || !("result" in body)) {
      throw new RedisError(`Redis ${command[0]} failed (HTTP ${response.status})`);
    }
    return body.result;
  } catch (error) {
    if (error instanceof RedisError) throw error;
    throw new RedisError(`Redis ${command[0]} request failed`);
  }
}

export async function redisGet(key: string): Promise<unknown> {
  if (!redisConfigured()) return null;
  try {
    return decodeStoredJson(await redisCommand(["GET", key]));
  } catch (error) {
    if (error instanceof RedisError) throw error;
    throw new RedisError(`Invalid JSON in Redis key ${key}`);
  }
}

export async function redisSave(key: string, value: unknown): Promise<void> {
  if (!redisConfigured()) return;
  const result = await redisCommand(["SET", key, JSON.stringify(value)]);
  if (result !== "OK") throw new RedisError(`Redis SET ${key} was not acknowledged`);
}
