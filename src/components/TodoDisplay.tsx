"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTodo } from "@/hooks/useTodo";
import { RefreshCw, CheckCircle2, Circle, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useTodoIntent } from "@/hooks/useTodoIntent";
import { useWallet } from "@/hooks/useWallet";

export function TodoDisplay() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const { todos, isLoading, error, refetch } = useTodo();
  const { forwardToggleTodo, forwardDeleteTodo, isForwarding, activeIntent, relayerOnline } = useTodoIntent();
  const { wallet } = useWallet();

  useEffect(() => {
    if (activeIntent?.status === "completed") void refetch();
  }, [activeIntent?.status, activeIntent?.executionHash, refetch]);

  const handleToggle = async (id: bigint) => {
    if (!wallet.isConnected || !wallet.isOnSupportedSource) {
      return;
    }
    try {
      await forwardToggleTodo(id);
    } catch (err) {
      console.error("Failed to toggle todo:", err);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!wallet.isConnected || !wallet.isOnSupportedSource) {
      return;
    }
    try {
      await forwardDeleteTodo(id);
    } catch (err) {
      console.error("Failed to delete todo:", err);
    }
  };

  return (
    <div className="neo-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[var(--primary)] text-[#0b100c]">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Todo list</h3>
            <p className="text-sm text-[var(--muted)]">Live state on Arc Testnet</p>
          </div>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isLoading}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-2 text-[var(--primary)] hover:border-[var(--primary)] disabled:opacity-50"
          title="Refresh todos"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {mounted && !wallet.isConnected && (
        <div className="mb-4 rounded-lg border border-yellow-300/30 bg-yellow-300/10 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-yellow-200">
            <AlertCircle className="w-4 h-4" />
            Connect wallet to toggle or delete todos
          </p>
        </div>
      )}

      {mounted && wallet.isConnected && !wallet.isOnSupportedSource && (
        <div className="mb-4 rounded-lg border border-yellow-300/30 bg-yellow-300/10 p-4">
          <p className="text-sm font-bold text-yellow-200">
            Choose a configured source network to toggle or delete todos
          </p>
        </div>
      )}

      {mounted && wallet.isConnected && wallet.isOnSupportedSource && !relayerOnline && <p className="mb-4 rounded-lg border border-yellow-300/30 bg-yellow-300/10 p-4 text-sm text-yellow-200">The relayer is offline. Toggle and delete are paused until it resumes.</p>}

      {error ? (
        <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4">
          <p className="font-bold text-[var(--danger)]">Error: {error}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {!mounted || isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-black/40" />
              <p className="text-[var(--muted)]">Loading todos...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--line)] py-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 size-12 text-white/20" />
              <p className="font-medium text-[var(--muted)]">No todos yet. Add one to get started!</p>
            </div>
          ) : (
            todos.map((todo, index) => (
              <div
                key={todo.id.toString()}
                className={`flex items-center gap-3 rounded-lg border border-[var(--line)] p-4 transition-all hover:border-[var(--primary)] ${
                  todo.completed 
                    ? "bg-white/5 opacity-75" 
                    : "bg-[var(--surface-soft)]"
                }`}
              >
                <button
                  onClick={() => handleToggle(BigInt(index))}
                  disabled={isForwarding || !wallet.isConnected || !wallet.isOnSupportedSource || !relayerOnline}
                  className="shrink-0 rounded-lg border border-[var(--line)] p-2 text-[var(--primary)] hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  title={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                  {todo.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-black/40" />
                  )}
                </button>
                <span
                  className={`flex-1 break-words font-medium text-white ${
                    todo.completed ? "text-[var(--muted)] line-through" : ""
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => handleDelete(BigInt(index))}
                  disabled={isForwarding || !wallet.isConnected || !wallet.isOnSupportedSource || !relayerOnline}
                  className="shrink-0 rounded-lg border border-[var(--danger)]/50 bg-[var(--danger)]/10 p-2 transition-colors hover:bg-[var(--danger)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Delete todo"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {mounted && todos.length > 0 && (
        <div className="mt-4 border-t border-[var(--line)] pt-4">
          <p className="text-center text-xs text-[var(--muted)]">
            {todos.filter(t => !t.completed).length} active • {todos.filter(t => t.completed).length} completed
          </p>
        </div>
      )}
    </div>
  );
}
