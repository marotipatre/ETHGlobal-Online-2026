"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { sourceNetworks } from "@/config/sourceChains";

export function SourceNetworkSelector() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  return (
    <div className="remit-card mb-6 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-xs font-bold tracking-[.14em] text-[var(--primary)]">SOURCE NETWORK</p><p className="mt-1 text-sm text-[var(--muted)]">Choose where your wallet signs the intent.</p></div>
        {!isConnected && <span className="text-xs text-[var(--muted)]">Connect a wallet to switch</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {sourceNetworks.map(({ chain, gateway }) => (
          <button key={chain.id} type="button" disabled={!gateway || !isConnected || isPending} onClick={() => switchChain({ chainId: chain.id })}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed ${chainId === chain.id && gateway ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]" : gateway ? "border-[var(--line)] text-white hover:border-[var(--primary)]" : "border-[var(--line)] text-[var(--muted)] opacity-50"}`}
            title={gateway ? `Switch to ${chain.name}` : `${chain.name} gateway has not been deployed/configured`}>
            {chain.name}{!gateway && <span className="ml-1 text-xs font-normal">· setup needed</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
