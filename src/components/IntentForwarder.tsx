"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Zap, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useIntent } from "@/hooks/useIntent";
import { useWallet } from "@/hooks/useWallet";
import { somniaTestnet } from "@/config/chains";

export function IntentForwarder() {
  const { wallet } = useWallet();
  const { forwardIntent, isForwarding, error, intents } = useIntent();
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const handleForward = async () => {
    try {
      setLastTxHash(null);
      await forwardIntent();
    } catch (err) {
      console.error("Failed to forward intent:", err);
    }
  };

  // Get the latest intent hash
  useEffect(() => {
    if (intents.length > 0 && intents[0].txHash) {
      setLastTxHash(intents[0].txHash);
    }
  }, [intents]);

  const isOnCorrectNetwork = wallet.isOnSomnia;

  return (
    <div className="neo-card p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="grid size-11 place-items-center rounded-xl bg-[var(--secondary)] text-[#0b100c]">
          <Zap className="size-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Forward intent</h3>
          <p className="text-sm text-[var(--muted)]">
            Sign on {somniaTestnet.name}, execute on Arc
          </p>
        </div>
      </div>

      {!wallet.isConnected ? (
        <div className="mb-4 rounded-lg border border-yellow-300/30 bg-yellow-300/10 p-4">
          <p className="flex items-center gap-2 font-bold text-yellow-200">
            <AlertCircle className="w-4 h-4" />
            Connect your wallet to forward intents
          </p>
        </div>
      ) : !isOnCorrectNetwork ? (
        <div className="mb-4 rounded-lg border border-yellow-300/30 bg-yellow-300/10 p-4">
          <p className="font-bold text-yellow-200">
            Please switch to {somniaTestnet.name} (Chain ID: {somniaTestnet.id})
          </p>
        </div>
      ) : null}

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4">
          <p className="font-bold text-[var(--danger)]">{error}</p>
        </div>
      )}

      {lastTxHash && (
        <div className="mb-4 rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 p-4">
          <p className="flex items-center gap-2 font-bold text-[var(--success)]">
            <CheckCircle2 className="w-4 h-4" />
            Intent forwarded! TX: {lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}
          </p>
        </div>
      )}

      <Button
        onClick={handleForward}
        disabled={!wallet.isConnected || isForwarding || !isOnCorrectNetwork}
        size="lg"
        className="w-full shadow-[0_0_24px_#c9ff3d26] disabled:cursor-not-allowed"
      >
        {isForwarding ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Forwarding Intent...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 mr-2" />
            Forward Intent to Arc
          </>
        )}
      </Button>

      <div className="mt-6 rounded-lg border border-[var(--line)] bg-black/20 p-4">
        <p className="text-sm font-bold text-[var(--primary)]">
          💡 This will:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--muted)]">
          <li>Sign transaction on {somniaTestnet.name}</li>
          <li>Emit IntentForwarded event</li>
          <li>Relayer picks it up and executes on Arc Chain</li>
          <li>Counter increments automatically</li>
        </ul>
      </div>
    </div>
  );
}
