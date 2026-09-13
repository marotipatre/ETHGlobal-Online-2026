"use client";

import { useTodoIntent, type TodoIntentStatus } from "@/hooks/useTodoIntent";
import { Clock, CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw, Plus, ToggleLeft, Trash2 } from "lucide-react";
import { somniaTestnet, arcTestnet } from "@/config/chains";
import { getSourceNetwork } from "@/config/sourceChains";

function getStatusIcon(status: TodoIntentStatus) {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-600" />;
    case "detected":
      return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    case "executing":
      return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

function getStatusBadgeColor(status: TodoIntentStatus) {
  switch (status) {
    case "pending": return "status-pending border";
    case "detected":
    case "executing": return "status-progress border";
    case "completed": return "status-completed border";
    case "failed": return "status-failed border";
    default: return "border border-[var(--line)] text-[var(--muted)]";
  }
}

function getActionIcon(action: "add" | "toggle" | "delete" | "unknown") {
  switch (action) {
    case "add":
      return <Plus className="w-4 h-4 text-green-600" />;
    case "toggle":
      return <ToggleLeft className="w-4 h-4 text-blue-600" />;
    case "delete":
      return <Trash2 className="w-4 h-4 text-red-600" />;
    default:
      return <Clock className="w-4 h-4 text-[var(--muted)]" />;
  }
}

function getActionBadgeColor(action: "add" | "toggle" | "delete" | "unknown") {
  switch (action) {
    case "add": return "status-completed border";
    case "toggle": return "status-progress border";
    case "delete": return "status-failed border";
    default: return "border border-[var(--line)] text-[var(--muted)]";
  }
}

export function TodoIntentHistory() {
  const { intents, isLoadingHistory } = useTodoIntent();

  if (isLoadingHistory && intents.length === 0) {
    return (
      <div className="neo-card p-8">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
          <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)]" /> Todo Intent History
        </h3>
        <p className="py-8 text-center text-[var(--muted)]">Loading intent history...</p>
      </div>
    );
  }

  if (intents.length === 0) {
    return (
      <div className="neo-card p-8">
        <h3 className="mb-4 text-xl font-bold text-white">Todo Intent History</h3>
        <p className="py-8 text-center text-[var(--muted)]">No todo intents found. Add, toggle, or delete a todo to see it here!</p>
      </div>
    );
  }

  return (
    <div className="neo-card p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Todo Intent History</h3>
        <span className="text-sm text-[var(--muted)]">{intents.length} intent{intents.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--line)]">
        <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--surface-raised)]">
              <tr>
                {["Action","Status","Timestamp","Source TX","Arc Execution","Nonce","Data"].map((h) => (
                  <th key={h} className="border-b border-[var(--line)] px-4 py-3 text-left text-xs font-bold tracking-[.12em] text-[var(--muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {intents.map((intent) => (
                <tr key={`${intent.txHash}-${intent.nonce}`} className="border-b border-[var(--line)] transition-colors hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getActionIcon(intent.action)}
                      <span className={`rounded px-2 py-0.5 text-xs font-bold capitalize ${getActionBadgeColor(intent.action)}`}>{intent.action}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(intent.status)}
                      <span className={`rounded px-2 py-0.5 text-xs font-bold capitalize ${getStatusBadgeColor(intent.status)}`}>{intent.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">
                    <div>{new Date(intent.timestamp).toLocaleDateString()}</div>
                    <div className="text-xs">{new Date(intent.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`${getSourceNetwork(intent.sourceChainId || somniaTestnet.id)?.chain.blockExplorers?.default.url || somniaTestnet.blockExplorers.default.url}/tx/${intent.txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-sm text-[var(--secondary)] hover:underline">
                      {intent.txHash.slice(0, 8)}…{intent.txHash.slice(-6)}<ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {intent.executionHash ? (
                      <a href={`${arcTestnet.blockExplorers.default.url}/tx/${intent.executionHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-sm text-[var(--secondary)] hover:underline">
                        {intent.executionHash.slice(0, 8)}…{intent.executionHash.slice(-6)}<ExternalLink className="w-3 h-3" />
                      </a>
                    ) : <span className="text-xs italic text-[var(--muted)]">Pending</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-[var(--muted)]">{intent.nonce}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">
                    {intent.data ? (
                      <span className="font-mono text-xs">{intent.action === "add" && intent.data.length > 30 ? `${intent.data.slice(0, 30)}…` : intent.data}</span>
                    ) : <span className="text-xs italic text-[var(--muted)]">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
