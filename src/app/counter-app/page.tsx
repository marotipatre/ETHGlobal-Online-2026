"use client";

import { CounterDisplay } from "@/components/CounterDisplay";
import { IntentForwarder } from "@/components/IntentForwarder";
import { IntentHistory } from "@/components/IntentHistory";
import { ArrowRight, Radio, Zap } from "lucide-react";
import { somniaTestnet } from "@/config/chains";

export default function AppPage() {
    return (
        <div className="mx-auto max-w-6xl py-8 md:py-14">
            {/* Header */}
            <div className="mb-12 max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold tracking-[.14em] text-[var(--primary)]">
                    <Zap className="w-4 h-4" />
                    <span>LIVE INTENT DEMO</span>
                </div>
                <h1 className="mb-4 text-5xl font-bold tracking-tight text-white md:text-7xl">
                    Counter <span className="text-[var(--primary)]">intents</span>
                </h1>
                <p className="text-lg leading-relaxed text-[var(--muted)] md:text-xl">
                    Sign on {somniaTestnet.name}. The relayer delivers the same intent for execution on Arc Testnet.
                </p>
            </div>

            {/* Flow Diagram */}
            <div className="remit-card mb-8 overflow-hidden p-5 md:p-6">
                <div className="mb-5 flex items-center gap-2 text-xs font-bold tracking-[.14em] text-[var(--muted)]"><Radio className="size-4 text-[var(--primary)]" /> EXECUTION PIPELINE</div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {[
                        { step: "1", label: "Connect Wallet", chain: "Any Chain" },
                        { step: "2", label: "Forward Intent", chain: somniaTestnet.name },
                        { step: "3", label: "Relayer Detects", chain: "Off-Chain" },
                        { step: "4", label: "Execute on Arc", chain: "Arc Testnet" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 flex-1">
                            <div className="flex flex-col items-center gap-2">
                                <div className="grid size-10 place-items-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 font-bold text-[var(--primary)]">
                                    {item.step}
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-sm text-white">{item.label}</p>
                                    <p className="text-xs text-[var(--muted)]">{item.chain}</p>
                                </div>
                            </div>
                            {i < 3 && (
                                <ArrowRight className="hidden size-5 shrink-0 text-[var(--primary)]/60 md:block" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
{/* 
            <div className="bg-[var(--secondary)] border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_#000] mb-8">
                <h3 className="font-black text-xl text-black mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    How It Works
                </h3>
                <div className="space-y-3 text-black/80">
                    <p>
                        <strong className="text-black">1. Connect Wallet:</strong> Use MetaMask or any compatible wallet on Somnia Testnet.
                    </p>
                    <p>
                        <strong className="text-black">2. Forward Intent:</strong> Click the button to sign a transaction that forwards your intent to Arc Chain.
                    </p>
                    <p>
                        <strong className="text-black">3. Relayer Processing:</strong> An off-chain relayer monitors the gateway contract and detects your intent.
                    </p>
                    <p>
                        <strong className="text-black">4. Execution:</strong> The relayer executes your intent on Arc Chain, incrementing the counter.
                    </p>
                    <p>
                        <strong className="text-black">5. View Results:</strong> Watch the counter update in real-time and track your intent status.
                    </p>
                </div>
            </div> */}
            {/* Main Content Grid */}
            <div className="mb-8 grid gap-6 md:grid-cols-2">
                <CounterDisplay />
                <IntentForwarder />
            </div>

            {/* Info Section */}


            {/* Intent History Table */}
            <IntentHistory />
        </div>
    );
}
