"use client";

import { useState, useEffect } from "react";
import { useReadContract, useWatchBlockNumber } from "wagmi";
import { TODO_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { arcTestnet } from "@/config/chains";
import { encodeFunctionData } from "viem";

export type TodoItem = {
  id: bigint;
  text: string;
  completed: boolean;
};

export function useTodo() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, error: readError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.TODO as `0x${string}`,
    abi: TODO_ABI,
    functionName: "getTodos",
    chainId: arcTestnet.id,
    query: {
      enabled: !!CONTRACT_ADDRESSES.TODO && CONTRACT_ADDRESSES.TODO !== "",
    },
  });

  // Watch for new blocks to refetch
  useWatchBlockNumber({
    chainId: arcTestnet.id,
    onBlockNumber: () => {
      refetch();
    },
  });

  useEffect(() => {
    if (data !== undefined && data !== null) {
      try {
        // Check if data is an array
        if (!Array.isArray(data)) {
          console.error("Expected array but got:", typeof data, data);
          setError("Invalid data format from contract");
          setTodos([]);
          return;
        }
        const formattedTodos: TodoItem[] = data.map((item: any) => {
          // Handle both object format (struct) and tuple format (fallback)
          if (typeof item === 'object' && item !== null && 'id' in item) {
            // Struct format: { id, text, completed }
            return {
              id: BigInt(item.id),
              text: item.text || '',
              completed: item.completed || false,
            };
          } else if (Array.isArray(item) && item.length === 3) {
            // Tuple format: [id, text, completed] (fallback)
            return {
              id: BigInt(item[0]),
              text: item[1] || '',
              completed: item[2] || false,
            };
          } else {
            throw new Error(`Invalid todo item format: ${JSON.stringify(item)}`);
          }
        });
        
        setTodos(formattedTodos);
        setError(null);
      } catch (err) {
        console.error("Error formatting todos:", err);
        setError(err instanceof Error ? err.message : "Failed to format todos");
        setTodos([]);
      }
    } else if (data === null) {
      // Contract returned null (no todos)
      setTodos([]);
      setError(null);
    }
    
    if (readError) {
      setError(readError.message || "Failed to fetch todos");
    }
  }, [data, readError]);

  // Helper function to encode addTodo calldata
  const encodeAddTodo = (text: string): `0x${string}` => {
    return encodeFunctionData({
      abi: TODO_ABI,
      functionName: "addTodo",
      args: [text],
    });
  };

  // Helper function to encode toggleTodo calldata
  const encodeToggleTodo = (id: bigint): `0x${string}` => {
    return encodeFunctionData({
      abi: TODO_ABI,
      functionName: "toggleTodo",
      args: [id],
    });
  };

  // Helper function to encode deleteTodo calldata
  const encodeDeleteTodo = (id: bigint): `0x${string}` => {
    return encodeFunctionData({
      abi: TODO_ABI,
      functionName: "deleteTodo",
      args: [id],
    });
  };

  return {
    todos,
    isLoading,
    error,
    refetch,
    encodeAddTodo,
    encodeToggleTodo,
    encodeDeleteTodo,
  };
}
