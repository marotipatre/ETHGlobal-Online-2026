"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Zap, Loader2, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { useTodoIntent } from "@/hooks/useTodoIntent";
import { useWallet } from "@/hooks/useWallet";
import { somniaTestnet } from "@/config/chains";

export function TodoForwarder() {
  const [mounted, setMounted] = useState(false);
  const { wallet } = useWallet();
  const { forwardAddTodo, isForwarding, error, intents } = useTodoIntent();
  const [todoText, setTodoText] = useState("");
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddTodo = async () => {
    if (!todoText.trim()) {
      return;
    }

    try {
      setLastTxHash(null);
      console.log("🚀 Starting addTodo flow with text:", todoText.trim());
      await forwardAddTodo(todoText.trim());
      console.log("✅ forwardAddTodo completed");
      setTodoText("");
    } catch (err) {
      console.error("❌ Failed to add todo:", err);
    }
  };

  const isOnCorrectNetwork = wallet.isOnSomnia;

  // Update lastTxHash when we get a new intent
  useEffect(() => {
    if (intents.length > 0 && intents[0].txHash) {
      setLastTxHash(intents[0].txHash);
      console.log("📝 Latest intent hash:", intents[0].txHash, "status:", intents[0].status);
    }
  }, [intents]);

  return (
    <div className="neo-card p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="grid size-11 place-items-center rounded-xl bg-[var(--secondary)] text-[#0b100c]">
          <Plus className="size-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Add todo</h3>
          <p className="text-sm text-[var(--muted)]">
            Sign on {somniaTestnet.name}, execute on Arc
          </p>
        </div>
      </div>

      {mounted && !wallet.isConnected && (
        <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Connect your wallet to add todos
          </p>
        </div>
      )}

      {mounted && wallet.isConnected && !isOnCorrectNetwork && (
        <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 font-bold">
            Please switch to {somniaTestnet.name} (Chain ID: {somniaTestnet.id})
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-bold">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <input
            type="text"
            value={todoText}
            onChange={(e) => setTodoText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !isForwarding) {
                handleAddTodo();
              }
            }}
            placeholder="Enter todo text..."
            disabled={!mounted || isForwarding || !wallet.isConnected || !isOnCorrectNetwork}
            className="neo-input w-full px-4 py-3 font-medium placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Button
          onClick={handleAddTodo}
          disabled={!mounted || !wallet.isConnected || isForwarding || !isOnCorrectNetwork || !todoText.trim()}
          size="lg"
          className="w-full shadow-[0_0_24px_#c9ff3d26] disabled:cursor-not-allowed"
        >
          {isForwarding ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Adding Todo...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Add Todo via Intent
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 rounded-lg border border-[var(--line)] bg-black/20 p-4">
        <p className="mb-2 text-sm font-bold text-[var(--primary)]">
          💡 How it works:
        </p>
        <ul className="space-y-1.5 text-sm text-[var(--muted)]">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Sign transaction on {somniaTestnet.name}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>Emit IntentForwardedWithData event</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>Relayer detects and executes on Arc Chain</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>Todo appears in the list automatically</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
