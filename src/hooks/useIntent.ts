"use client";

import { useState, useCallback, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from "wagmi";
import { ARC_GATEWAY_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { somniaTestnet } from "@/config/chains";

export type IntentStatus = "idle" | "pending" | "detected" | "executing" | "completed" | "failed";

export type Intent = {
  txHash: string;
  user: string;
  target: string;
  nonce: number;
  timestamp: number;
  status: IntentStatus;
  executionHash?: string;
};

export function useIntent() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [intents, setIntents] = useState<Intent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { writeContract, data: hash, isPending: isForwarding, error: writeError } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    chainId: somniaTestnet.id,
  });

  const forwardIntent = useCallback(async () => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (chainId !== somniaTestnet.id) {
      throw new Error(`Please switch to ${somniaTestnet.name}`);
    }

    setError(null);

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.ARC_GATEWAY as `0x${string}`,
        abi: ARC_GATEWAY_ABI,
        functionName: "forwardIntent",
        args: [CONTRACT_ADDRESSES.COUNTER as `0x${string}`],
        chainId: somniaTestnet.id,
      });
    } catch (err: any) {
      console.error("Error forwarding intent:", err);
      setError(err.message || "Failed to forward intent");
      throw err;
    }
  }, [address, chainId, writeContract]);

  // Handle pending transaction (temporary state until JSON file is updated)
  useEffect(() => {
    if (hash && address) {
      const intent: Intent = {
        txHash: hash,
        user: address,
        target: CONTRACT_ADDRESSES.COUNTER,
        nonce: 0,
        timestamp: Date.now(),
        status: "pending",
      };

      setIntents((prev) => {
        // Check if this intent already exists
        const exists = prev.find((i) => i.txHash === hash);
        if (exists) return prev;
        return [intent, ...prev];
      });
    }
  }, [hash, address]);

  // Update error state
  useEffect(() => {
    if (writeError) {
      setError(writeError.message || "Failed to forward intent");
    }
  }, [writeError]);

  // Fetch intent history from JSON file (maintained by relayer)
  useEffect(() => {
    const fetchIntentHistory = async () => {
      if (!address) {
        setIntents([]);
        return;
      }

      setIsLoadingHistory(true);
      try {
        const response = await fetch("/intent-history.json");
        if (response.ok) {
          const allIntents: Intent[] = await response.json();
          // Filter intents for current user
          const userIntents = allIntents.filter(
            (i) => i.user.toLowerCase() === address.toLowerCase()
          );
          
          // Sort by timestamp (newest first)
          userIntents.sort((a, b) => b.timestamp - a.timestamp);
          
          // Merge with pending intents (from current session)
          setIntents((prev) => {
            const pendingIntents = prev.filter((i) => i.status === "pending");
            const existingIds = new Set(
              userIntents.map((i) => `${i.user.toLowerCase()}-${i.nonce}`)
            );
            
            // Keep pending intents that aren't in JSON yet
            const newPending = pendingIntents.filter(
              (i) => !existingIds.has(`${i.user.toLowerCase()}-${i.nonce}`)
            );
            
            // Merge and sort
            const merged = [...userIntents, ...newPending];
            merged.sort((a, b) => b.timestamp - a.timestamp);
            return merged;
          });
          
          console.log(`📚 Loaded ${userIntents.length} intents from JSON file`);
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
    forwardIntent,
    isForwarding: isForwarding || isConfirming,
    isLoadingHistory,
    error,
  };
}
