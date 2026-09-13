"use client";

import { Button } from "./ui/Button";
import { Zap, Loader2, AlertCircle } from "lucide-react";
import { useIntent } from "@/hooks/useIntent";
import { useWallet } from "@/hooks/useWallet";
import { IntentProgress } from "./IntentProgress";

export function IntentForwarder() {
  const { wallet } = useWallet();
  const { forwardIntent, isForwarding, error, phase, activeIntent, relayerOnline, source } = useIntent();

  const handleForward = async () => {
    try {
      await forwardIntent();
    } catch (err) {
      console.error("Failed to forward intent:", err);
    }
  };

  const isOnCorrectNetwork = Boolean(source?.gateway);

  return (
    <div className="neo-card p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="grid size-11 place-items-center rounded-xl bg-[var(--secondary)] text-[#0b100c]">
          <Zap className="size-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Forward intent</h3>
          <p className="text-sm text-[var(--muted)]">
            Sign on {source?.chain.name || "a configured source network"}, execute on Arc
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
            Choose a configured source network above to forward an intent.
          </p>
        </div>
      ) : null}

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4">
          <p className="font-bold text-[var(--danger)]">{error}</p>
        </div>
      )}

      {wallet.isConnected && isOnCorrectNetwork && !relayerOnline && <p className="mb-4 rounded-lg border border-yellow-300/30 bg-yellow-300/10 p-4 text-sm text-yellow-200">The relayer is offline or not monitoring this network. Start the relayer before submitting an intent.</p>}

      <Button
        onClick={handleForward}
        disabled={!wallet.isConnected || isForwarding || !isOnCorrectNetwork || !relayerOnline}
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
          <li>Sign transaction on {source?.chain.name || "the selected source"}</li>
          <li>Emit IntentForwarded event</li>
          <li>Relayer picks it up and executes on Arc Chain</li>
          <li>Counter increments automatically</li>
        </ul>
      </div>
      <IntentProgress phase={phase} intent={activeIntent} relayerOnline={relayerOnline} error={error} />
    </div>
  );
}
