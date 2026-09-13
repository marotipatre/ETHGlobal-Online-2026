"use client";

import { useState, useCallback, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from "wagmi";
import { ARC_GATEWAY_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { somniaTestnet } from "@/config/chains";
import { useTodo } from "./useTodo";

export type TodoIntentStatus = "idle" | "pending" | "detected" | "executing" | "completed" | "failed";

export type TodoIntent = {
  txHash: string;
  user: string;
  target: string;
  action: "add" | "toggle" | "delete";
  data: string;
  nonce: number;
  timestamp: number;
  status: TodoIntentStatus;
  executionHash?: string;
};

export function useTodoIntent() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { encodeAddTodo, encodeToggleTodo, encodeDeleteTodo } = useTodo();
  const [intents, setIntents] = useState<TodoIntent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  // Track the last action type for pending intents
  const [lastAction, setLastAction] = useState<"add" | "toggle" | "delete" | null>(null);
  const [lastActionData, setLastActionData] = useState<string>("");

  const { writeContract, data: hash, isPending: isForwarding, error: writeError } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    chainId: somniaTestnet.id,
  });

  const forwardAddTodo = useCallback(async (text: string) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (chainId !== somniaTestnet.id) {
      throw new Error(`Please switch to ${somniaTestnet.name}`);
    }

    if (!CONTRACT_ADDRESSES.TODO || CONTRACT_ADDRESSES.TODO === "") {
      throw new Error("Todo contract address not configured");
    }

    setError(null);

    try {
      const data = encodeAddTodo(text);
      console.log("📝 Encoding addTodo:", {
        text,
        data,
        target: CONTRACT_ADDRESSES.TODO,
        gateway: CONTRACT_ADDRESSES.ARC_GATEWAY,
      });
      
      setLastAction("add");
      setLastActionData(text);
      
      writeContract({
        address: CONTRACT_ADDRESSES.ARC_GATEWAY as `0x${string}`,
        abi: ARC_GATEWAY_ABI,
        functionName: "forwardIntentWithData",
        args: [CONTRACT_ADDRESSES.TODO as `0x${string}`, data],
        chainId: somniaTestnet.id,
      });
      
      console.log("✅ writeContract called successfully");
    } catch (err: any) {
      console.error("❌ Error forwarding intent:", err);
      setError(err.message || "Failed to forward intent");
      setLastAction(null);
      setLastActionData("");
      throw err;
    }
  }, [address, chainId, writeContract, encodeAddTodo]);

  const forwardToggleTodo = useCallback(async (id: bigint) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (chainId !== somniaTestnet.id) {
      throw new Error(`Please switch to ${somniaTestnet.name}`);
    }

    if (!CONTRACT_ADDRESSES.TODO || CONTRACT_ADDRESSES.TODO === "") {
      throw new Error("Todo contract address not configured");
    }

    setError(null);

    try {
      const data = encodeToggleTodo(id);
      setLastAction("toggle");
      setLastActionData(id.toString());
      writeContract({
        address: CONTRACT_ADDRESSES.ARC_GATEWAY as `0x${string}`,
        abi: ARC_GATEWAY_ABI,
        functionName: "forwardIntentWithData",
        args: [CONTRACT_ADDRESSES.TODO as `0x${string}`, data],
        chainId: somniaTestnet.id,
      });
    } catch (err: any) {
      console.error("Error forwarding intent:", err);
      setError(err.message || "Failed to forward intent");
      setLastAction(null);
      setLastActionData("");
      throw err;
    }
  }, [address, chainId, writeContract, encodeToggleTodo]);

  const forwardDeleteTodo = useCallback(async (id: bigint) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (chainId !== somniaTestnet.id) {
      throw new Error(`Please switch to ${somniaTestnet.name}`);
    }

    if (!CONTRACT_ADDRESSES.TODO || CONTRACT_ADDRESSES.TODO === "") {
      throw new Error("Todo contract address not configured");
    }

    setError(null);

    try {
      const data = encodeDeleteTodo(id);
      setLastAction("delete");
      setLastActionData(id.toString());
      writeContract({
        address: CONTRACT_ADDRESSES.ARC_GATEWAY as `0x${string}`,
        abi: ARC_GATEWAY_ABI,
        functionName: "forwardIntentWithData",
        args: [CONTRACT_ADDRESSES.TODO as `0x${string}`, data],
        chainId: somniaTestnet.id,
      });
    } catch (err: any) {
      console.error("Error forwarding intent:", err);
      setError(err.message || "Failed to forward intent");
      setLastAction(null);
      setLastActionData("");
      throw err;
    }
  }, [address, chainId, writeContract, encodeDeleteTodo]);

  // Handle pending transaction
  useEffect(() => {
    if (hash && address) {
      console.log("📨 Transaction hash received:", hash, "lastAction:", lastAction);
      
      if (lastAction) {
        const intent: TodoIntent = {
          txHash: hash,
          user: address,
          target: CONTRACT_ADDRESSES.TODO,
          action: lastAction,
          data: lastActionData,
          nonce: 0,
          timestamp: Date.now(),
          status: "pending",
        };

        setIntents((prev) => {
          const exists = prev.find((i) => i.txHash === hash);
          if (exists) {
            console.log("⚠️ Intent already exists, skipping");
            return prev;
          }
          console.log("✅ Adding new intent to list");
          return [intent, ...prev];
        });
        
        // Reset action tracking
        setLastAction(null);
        setLastActionData("");
      } else {
        console.warn("⚠️ Hash received but no lastAction set");
      }
    }
  }, [hash, address, lastAction, lastActionData]);

  // Update error state
  useEffect(() => {
    if (writeError) {
      console.error("❌ Write error:", writeError);
      setError(writeError.message || "Failed to forward intent");
      // Reset action tracking on error
      setLastAction(null);
      setLastActionData("");
    }
  }, [writeError]);

  // Fetch intent history from JSON file (maintained by relayer)
  useEffect(() => {
    const fetchIntentHistory = async () => {
      if (!address || !CONTRACT_ADDRESSES.TODO || CONTRACT_ADDRESSES.TODO === "") {
        setIntents([]);
        return;
      }

      setIsLoadingHistory(true);
      try {
        const response = await fetch("/intent-history.json");
        if (response.ok) {
          const allIntents: Array<{
            txHash: string;
            user: string;
            target: string;
            nonce: number;
            timestamp: number;
            status: string;
            executionHash?: string;
          }> = await response.json();
          
          // Filter intents for current user and TODO contract
          const todoIntents = allIntents.filter(
            (i) => 
              i.user.toLowerCase() === address.toLowerCase() &&
              i.target.toLowerCase() === CONTRACT_ADDRESSES.TODO.toLowerCase()
          );
          
          // Convert to TodoIntent format
          // Note: We can't determine action type from JSON, so we'll use "add" as default
          // In a real implementation, the relayer would include action metadata
          const formattedIntents: TodoIntent[] = todoIntents.map((i) => ({
            txHash: i.txHash,
            user: i.user,
            target: i.target,
            action: "add", // Default - could be enhanced with metadata
            data: "",
            nonce: i.nonce,
            timestamp: i.timestamp,
            status: i.status as TodoIntentStatus,
            executionHash: i.executionHash,
          }));
          
          // Sort by timestamp (newest first)
          formattedIntents.sort((a, b) => b.timestamp - a.timestamp);
          
          // Merge with pending intents (from current session)
          setIntents((prev) => {
            const pendingIntents = prev.filter((i) => i.status === "pending");
            const existingIds = new Set(
              formattedIntents.map((i) => `${i.user.toLowerCase()}-${i.nonce}`)
            );
            
            // Keep pending intents that aren't in JSON yet
            const newPending = pendingIntents.filter(
              (i) => !existingIds.has(`${i.user.toLowerCase()}-${i.nonce}`)
            );
            
            // Merge and sort
            const merged = [...formattedIntents, ...newPending];
            merged.sort((a, b) => b.timestamp - a.timestamp);
            return merged;
          });
          
          console.log(`📚 Loaded ${formattedIntents.length} todo intents from JSON file`);
        } else {
          console.warn("Could not load intent history JSON file");
          setIntents([]);
        }
      } catch (err) {
        console.error("Error fetching intent history:", err);
        setError("Failed to load intent history");
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchIntentHistory();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchIntentHistory, 5000);
    
    return () => clearInterval(interval);
  }, [address]);

  return {
    intents,
    forwardAddTodo,
    forwardToggleTodo,
    forwardDeleteTodo,
    isForwarding: isForwarding || isConfirming,
    isLoadingHistory,
    error,
    refetchHistory: () => {
      // Trigger a refetch by updating address dependency
      // This is a workaround - in a real implementation, we'd have a proper refetch function
    },
  };
}
