"use client";

import { useEffect } from "react";
import { useCounter } from "@/hooks/useCounter";
import { useIntent } from "@/hooks/useIntent";
import { RefreshCw, TrendingUp } from "lucide-react";

export function CounterDisplay() {
  const { count, isLoading, error, refetch } = useCounter();
  const { activeIntent } = useIntent();

  useEffect(() => {
    if (activeIntent?.status === "completed") void refetch();
  }, [activeIntent?.status, activeIntent?.executionHash, refetch]);

  return (
    <div className="neo-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[var(--primary)] text-[#0b100c]">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Counter</h3>
            <p className="text-sm text-[var(--muted)]">Live value on Arc Testnet</p>
          </div>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isLoading}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-2 text-[var(--primary)] hover:border-[var(--primary)] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4">
          <p className="font-bold text-[var(--danger)]">Error: {error}</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-2 text-6xl font-bold text-white md:text-8xl">
            {isLoading ? (
              <span className="text-white/30">...</span>
            ) : (
              count?.toLocaleString() ?? "0"
            )}
          </div>
          <p className="font-medium text-[var(--muted)]">
            {isLoading ? "Loading..." : "Intent executions"}
          </p>
        </div>
      )}
    </div>
  );
}
