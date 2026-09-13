"use client";

import { useReadContract, useWatchBlockNumber } from "wagmi";
import { COUNTER_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { arcTestnet } from "@/config/chains";

export function useCounter() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.COUNTER as `0x${string}`,
    abi: COUNTER_ABI,
    functionName: "getCount",
    chainId: arcTestnet.id,
    query: { enabled: Boolean(CONTRACT_ADDRESSES.COUNTER) },
  });

  useWatchBlockNumber({ chainId: arcTestnet.id, onBlockNumber: () => { void refetch(); } });
  return {
    count: data === undefined ? null : Number(data),
    isLoading,
    error: !CONTRACT_ADDRESSES.COUNTER ? "Counter address is not configured" : error?.message || null,
    refetch,
  };
}
