"use client";

import { TodoDisplay } from "@/components/TodoDisplay";
import { TodoForwarder } from "@/components/TodoForwarder";
import { TodoIntentHistory } from "@/components/TodoIntentHistory";
import { ArrowRight, ListTodo, Zap } from "lucide-react";
import { somniaTestnet } from "@/config/chains";

export default function TodoAppPage() {
    return (
        <div className="mx-auto max-w-6xl py-8 md:py-14">
            {/* Header */}
            <div className="mb-12 max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold tracking-[.14em] text-[var(--primary)]">
                    <Zap className="w-4 h-4" />
                    <span>STATEFUL INTENTS</span>
                </div>
                <h1 className="mb-4 text-5xl font-bold tracking-tight text-white md:text-7xl">
                    Todo <span className="text-[var(--primary)]">intents</span>
                </h1>
                <p className="text-lg leading-relaxed text-[var(--muted)] md:text-xl">
                    Add, toggle, and delete todos from {somniaTestnet.name}; execution stays on Arc Testnet.
                </p>
            </div>

            {/* Flow Diagram */}
            <div className="remit-card mb-8 overflow-hidden p-5 md:p-6">
                <div className="mb-5 flex items-center gap-2 text-xs font-bold tracking-[.14em] text-[var(--muted)]"><ListTodo className="size-4 text-[var(--primary)]" /> EXECUTION PIPELINE</div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {[
                        { step: "1", label: "Connect Wallet", chain: "Any Chain" },
                        { step: "2", label: "Add/Toggle/Delete", chain: somniaTestnet.name },
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

            {/* Main Content Grid */}
            <div className="mb-8 grid gap-6 md:grid-cols-2">
                <TodoDisplay />
                <TodoForwarder />
            </div>

            {/* Todo Intent History Table */}
            <TodoIntentHistory />
        </div>
    );
}
