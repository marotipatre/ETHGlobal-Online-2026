"use client";

import { CheckCircle2, Circle, ExternalLink, Loader2, XCircle } from "lucide-react";
import { arcTestnet } from "@/config/chains";
import { getSourceNetwork } from "@/config/sourceChains";
import type { IntentRecord } from "@/hooks/IntentFlowContext";

const stages = ["Sign in wallet", "Confirm on source", "Relayer detects", "Execute on Arc"];

export function IntentProgress({ phase, intent, relayerOnline, error }: { phase: string; intent: IntentRecord | null; relayerOnline: boolean; error: string | null }) {
  if (phase === "idle" && !intent && !error) return null;
  const active = phase === "signing" ? 0 : phase === "source_pending" ? 1 : phase === "relayer_pending" || phase === "pending" ? 2 : phase === "detected" ? 2 : 3;
  const source = intent?.sourceChainId ? getSourceNetwork(intent.sourceChainId) : null;
  const sourceUrl = source?.chain.blockExplorers?.default.url;
  return (
    <div className="mt-6 rounded-xl border border-[var(--line)] bg-black/25 p-5" aria-live="polite">
      <p className="text-xs font-bold tracking-[.14em] text-[var(--primary)]">LIVE INTENT PROGRESS</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {stages.map((stage, index) => {
          const done = phase === "completed" || index < active;
          const current = phase !== "completed" && phase !== "failed" && index === active;
          return <div key={stage} className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-xs font-semibold ${done ? "border-[var(--success)]/40 text-[var(--success)]" : current ? "border-[var(--primary)]/50 text-[var(--primary)]" : "border-[var(--line)] text-[var(--muted)]"}`}>
            {done ? <CheckCircle2 className="size-4 shrink-0" /> : current ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <Circle className="size-4 shrink-0" />}{stage}
          </div>;
        })}
      </div>
      {phase === "relayer_pending" && !relayerOnline && <p className="mt-4 text-sm text-yellow-200">Source transaction confirmed. The relayer is offline or its heartbeat is unavailable, so Arc execution has not been confirmed. Start the configured relayer and keep this page open.</p>}
      {phase === "failed" && <p className="mt-4 flex items-center gap-2 text-sm text-[var(--danger)]"><XCircle className="size-4" />{error || intent?.error || "The intent failed. Inspect its transaction before retrying."}</p>}
      {error && (phase === "relayer_pending" || phase === "pending" || phase === "detected" || phase === "executing") && <p className="mt-4 text-sm text-yellow-200">{error}</p>}
      {phase === "completed" && <p className="mt-4 text-sm text-[var(--success)]">Arc execution confirmed. The destination state will refresh from Arc.</p>}
      {intent && <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-[var(--muted)]">{sourceUrl && <a className="flex items-center gap-1 hover:text-white" href={`${sourceUrl}/tx/${intent.txHash}`} target="_blank" rel="noreferrer">Source transaction <ExternalLink className="size-3" /></a>}{intent.executionHash && <a className="flex items-center gap-1 hover:text-white" href={`${arcTestnet.blockExplorers.default.url}/tx/${intent.executionHash}`} target="_blank" rel="noreferrer">Arc execution <ExternalLink className="size-3" /></a>}</div>}
    </div>
  );
}
