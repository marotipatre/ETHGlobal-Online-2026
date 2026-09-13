"use client";

import { useState } from "react";
import { ArrowRight, ExternalLink, Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { useCctp } from "@/hooks/useCctp";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { useChainId } from "wagmi";
import { baseSepolia } from "viem/chains";

const STATUS_LABELS: Record<string, string> = {
  idle: "Ready",
  approving: "Approving USDC…",
  burning: "Burning via CCTP…",
  pending_mint: "Waiting for Circle attestation (~20s)…",
  completed: "Minted on Arc ✓",
  failed: "Failed",
};

export function CctpBridgePanel() {
  const chainId = useChainId();
  const { supported, status, error, usdcBalanceFormatted, bridge, reset } = useCctp(CONTRACT_ADDRESSES.VAULT);
  const [amount, setAmount] = useState("1.00");
  const busy = status === "approving" || status === "burning" || status === "pending_mint";

  return (
    <div className="neo-card overflow-hidden">
      <div className="border-b border-[var(--line)] bg-[var(--primary)]/5 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-black">CIRCLE CCTP</span>
          <p className="text-sm font-bold text-white">Bridge USDC to Arc via CCTP</p>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Burns real USDC on Base Sepolia using Circle&apos;s Cross-Chain Transfer Protocol. Circle&apos;s attestation service mints it natively on Arc — no wrapped tokens.
        </p>
      </div>

      <div className="p-6">
        {!supported ? (
          <div className="rounded-xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-sm text-yellow-200">
            CCTP is available on <strong>Base Sepolia</strong> and <strong>Sepolia</strong>.
            Switch to one of those networks to bridge USDC directly to Arc.
            {chainId !== baseSepolia.id && (
              <p className="mt-2 text-xs text-[var(--muted)]">Current network does not have a deployed CCTP TokenMessenger.</p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--line)] bg-black/20 p-3">
                <p className="text-xs text-[var(--muted)]">Your USDC balance</p>
                <p className="mt-1 font-bold text-white">${usdcBalanceFormatted}</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-black/20 p-3">
                <p className="text-xs text-[var(--muted)]">Destination</p>
                <p className="mt-1 font-bold text-[var(--primary)]">Arc Vault</p>
              </div>
            </div>

            <label className="block text-xs font-bold uppercase tracking-[.12em] text-[var(--muted)]">
              Amount · USDC
              <input
                className="neo-input mt-2 w-full px-4 py-3 text-lg font-bold"
                type="number"
                min="0.000001"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy}
              />
            </label>

            {/* Flow visual */}
            <div className="my-5 flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-black/20 px-4 py-3 text-xs font-semibold">
              <span className="text-blue-300">Base Sepolia USDC</span>
              <ArrowRight className="size-3 text-[var(--muted)]" />
              <span className="text-[var(--muted)]">CCTP Burn</span>
              <ArrowRight className="size-3 text-[var(--muted)]" />
              <span className="text-[var(--muted)]">Circle Attestation</span>
              <ArrowRight className="size-3 text-[var(--muted)]" />
              <span className="text-[var(--primary)]">Arc Vault USDC</span>
            </div>

            {/* Status */}
            {status !== "idle" && (
              <div className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-sm ${
                status === "completed" ? "border-[var(--success)]/40 text-[var(--success)]" :
                status === "failed" ? "border-[var(--danger)]/40 text-[var(--danger)]" :
                "border-[var(--primary)]/30 text-[var(--primary)]"
              }`}>
                {busy ? <Loader2 className="size-4 animate-spin" /> :
                 status === "completed" ? <CheckCircle2 className="size-4" /> :
                 status === "failed" ? <XCircle className="size-4" /> : null}
                {STATUS_LABELS[status]}
              </div>
            )}

            {error && (
              <p className="mb-4 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { reset(); void bridge(amount); }}
                disabled={busy || !amount || Number(amount) <= 0}
                className="neo-button flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                {busy ? STATUS_LABELS[status] : "Bridge via CCTP"}
              </button>
              {status === "completed" || status === "failed" ? (
                <button type="button" onClick={reset}
                  className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-semibold text-white hover:border-[var(--primary)]">
                  Reset
                </button>
              ) : null}
            </div>

            <a href="https://developers.circle.com/stablecoins/cctp-getting-started" target="_blank" rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--primary)]">
              Circle CCTP docs <ExternalLink className="size-3" />
            </a>
          </>
        )}
      </div>
    </div>
  );
}
