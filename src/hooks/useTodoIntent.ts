"use client";

import { encodeFunctionData } from "viem";
import { TODO_ABI } from "@/lib/contracts";
import { useIntentFlow, type IntentRecord, type IntentStatus } from "./IntentFlowContext";

export type TodoIntentStatus = IntentStatus;
export type TodoIntent = IntentRecord & { action: "add" | "toggle" | "delete" | "unknown"; data: string };

export function useTodoIntent() {
  const flow = useIntentFlow();
  return {
    intents: flow.intents.map((item) => ({ ...item, action: item.action || "unknown", data: item.data || "" })) as TodoIntent[],
    forwardAddTodo: (text: string) => flow.submit(encodeFunctionData({ abi: TODO_ABI, functionName: "addTodo", args: [text] }), "add", text),
    forwardToggleTodo: (id: bigint) => flow.submit(encodeFunctionData({ abi: TODO_ABI, functionName: "toggleTodo", args: [id] }), "toggle", id.toString()),
    forwardDeleteTodo: (id: bigint) => flow.submit(encodeFunctionData({ abi: TODO_ABI, functionName: "deleteTodo", args: [id] }), "delete", id.toString()),
    isForwarding: flow.isForwarding,
    isLoadingHistory: flow.isLoadingHistory,
    error: flow.error,
    phase: flow.phase,
    activeIntent: flow.activeIntent,
    relayerOnline: flow.relayerOnline,
    source: flow.source,
    refetchHistory: flow.refresh,
  };
}
