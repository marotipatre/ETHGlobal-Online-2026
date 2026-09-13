"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAccount, useChainId, usePublicClient, useWriteContract } from "wagmi";
import { ARC_GATEWAY_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { getSourceNetwork } from "@/config/sourceChains";
import { somniaTestnet } from "@/config/chains";

export type IntentStatus = "pending" | "detected" | "executing" | "completed" | "failed";
export type IntentRecord = {
  txHash: string;
  user: string;
  target: string;
  nonce: number;
  timestamp: number;
  status: IntentStatus;
  executionHash?: string;
  sourceChainId?: number;
  action?: "add" | "toggle" | "delete";
  data?: string;
  error?: string;
};
type Phase = "idle" | "signing" | "source_pending" | "relayer_pending" | "detected" | "executing" | "completed" | "failed";
type Flow = {
  intents: IntentRecord[];
  phase: Phase;
  activeIntent: IntentRecord | null;
  isForwarding: boolean;
  isLoadingHistory: boolean;
  relayerOnline: boolean;
  error: string | null;
  source: ReturnType<typeof getSourceNetwork>;
  submit: (data?: `0x${string}`, action?: IntentRecord["action"], actionData?: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const Context = createContext<Flow | null>(null);
const recordKey = (record: IntentRecord) => `${record.sourceChainId || somniaTestnet.id}:${record.txHash.toLowerCase()}`;
const storageKey = (kind: "counter" | "todo", user: string) => `arcflow:${kind}:${user.toLowerCase()}`;

export function IntentFlowProvider({ kind, children }: { kind: "counter" | "todo"; children: ReactNode }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const source = getSourceNetwork(chainId);
  const client = usePublicClient({ chainId: source?.chain.id });
  const { writeContractAsync } = useWriteContract();
  const [intents, setIntents] = useState<IntentRecord[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [phaseOverride, setPhaseOverride] = useState<Phase>("idle");
  const [isForwarding, setIsForwarding] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [relayerOnline, setRelayerOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const target = kind === "counter" ? CONTRACT_ADDRESSES.COUNTER : CONTRACT_ADDRESSES.TODO;

  const refresh = useCallback(async () => {
    if (!address) { setIntents([]); setIsLoadingHistory(false); return; }
    try {
      const [historyResponse, healthResponse] = await Promise.all([
        fetch("/api/intents", { cache: "no-store" }),
        fetch("/api/relayer-health", { cache: "no-store" }),
      ]);
      if (!historyResponse.ok) throw new Error("History service unavailable");
      const history = (await historyResponse.json() as IntentRecord[])
        .filter((item) => item.user?.toLowerCase() === address.toLowerCase() && item.target?.toLowerCase() === target.toLowerCase());
      const health = await healthResponse.json() as { updatedAt?: number; sources?: number[] };
      setRelayerOnline(Boolean(health.updatedAt && Date.now() - health.updatedAt < 30000 && health.sources?.includes(chainId)));
      setIntents((previous) => {
        const byKey = new Map(previous.map((item) => [recordKey(item), item]));
        for (const item of history) {
          const key = recordKey(item);
          byKey.set(key, { ...byKey.get(key), ...item });
        }
        return [...byKey.values()].sort((a, b) => b.timestamp - a.timestamp);
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not refresh intent history");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [address, target, chainId]);

  useEffect(() => {
    if (!address) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(kind, address)) || "[]") as IntentRecord[];
      setIntents(saved.filter((item) => item.target.toLowerCase() === target.toLowerCase()));
    } catch { /* Corrupt local history cannot block a live session. */ }
  }, [address, kind, target]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (address) localStorage.setItem(storageKey(kind, address), JSON.stringify(intents.slice(0, 50)));
  }, [address, kind, intents]);

  const submit = useCallback(async (data?: `0x${string}`, action?: IntentRecord["action"], actionData?: string) => {
    if (!address) { setError("Connect your wallet first"); return; }
    if (!source?.gateway || !client) { setError("This source network has no configured gateway"); return; }
    if (!/^0x[a-fA-F0-9]{40}$/.test(target)) { setError("Arc target contract is not configured"); return; }
    setError(null);
    setPhaseOverride("signing");
    setActiveKey(null);
    setIsForwarding(true);
    try {
      const code = await client.getBytecode({ address: source.gateway });
      if (!code || code === "0x") throw new Error(`No ArcGateway contract found on ${source.chain.name}`);
      const txHash = await writeContractAsync({
        address: source.gateway,
        abi: ARC_GATEWAY_ABI,
        functionName: data ? "forwardIntentWithData" : "forwardIntent",
        args: data ? [target as `0x${string}`, data] : [target as `0x${string}`],
        chainId: source.chain.id,
      });
      const pending: IntentRecord = { txHash, user: address, target, nonce: 0, timestamp: Date.now(), status: "pending", sourceChainId: source.chain.id, action, data: actionData };
      setIntents((previous) => [pending, ...previous.filter((item) => recordKey(item) !== recordKey(pending))]);
      setActiveKey(recordKey(pending));
      setPhaseOverride("source_pending");
      const receipt = await client.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        setIntents((previous) => previous.map((item) => recordKey(item) === recordKey(pending) ? { ...item, status: "failed", error: "Source transaction reverted" } : item));
        setPhaseOverride("failed");
        setError("Source transaction reverted. No intent was emitted.");
      } else {
        setPhaseOverride("relayer_pending");
        try {
          const queued = await fetch("/api/intents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceChainId: source.chain.id, txHash }) });
          if (!queued.ok) console.warn("Direct intent queue unavailable; relayer will use source-chain logs");
        } catch { console.warn("Direct intent queue unavailable; relayer will use source-chain logs"); }
        await refresh();
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not submit intent";
      setError(message);
      setPhaseOverride("failed");
    } finally {
      setIsForwarding(false);
    }
  }, [address, source, client, writeContractAsync, target, refresh]);

  const activeIntent = activeKey ? intents.find((item) => recordKey(item) === activeKey) || null : phaseOverride === "signing" || phaseOverride === "failed" ? null : intents[0] || null;
  const phase: Phase = phaseOverride === "signing" || phaseOverride === "source_pending" || (phaseOverride === "failed" && !activeKey)
    ? phaseOverride
    : activeIntent?.status === "completed" ? "completed" : activeIntent?.status === "failed" ? "failed" : activeIntent?.status === "executing" ? "executing" : activeIntent?.status === "detected" ? "detected" : phaseOverride === "idle" && activeIntent?.status === "pending" ? "relayer_pending" : phaseOverride;
  const value = useMemo(() => ({ intents, phase, activeIntent, isForwarding, isLoadingHistory, relayerOnline, error, source, submit, refresh }), [intents, phase, activeIntent, isForwarding, isLoadingHistory, relayerOnline, error, source, submit, refresh]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useIntentFlow() {
  const value = useContext(Context);
  if (!value) throw new Error("IntentFlowProvider is required");
  return value;
}
