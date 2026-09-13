"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Bot, CheckCircle2, ExternalLink, Loader2, RefreshCw, XCircle, Zap } from "lucide-react";
import { arcTestnet } from "@/config/chains";
import { formatUnits } from "viem";

type AgentState = {
  claimable: string;
  shares: string;
  paused: boolean;
  threshold: string;
  shouldHarvest: boolean;
  reason: string;
  agentExecuted?: boolean;
  executionHash?: string;
  agentError?: string;
};

const REASON_LABELS: Record<string, string> = {
  vault_paused: "Vault is paused — agent standing by",
  below_threshold: "Yield below $0.01 threshold — agent waiting",
  harvest_ready: "Yield above threshold — agent ready to harvest",
};

export function AgentHarvestPanel() {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<AgentState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState(false);

  const check = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agent?user=${address}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Agent check failed");
      setState(await res.json() as AgentState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent unavailable");
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Auto-poll every 30s when enabled
  useEffect(() => {
    if (!autoRun || !address) return;
    void check();
    const timer = setInterval(() => void check(), 30_000);
    return () => clearInterval(timer);
  }, [autoRun, address, check]);

  const usd = (raw: string) =>
    Number(formatUnits(BigInt(raw || "0"), 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  return (
    <div className="neo-card overflow-hidden">
      <div className="border-b border-[var(--line)] bg-[var(--tertiary)]/5 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--tertiary)] px-2 py-0.5 text-[10px] font-bold text-black">AGENT</span>
          <p className="text-sm font-bold text-white">Auto-Harvest Agent</p>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Autonomous agent that monitors your vault yield and triggers harvestFor() when claimable USDC exceeds the $0.01 threshold. Demonstrates agentic DeFi on Arc.
        </p>
      </div>

      <div className="p-6">
        {!isConnected ? (
          <p className="text-sm text-[var(--muted)]">Connect your wallet to run the harvest agent.</p>
        ) : (
          <>
            {/* Agent decision display */}
            {state && (
              <div className="mb-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[var(--line)] bg-black/20 p-3">
                    <p className="text-xs text-[var(--muted)]">Claimable yield</p>
                    <p className="mt-1 text-lg font-bold text-white">${usd(state.claimable)}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-black/20 p-3">
                    <p className="text-xs text-[var(--muted)]">Harvest threshold</p>
                    <p className="mt-1 text-lg font-bold text-[var(--primary)]">${usd(state.threshold)}</p>
                  </div>
                </div>

                {/* Decision */}
                <div className={`flex items-center gap-3 rounded-xl border p-4 ${
                  state.shouldHarvest ? "border-[var(--primary)]/40 bg-[var(--primary)]/5" :
                  "border-[var(--line)] bg-black/20"
                }`}>
                  <Bot className={`size-5 shrink-0 ${state.shouldHarvest ? "text-[var(--primary)]" : "text-[var(--muted)]"}`} />
                  <div>
                    <p className="text-sm font-bold text-white">Agent decision</p>
                    <p className="text-xs text-[var(--muted)]">{REASON_LABELS[state.reason] || state.reason}</p>
                  </div>
                  {state.shouldHarvest ? (
                    <Zap className="ml-auto size-4 text-[var(--primary)]" />
                  ) : (
                    <span className="ml-auto text-xs text-[var(--muted)]">Idle</span>
                  )}
                </div>

                {/* Execution result */}
                {state.agentExecuted && state.executionHash && (
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--success)]/40 bg-[var(--success)]/5 p-3 text-sm text-[var(--success)]">
                    <CheckCircle2 className="size-4 shrink-0" />
                    Agent harvested autonomously
                    <a href={`${arcTestnet.blockExplorers.default.url}/tx/${state.executionHash}`} target="_blank" rel="noreferrer"
                      className="ml-auto flex items-center gap-1 text-xs hover:underline">
                      Arc tx <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
                {state.agentError && (
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/5 p-3 text-sm text-[var(--danger)]">
                    <XCircle className="size-4 shrink-0" />
                    {state.agentError}
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="mb-4 rounded-xl border border-[var(--danger)]/40 p-3 text-sm text-[var(--danger)]">{error}</p>
            )}

            {/* Controls */}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void check()} disabled={loading}
                className="neo-button flex items-center gap-2 rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-white hover:border-[var(--primary)] disabled:opacity-40">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Check now
              </button>
              <button type="button" onClick={() => setAutoRun((v) => !v)}
                className={`neo-button flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  autoRun ? "bg-[var(--primary)] text-black" : "border border-[var(--line)] text-white hover:border-[var(--primary)]"
                }`}>
                <Bot className="size-4" />
                {autoRun ? "Agent running (30s)" : "Start auto-agent"}
              </button>
            </div>

            <p className="mt-4 text-xs text-[var(--muted)]">
              The agent reads vault state and evaluates the harvest condition. With <code className="rounded bg-white/5 px-1">AGENT_PRIVATE_KEY</code> set server-side, it executes autonomously via ArcExecutor. Without it, it reports the decision only.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
