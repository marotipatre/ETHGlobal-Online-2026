import assert from "node:assert/strict";
import { before, beforeEach, after, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArcRelayer as Relayer } from "./index";
import type { EventLog } from "ethers";
import { decodeStoredJson, RedisError, redisGet, redisSave } from "./redis";

const stateDirectory = mkdtempSync(join(tmpdir(), "arcflow-relayer-test-"));
const realFetch = globalThis.fetch;
const values = new Map<string, string>();
let commands: (string | number)[][] = [];
let failWrites = false;
let ArcRelayer: typeof Relayer;
let getHealth: () => Promise<Response>;
const user = "0x1111111111111111111111111111111111111111";
const target = "0x2222222222222222222222222222222222222222";
const txHash = `0x${"a".repeat(64)}`;
const record = { txHash, user, target, nonce: 0, timestamp: 1000, sourceChainId: 84532, status: "completed" as const };

before(async () => {
  process.env.RELAYER_STATE_DIR = stateDirectory;
  // Importing the worker must not start it or create a wallet/provider.
  ({ ArcRelayer } = await import("./index"));
  ({ GET: getHealth } = await import("../../src/app/api/relayer-health/route"));
});

beforeEach(() => {
  values.clear();
  commands = [];
  failWrites = false;
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.test";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  delete process.env.PAYMASTER_URL;
  globalThis.fetch = async (_input, options) => {
    const command = JSON.parse(String(options?.body)) as (string | number)[];
    commands.push(command);
    assert.equal(options?.cache, "no-store");
    const [operation, key, value] = command;
    if (operation === "GET") return Response.json({ result: values.get(String(key)) ?? null });
    if (operation === "SET") {
      if (failWrites) return Response.json({ error: "write denied" }, { status: 401 });
      values.set(String(key), String(value));
      return Response.json({ result: "OK" });
    }
    if (operation === "KEYS") return Response.json({ result: [...values.keys()].filter((key) => key.startsWith("intent-queue:")) });
    if (operation === "DEL") return Response.json({ result: Number(values.delete(String(key))) });
    throw new Error(`Unexpected command ${operation}`);
  };
});

after(() => {
  globalThis.fetch = realFetch;
  rmSync(stateDirectory, { recursive: true, force: true });
});

function worker() {
  const relayer = Object.create(ArcRelayer.prototype) as Relayer;
  relayer["history"] = [];
  relayer["checkpoints"] = {};
  relayer["sources"] = [];
  relayer["counter"] = target;
  relayer["todo"] = user;
  relayer["vault"] = "";
  return relayer;
}

function source() {
  return { chainId: 84532, name: "Base Sepolia", gateway: target, cursor: 0 } as Relayer["sources"][number];
}

const event = { args: [user, target, 0n, 1n], transactionHash: txHash } as unknown as EventLog;

test("legacy values and current writes round-trip as objects and arrays", async () => {
  for (const value of [{ updatedAt: 123, sources: [84532] }, [record], { sourceChainId: 84532, txHash }]) {
    assert.deepEqual(decodeStoredJson(JSON.stringify(JSON.stringify(value))), value);
    await redisSave("sample", value);
    assert.deepEqual(JSON.parse(values.get("sample")!), value);
    assert.deepEqual(await redisGet("sample"), value);
  }
});

test("health route returns an object for legacy data and does not invent freshness", async () => {
  const health = { updatedAt: 1789332241497, sources: [50312, 84532, 10143], relayer: user };
  values.set("relayer-health", JSON.stringify(JSON.stringify(health)));
  const response = await getHealth();
  assert.deepEqual(await response.json(), health);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("malformed and unavailable Redis health fails closed", async () => {
  values.set("relayer-health", JSON.stringify("invalid"));
  assert.deepEqual(await (await getHealth()).json(), { updatedAt: 0, sources: [] });
  globalThis.fetch = async () => Response.json({ error: "unauthorized" }, { status: 401 });
  assert.deepEqual(await (await getHealth()).json(), { updatedAt: 0, sources: [] });
});

test("HTTP and Redis command errors are surfaced instead of silently succeeding", async () => {
  failWrites = true;
  await assert.rejects(redisSave("intent-history", []), RedisError);
  globalThis.fetch = async () => Response.json({ error: "command failed" });
  await assert.rejects(redisGet("intent-history"), RedisError);
});

test("restart restores shared history/checkpoints and never resubmits a recorded terminal intent", async () => {
  values.set("intent-history", JSON.stringify(JSON.stringify([record])));
  values.set("relayer-checkpoints", JSON.stringify({ "84532": 500 }));
  const relayer = worker();
  await relayer["restoreState"]();
  assert.deepEqual(relayer["history"], [record]);
  assert.deepEqual(relayer["checkpoints"], { "84532": 500 });
  // No executor exists in this fixture; replay would throw.
  await relayer["handle"](source(), event, false);
  assert.equal(relayer["history"][0].status, "completed");
  const failedWorker = worker();
  failedWorker["history"] = [{ ...record, status: "failed" }];
  await failedWorker["handle"](source(), event, false);
  assert.equal(failedWorker["history"][0].status, "failed");
});

test("restart refuses unavailable/corrupt shared state and orphaned checkpoints", async () => {
  globalThis.fetch = async () => { throw new Error("network unavailable"); };
  await assert.rejects(worker()["restoreState"](), RedisError);
  globalThis.fetch = async () => Response.json({ result: "{}" });
  await assert.rejects(worker()["restoreState"](), RedisError);
  globalThis.fetch = async (_input, options) => {
    const [, key] = JSON.parse(String(options?.body));
    return Response.json({ result: key === "intent-history" ? null : '{"84532":500}' });
  };
  await assert.rejects(worker()["restoreState"](), /checkpoints exist without intent history/);
});

test("unacknowledged state writes prevent execution", async () => {
  failWrites = true;
  await assert.rejects(worker()["handle"](source(), event, false), RedisError);
});

test("execution is journaled before broadcast and completion survives a fresh worker", async () => {
  const relayer = worker();
  let broadcasts = 0;
  const executionHash = `0x${"b".repeat(64)}`;
  relayer["executor"] = {
    target,
    interface: { parseLog: () => ({ name: "IntentExecuted", args: [user, target, true] }) },
    execute: async () => {
      assert.equal(JSON.parse(values.get("intent-history")!)[0].status, "executing");
      broadcasts++;
      return { hash: executionHash, wait: async () => {
        assert.equal(JSON.parse(values.get("intent-history")!)[0].executionHash, executionHash);
        return { status: 1, hash: executionHash, logs: [{ address: target }] };
      } };
    },
  } as unknown as typeof relayer["executor"];
  await relayer["handle"](source(), event, false);
  assert.equal(broadcasts, 1);
  const restarted = worker();
  await restarted["restoreState"]();
  await restarted["handle"](source(), event, false);
  assert.equal(restarted["history"][0].status, "completed");
  assert.equal(restarted["history"][0].executionHash, executionHash);
});

test("interrupted execution without a saved hash is held for reconciliation", async () => {
  const relayer = worker();
  relayer["history"] = [{ ...record, status: "executing" }];
  await relayer["handle"](source(), event, false);
  assert.equal(relayer["history"][0].status, "failed");
  assert.match(relayer["history"][0].error!, /reconcile on Arc/);
});

test("unconfirmed queue entries remain available for the next poll", async () => {
  const redisKey = `intent-queue:84532:${txHash}`;
  values.set(redisKey, JSON.stringify(JSON.stringify({ sourceChainId: 84532, txHash })));
  const relayer = worker();
  const network = source();
  network.provider = { getTransactionReceipt: async () => null } as unknown as typeof network.provider;
  relayer["sources"] = [network];
  await relayer["pollQueued"]();
  assert.ok(values.has(redisKey));
  assert.ok(!commands.some(([operation]) => operation === "DEL" || operation === "GETDEL"));
});

test("backfills yield after five chunks and persist the cursor", async () => {
  const relayer = worker();
  const network = source();
  network.provider = { getBlockNumber: async () => 10000 } as unknown as typeof network.provider;
  network.contract = {
    filters: { IntentForwarded: () => ({}), IntentForwardedWithData: () => ({}) },
    queryFilter: async () => [],
  } as unknown as typeof network.contract;
  await relayer["poll"](network);
  assert.equal(network.cursor, 250);
  assert.deepEqual(await redisGet("relayer-checkpoints"), { "84532": 250 });
  assert.ok(network.lastPolledAt);
});

test("heartbeat includes only sources with recent successful polls", async () => {
  const relayer = worker();
  relayer["signer"] = { address: user } as typeof relayer["signer"];
  relayer["sources"] = [
    { ...source(), lastPolledAt: Date.now() },
    { ...source(), chainId: 10143, lastPolledAt: Date.now() - 60000 },
  ];
  await relayer["publishHealth"]();
  const health = await (await getHealth()).json();
  assert.deepEqual(health.sources, [84532]);
  assert.ok(Date.now() - health.updatedAt < 1000);
});
