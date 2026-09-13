"use client";

import { useState, useEffect } from "react";
import { useReadContract, useWatchBlockNumber } from "wagmi";
import { COUNTER_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { arcTestnet } from "@/config/chains";

export function useCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, error: readError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.COUNTER as `0x${string}`,
    abi: COUNTER_ABI,
    functionName: "getCount",
    chainId: arcTestnet.id,
  });

  // Watch for new blocks to refetch
  useWatchBlockNumber({
    chainId: arcTestnet.id,
    onBlockNumber: () => {
      refetch();
    },
  });

  useEffect(() => {
    if (data !== undefined) {
      setCount(Number(data));
      setError(null);
    }
    if (readError) {
      setError(readError.message || "Failed to fetch counter");
    }
  }, [data, readError]);

  return {
    count,
    isLoading,
    error,
    refetch,
  };
}
