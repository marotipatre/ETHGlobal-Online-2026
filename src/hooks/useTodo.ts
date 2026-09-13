"use client";

import { useReadContract, useWatchBlockNumber } from "wagmi";
import { encodeFunctionData } from "viem";
import { TODO_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { arcTestnet } from "@/config/chains";

export type TodoItem = { id: bigint; text: string; completed: boolean };

export function useTodo() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.TODO as `0x${string}`,
    abi: TODO_ABI,
    functionName: "getTodos",
    chainId: arcTestnet.id,
    query: { enabled: Boolean(CONTRACT_ADDRESSES.TODO) },
  });

  useWatchBlockNumber({ chainId: arcTestnet.id, onBlockNumber: () => { void refetch(); } });
  const todos: TodoItem[] = Array.isArray(data) ? data.map((item) => ({
    id: BigInt(item.id), text: item.text, completed: item.completed,
  })) : [];
  return {
    todos,
    isLoading,
    error: !CONTRACT_ADDRESSES.TODO ? "Todo address is not configured" : error?.message || (data != null && !Array.isArray(data) ? "Invalid Todo response" : null),
    refetch,
    encodeAddTodo: (text: string) => encodeFunctionData({ abi: TODO_ABI, functionName: "addTodo", args: [text] }),
    encodeToggleTodo: (id: bigint) => encodeFunctionData({ abi: TODO_ABI, functionName: "toggleTodo", args: [id] }),
    encodeDeleteTodo: (id: bigint) => encodeFunctionData({ abi: TODO_ABI, functionName: "deleteTodo", args: [id] }),
  };
}
